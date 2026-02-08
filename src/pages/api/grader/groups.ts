import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

/**
 * Lista los grupos del assessment del calificador que aún no ha calificado.
 * POST body: { idCalificador, idBase }
 * Excluye grupos donde el calificador ya envió calificaciones (misma base).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  if (!requireRoles(req, res, ['admin', 'calificador'])) return;

  try {
    const { idCalificador, idBase } = req.body;

    if (!idCalificador || isNaN(Number(idCalificador))) {
      return res.status(400).json({ error: 'idCalificador inválido' });
    }

    const { data: staff, error: staffError } = await supabase
      .from('Staff')
      .select('ID_Assessment')
      .eq('ID_Staff', Number(idCalificador))
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ error: 'Calificador no encontrado' });
    }

    const assessmentId = staff.ID_Assessment;

    const { data: participantes, error: partError } = await supabase
      .from('Participante')
      .select('ID_GrupoAssessment')
      .eq('ID_Assessment', assessmentId)
      .not('ID_GrupoAssessment', 'is', null);

    if (partError) throw partError;

    const groupIds = Array.from(
      new Set(
        (participantes || [])
          .map((p) => p.ID_GrupoAssessment as number)
          .filter((id): id is number => typeof id === 'number')
      )
    );

    if (groupIds.length === 0) {
      return res.status(200).json([]);
    }

    let groupIdsToReturn = groupIds;

    if (idBase != null && idBase !== '' && !isNaN(Number(idBase))) {
      const { data: gradedRows, error: gradedError } = await supabase
        .from('CalificacionesPorPersona')
        .select('ID_Participante')
        .eq('ID_Assessment', assessmentId)
        .eq('ID_Base', Number(idBase))
        .eq('ID_Staff', Number(idCalificador));

      if (gradedError) throw gradedError;

      const gradedParticipantIds = new Set(
        (gradedRows || []).map((r) => r.ID_Participante).filter((id): id is number => typeof id === 'number')
      );

      if (gradedParticipantIds.size > 0) {
        const { data: participantesConGrupo, error: partGrupoError } = await supabase
          .from('Participante')
          .select('ID_Participante, ID_GrupoAssessment')
          .eq('ID_Assessment', assessmentId)
          .in('ID_Participante', Array.from(gradedParticipantIds))
          .not('ID_GrupoAssessment', 'is', null);

        if (partGrupoError) throw partGrupoError;

        const alreadyGradedGroupIds = new Set(
          (participantesConGrupo || []).map((p) => p.ID_GrupoAssessment as number).filter((id): id is number => typeof id === 'number')
        );

        groupIdsToReturn = groupIds.filter((id) => !alreadyGradedGroupIds.has(id));
      }
    }

    if (groupIdsToReturn.length === 0) {
      return res.status(200).json([]);
    }

    const { data: groups, error: groupsError } = await supabase
      .from('GrupoAssessment')
      .select('ID_GrupoAssessment, Nombre_GrupoAssessment')
      .in('ID_GrupoAssessment', groupIdsToReturn)
      .order('ID_GrupoAssessment', { ascending: true });

    if (groupsError) throw groupsError;

    res.status(200).json(
      (groups || []).map((g) => ({
        id: g.ID_GrupoAssessment,
        nombre: g.Nombre_GrupoAssessment,
      }))
    );
  } catch (error) {
    console.error('❌ Error al listar grupos del calificador:', error);
    res.status(500).json({ error: 'Error al listar grupos' });
  }
}
