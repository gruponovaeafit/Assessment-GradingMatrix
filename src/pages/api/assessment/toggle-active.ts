import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  const { assessmentId: payloadAssessmentId, activo } = req.body;

  let authorizedAssessmentId = null;
  if (user.id !== 0) {
    authorizedAssessmentId = getAuthorizedAssessmentId(user, res);
    if (!authorizedAssessmentId) return;
  }

  if (payloadAssessmentId && authorizedAssessmentId && Number(payloadAssessmentId) !== authorizedAssessmentId) {
    return res.status(403).json({ error: 'Solo puedes activar/desactivar tu propio assessment' });
  }

  const assessmentId = payloadAssessmentId ? Number(payloadAssessmentId) : authorizedAssessmentId;

  if (activo === undefined) {
    return res.status(400).json({ error: 'activo es obligatorio' });
  }

  try {
    const { data, error } = await supabase
      .from('Assessment')
      .update({ Activo_Assessment: Boolean(activo) })
      .eq('ID_Assessment', Number(assessmentId))
      .select('ID_Assessment, Activo_Assessment, ID_GrupoEstudiantil')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error actualizando assessment');
    }

    if (activo) {
      const groupId = data.ID_GrupoEstudiantil as number;
      const { error: deactivateError } = await supabase
        .from('Assessment')
        .update({ Activo_Assessment: false })
        .eq('ID_GrupoEstudiantil', Number(groupId))
        .neq('ID_Assessment', Number(assessmentId));

      if (deactivateError) {
        throw new Error(deactivateError.message);
      }
    }

    res.status(200).json({ message: 'Assessment actualizado', ...data });
  } catch (error) {
    console.error('❌ Error al actualizar assessment:', error);
    res.status(500).json({ error: 'Error al actualizar assessment' });
  }
}
