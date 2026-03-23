import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  const authorizedAssessmentId = getAuthorizedAssessmentId(user, res);
  if (!authorizedAssessmentId) return;

  const { id, active, role, correo } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID es obligatorio' });
  }

  const updateData: Record<string, any> = {};
  if (active !== undefined) updateData.Active = active;
  if (role !== undefined) updateData.Rol_Staff = role;
  if (correo !== undefined) updateData.Correo_Staff = correo;

  try {
    const { error } = await supabase
      .from('Staff')
      .update(updateData)
      .eq('ID_Staff', id)
      .eq('ID_Assessment', authorizedAssessmentId);

    if (error) throw new Error(error.message);

    return res.status(200).json({ message: 'Staff actualizado correctamente' });
  } catch (error: any) {
    console.error('❌ Error al actualizar staff:', error);
    return res.status(500).json({ error: error.message || 'Error al actualizar staff' });
  }
}
