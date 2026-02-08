// src/pages/api/check-already-graded.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin', 'calificador'])) return;

  const { idCalificador, idBase } = req.body;

  if (!idCalificador || !idBase) {
    return res.status(400).json({ error: 'idCalificador e idBase son obligatorios' });
  }

  try {
    // Obtener el assessment y grupo actual del calificador
    const { data: staff, error: staffError } = await supabase
      .from('Staff')
      .select('ID_Assessment, ID_GrupoAssessment')
      .eq('ID_Staff', Number(idCalificador))
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ error: 'No se encontró el calificador' });
    }

    const assessmentId = staff.ID_Assessment;
    const grupoActual = staff.ID_GrupoAssessment;

    // Si no tiene grupo asignado, no puede calificar
    if (!grupoActual) {
      return res.status(400).json({ 
        error: 'El calificador no tiene un grupo asignado',
        alreadyGraded: false,
      });
    }

    // ✅ Obtener los participantes del grupo actual del calificador
    const { data: participantesGrupo, error: participantesError } = await supabase
      .from('Participante')
      .select('ID_Participante')
      .eq('ID_Assessment', assessmentId)
      .eq('ID_GrupoAssessment', grupoActual);

    if (participantesError) {
      throw new Error(`Error al obtener participantes: ${participantesError.message}`);
    }

    if (!participantesGrupo || participantesGrupo.length === 0) {
      return res.status(200).json({
        alreadyGraded: false,
        message: 'No hay participantes en este grupo',
      });
    }

    const idsParticipantes = participantesGrupo.map(p => p.ID_Participante);

    // ✅ Verificar si ya calificó a ALGUNO de los participantes de este grupo en esta base
    const { data: existingGrades, error: gradesError } = await supabase
      .from('CalificacionesPorPersona')
      .select('ID_Calificacion')
      .eq('ID_Assessment', assessmentId)
      .eq('ID_Base', Number(idBase))
      .eq('ID_Staff', Number(idCalificador))
      .in('ID_Participante', idsParticipantes)
      .limit(1);

    if (gradesError) {
      throw new Error(`Error al verificar calificaciones: ${gradesError.message}`);
    }

    const alreadyGraded = existingGrades && existingGrades.length > 0;

    res.status(200).json({
      alreadyGraded,
      message: alreadyGraded 
        ? 'Ya has calificado a este grupo anteriormente' 
        : 'Puedes calificar a este grupo',
    });
  } catch (error) {
    console.error('❌ Error verificando calificaciones:', error);
    res.status(500).json({
      error: 'Error al verificar estado de calificaciones',
      details: (error as Error).message,
    });
  }
}
