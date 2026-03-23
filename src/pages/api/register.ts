import { IncomingForm, File } from 'formidable';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { resolveAssessmentId, getAssessmentIdForStaff, verifyAssessmentAccess } from '@/lib/assessment';
import { requireRoles } from '@/lib/auth/apiAuth';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (entrada)
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// 🔒 unlink seguro (Windows-friendly)
const safeUnlink = async (path: string, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.unlink(path);
      return;
    } catch (err: any) {
      if (err.code === 'EBUSY' || err.code === 'EPERM') {
        await new Promise(res => setTimeout(res, 150));
      } else {
        return;
      }
    }
  }
};

// 📦 Parse multipart/form-data
const parseForm = (
  req: NextApiRequest
): Promise<{ fields: Record<string, any>; files: { image?: File | File[] } }> => {
  const form = new IncomingForm({
    keepExtensions: true,
    maxFileSize: MAX_FILE_SIZE,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  let tmpPath: string | null = null;
  let photoStoragePath: string | null = null;

  try {
    // 🔐 Roles
    const decoded = requireRoles(req, res, ['admin', 'registrador']);
    if (!decoded) return;
    console.log(decoded);

    const { fields, files } = await parseForm(req);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    const nombre = fields.nombre?.toString().trim();
    const correo = fields.correo?.toString().trim().toLowerCase();
    const isImpostor = fields.isImpostor === 'true';

    if (!nombre || !correo) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
    }

    // Resolver ID_Assessment según rol
    let assessmentId: number;
    if (decoded.role === 'registrador') {
      const result = await getAssessmentIdForStaff(decoded.id);
      if ('error' in result) return res.status(result.status).json({ error: result.error });
      assessmentId = result.id;
    } else {
      // Si es admin, intentamos obtener de fields.assessmentId, 
      // si no viene, usamos el assessmentId del token decodificado (decoded.assessmentId).
      const rawId = fields.assessmentId || decoded.assessmentId;
      const result = await resolveAssessmentId(rawId);
      
      if ('error' in result) return res.status(result.status).json({ error: result.error });
      assessmentId = result.id;

      if (!verifyAssessmentAccess(decoded, assessmentId, res)) {
        return;
      }
    }

    // Procesar imagen solo si fue enviada
    let optimizedBuffer: Buffer | null = null;

    if (file?.filepath) {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype || '')) {
        return res.status(400).json({ error: 'Formato de imagen no permitido' });
      }

      if ((file.size || 0) > MAX_FILE_SIZE) {
        return res.status(400).json({ error: 'La imagen supera el tamaño permitido' });
      }

      tmpPath = file.filepath;

      // 🚀 Optimización: Si la imagen ya es WebP y tiene un tamaño razonable (< 600KB),
      // la usamos directamente. Si no, usamos sharp para normalizarla.
      const isAlreadyOptimized = 
        file.mimetype === 'image/webp' && 
        file.size < 600 * 1024;

      if (isAlreadyOptimized) {
        optimizedBuffer = await fs.readFile(tmpPath);
      } else {
        optimizedBuffer = await sharp(tmpPath)
          .resize(512, 512, { fit: 'cover' })
          .webp({ quality: 82 })
          .toBuffer();
      }

      // 🗂️ Subir a Supabase Storage
      const fileName = `participantes/${uuidv4()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('imagenes_participantes')
        .upload(fileName, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Guardar la ruta en Storage (path), no la URL pública. El dashboard generará URLs firmadas
    // para que las fotos carguen aunque el bucket sea privado.
      photoStoragePath = fileName;
    }

    // 🧠 Insertar en DB
    console.log(assessmentId);

    const { data: inserted, error: dbError } = await supabase
      .from('Participante')
      .insert({
        ID_Assessment: assessmentId,
        Nombre_Participante: nombre,
        Correo_Participante: correo,
        Rol_Participante: isImpostor ? '1' : '0',
        FotoUrl_Participante: photoStoragePath, // null si no hay foto
      })
      .select('ID_Participante')
      .single();

    if (dbError) {
      // 🗑️ Si falló la DB, borrar la foto de Storage si se subió
      if (photoStoragePath) {
        await supabase.storage.from('imagenes_participantes').remove([photoStoragePath]);
      }

      if (dbError.code === '23505') {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }
      throw dbError;
    }

    return res.status(200).json({
      message: 'Persona registrada correctamente',
      id: inserted?.ID_Participante ?? null,
      sizeKB: optimizedBuffer ? Math.round(optimizedBuffer.length / 1024) : 0,
    });

  } catch (error) {
    console.error('❌ Error en el registro:', error);
    // 🗑️ Limpiar storage si se alcanzó a subir algo antes del error
    if (photoStoragePath) {
      await supabase.storage.from('imagenes_participantes').remove([photoStoragePath]);
    }
    return res.status(500).json({ error: 'Error al registrar la persona' });
  } finally {
    if (tmpPath) {
      await safeUnlink(tmpPath);
    }
  }
}