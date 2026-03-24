import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  const assessmentId = getAuthorizedAssessmentId(user, res);
  if (!assessmentId) return;

  try {
    const { data: participantes, error: participantesError } = await supabase
      .from('Participante')
      .select('ID_GrupoAssessment')
      .eq('ID_Assessment', assessmentId)
      .not('ID_GrupoAssessment', 'is', null);

    if (participantesError) {
      throw new Error(participantesError.message);
    }

    const groupIds = Array.from(
      new Set(
        (participantes || [])
          .map((p) => p.ID_GrupoAssessment as number | null)
          .filter((id): id is number => typeof id === 'number')
      )
    );

    if (groupIds.length === 0) {
      return res.status(200).json([]);
    }

    const { data: groups, error: groupsError } = await supabase
      .from('GrupoAssessment')
      .select('ID_GrupoAssessment, Nombre_GrupoAssessment')
      .in('ID_GrupoAssessment', groupIds)
      .order('ID_GrupoAssessment', { ascending: true });

    if (groupsError) {
      throw new Error(groupsError.message);
    }

    res.status(200).json(
      (groups || []).map((item) => ({
        id: item.ID_GrupoAssessment,
        nombre: item.Nombre_GrupoAssessment,
      }))
    );
  } catch (error) {
    console.error('❌ Error al listar grupos activos:', error);
    res.status(500).json({ error: 'Error al listar grupos activos' });
  }
}
