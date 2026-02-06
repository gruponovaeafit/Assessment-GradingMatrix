import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { hashPassword } from '@/lib/auth';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { staffId, correo, password, assessmentId } = req.body ?? {};

  if (!staffId) {
    return res.status(400).json({ error: 'staffId es obligatorio' });
  }

  const updatePayload: Record<string, string | number> = {
    Rol_Staff: 'admin',
  };

  if (correo) {
    updatePayload.Correo_Staff = correo;
  }

  if (assessmentId) {
    updatePayload.ID_Assessment = Number(assessmentId);
  }

  if (password) {
    updatePayload.Contrasena_Staff = await hashPassword(password);
  }

  if (Object.keys(updatePayload).length === 1) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  try {
    const { data, error } = await supabase
      .from('Staff')
      .update(updatePayload)
      .eq('ID_Staff', Number(staffId))
      .select('ID_Staff')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error actualizando admin');
    }

    res.status(200).json({ message: 'Admin actualizado', id: data.ID_Staff });
  } catch (error) {
    console.error('❌ Error al actualizar admin:', error);
    res.status(500).json({ error: 'Error al actualizar admin' });
  }
}
