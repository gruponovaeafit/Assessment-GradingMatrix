import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  const authorizedAssessmentId = getAuthorizedAssessmentId(user, res);
  if (!authorizedAssessmentId) return;

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID de grupo es obligatorio' });
  }

  try {
    // 1. Desvincular participantes
    await supabase
      .from('Participante')
      .update({ ID_GrupoAssessment: null })
      .eq('ID_GrupoAssessment', id);

    // 2. Desvincular staff
    await supabase
      .from('Staff')
      .update({ ID_GrupoAssessment: null })
      .eq('ID_GrupoAssessment', id);

    // 3. Eliminar grupo
    const { error } = await supabase
      .from('GrupoAssessment')
      .delete()
      .eq('ID_GrupoAssessment', id)
      .eq('ID_Assessment', authorizedAssessmentId);

    if (error) throw new Error(error.message);

    res.status(200).json({ message: 'Grupo eliminado con éxito' });
  } catch (error: any) {
    console.error('❌ Error al eliminar grupo:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar grupo' });
  }
}
