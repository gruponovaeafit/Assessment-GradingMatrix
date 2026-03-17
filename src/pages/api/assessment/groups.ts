import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { resolveAssessmentId, verifyAssessmentAccess } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireRoles(req, res, ['admin']);
  if (!user) return;

  const assessmentResult = await resolveAssessmentId(req.query.assessmentId);
  if ('error' in assessmentResult) {
    return res.status(assessmentResult.status).json({ error: assessmentResult.error });
  }
  const assessmentId = assessmentResult.id;

  if (!verifyAssessmentAccess(user, assessmentId, res)) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from('GrupoAssessment')
      .select('ID_GrupoAssessment, Nombre_GrupoAssessment')
      .eq('ID_Assessment', Number(assessmentId))
      .order('ID_GrupoAssessment', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json(
      (data || []).map((item) => ({
        id: item.ID_GrupoAssessment,
        nombre: item.Nombre_GrupoAssessment,
      }))
    );
  } catch (error) {
    console.error('❌ Error al listar grupos:', error);
    res.status(500).json({ error: 'Error al listar grupos' });
  }
}
