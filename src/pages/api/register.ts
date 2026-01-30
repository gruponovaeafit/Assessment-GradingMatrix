import { IncomingForm, File } from 'formidable';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient } from '@azure/storage-blob';
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { getDefaultAssessmentId } from '@/lib/assessment';
import { requireRoles } from '@/lib/apiAuth';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const parseForm = (
  req: NextApiRequest
): Promise<{ fields: Record<string, unknown>; files: { image?: File | File[] } }> => {
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

  try {
    if (!requireRoles(req, res, ['admin', 'registrador'])) return;

    const { fields, files } = await parseForm(req);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    const nombre = fields.nombre?.toString().trim();
    const correo = fields.correo?.toString().trim();

    if (!nombre || !correo || !file || !file.filepath) {
      return res.status(400).json({ error: 'Nombre, correo e imagen son obligatorios' });
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype || '')) {
      await fs.unlink(file.filepath);
      return res.status(400).json({ error: 'Formato de imagen no permitido' });
    }

    if ((file.size || 0) > MAX_FILE_SIZE) {
      await fs.unlink(file.filepath);
      return res.status(400).json({ error: 'La imagen supera el tamaño permitido' });
    }

    // Subir imagen a Azure Blob
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const containerName = 'assessment';
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists();

    const extension = file.originalFilename?.split('.').pop() || 'jpg';
    const blobName = `${uuidv4()}.${extension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadFile(file.filepath, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype || 'application/octet-stream',
      },
    });

    await fs.unlink(file.filepath); // limpiar archivo temporal

    const photoUrl = blockBlobClient.url;

    // Insertar en base de datos Supabase
    const assessmentId = await getDefaultAssessmentId();

    const { error } = await supabase
      .from('Participante')
      .insert({
        ID_Assessment: assessmentId,
        Nombre_Participante: nombre,
        Correo_Participante: correo,
        Rol_Participante: '0',
        FotoUrl_Participante: photoUrl,
      });

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }
      throw new Error(error.message);
    }

    return res.status(200).json({ message: 'Persona registrada correctamente', url: photoUrl });
  } catch (error: unknown) {
    console.error('❌ Error en el registro:', error);
    return res.status(500).json({ error: 'Error al registrar la persona' });
  }
}
