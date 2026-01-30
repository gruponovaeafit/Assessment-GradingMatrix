import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { assessmentId, participanteId, grupoAssessmentId } = req.body;

  if (!assessmentId || !participanteId || !grupoAssessmentId) {
    return res.status(400).json({ error: 'assessmentId, participanteId y grupoAssessmentId son obligatorios' });
  }

  try {
    const { error } = await supabase
      .from('Participante')
      .update({ ID_GrupoAssessment: Number(grupoAssessmentId) })
      .eq('ID_Assessment', Number(assessmentId))
      .eq('ID_Participante', Number(participanteId));

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ message: 'Participante asignado al grupo' });
  } catch (error) {
    console.error('❌ Error al asignar participante:', error);
    res.status(500).json({ error: 'Error al asignar participante' });
  }
}
