import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { hashPassword } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireRoles(req, res, ['admin']);
  if (!user) return;

  if (user.id !== 0) {
    return res.status(403).json({ error: 'Solo el super-admin puede crear assessments' });
  }

  const { grupoEstudiantilId, nombre, descripcion, activo, admin } = req.body;

  if (!grupoEstudiantilId || !nombre) {
    return res.status(400).json({ error: 'grupoEstudiantilId y nombre son obligatorios' });
  }

  try {
    const { data: grupo, error: grupoError } = await supabase
      .from('GrupoEstudiantil')
      .select('ID_GrupoEstudiantil')
      .eq('ID_GrupoEstudiantil', Number(grupoEstudiantilId))
      .single();

    if (grupoError || !grupo) {
      return res.status(400).json({ error: 'ID de GrupoEstudiantil no existe' });
    }

    const { data: assessmentData, error: assessmentError } = await supabase
      .from('Assessment')
      .insert({
        ID_GrupoEstudiantil: Number(grupoEstudiantilId),
        Nombre_Assessment: nombre,
        Descripcion_Assessment: descripcion || null,
        Activo_Assessment: activo !== undefined ? Boolean(activo) : true,
      })
      .select('ID_Assessment')
      .single();

    if (assessmentError || !assessmentData) {
      throw new Error(assessmentError?.message || 'Error creando assessment');
    }

    const assessmentId = assessmentData.ID_Assessment;

    // Optional Admin Creation (Atomic-like via cleanup on failure)
    if (admin && admin.correo && admin.password) {
      try {
        const hashedPassword = await hashPassword(admin.password.trim());
        const { error: adminError } = await supabase
          .from('Staff')
          .insert({
            ID_Assessment: assessmentId,
            Correo_Staff: admin.correo.trim().toLowerCase(),
            Contrasena_Staff: hashedPassword,
            Rol_Staff: 'admin',
            Active: true,
          });

        if (adminError) {
          // Manual Rollback: Delete assessment if admin creation fails
          await supabase.from('Assessment').delete().eq('ID_Assessment', assessmentId);
          
          if (adminError.code === '23505') {
             return res.status(409).json({ error: 'Ya existe un administrador con ese correo en este assessment' });
          }
          throw new Error(adminError.message);
        }
      } catch (err: any) {
        // Ensure assessment is gone if we throw
        await supabase.from('Assessment').delete().eq('ID_Assessment', assessmentId);
        throw err;
      }
    }

    res.status(200).json({ message: 'Assessment creado exitosamente', ID_Assessment: assessmentId });
  } catch (error: any) {
    console.error('❌ Error al crear assessment:', error);
    res.status(500).json({ error: error.message || 'Error al crear assessment' });
  }
}
