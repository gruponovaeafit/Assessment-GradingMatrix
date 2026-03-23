import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  const { staffId, correo, password, assessmentId: payloadAssessmentId } = req.body ?? {};

  const authorizedAssessmentId = getAuthorizedAssessmentId(user, res);
  if (!authorizedAssessmentId) return;

  if (payloadAssessmentId && Number(payloadAssessmentId) !== authorizedAssessmentId && user.id !== 0) {
    return res.status(403).json({ error: 'Solo puedes asignar staff a tu propio assessment' });
  }

  if (!staffId) {
    return res.status(400).json({ error: 'staffId es obligatorio' });
  }

  const updatePayload: Record<string, string | number> = {
    Rol_Staff: 'admin',
  };

  if (correo) {
    updatePayload.Correo_Staff = correo;
  }

  if (payloadAssessmentId) {
    updatePayload.ID_Assessment = Number(payloadAssessmentId);
  } else {
      updatePayload.ID_Assessment = authorizedAssessmentId;
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
