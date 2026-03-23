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

  const { assessmentId, participanteId, grupoAssessmentId } = req.body;

  // Si no viene assessmentId, intentamos obtenerlo del usuario (JWT)
  const finalAssessmentId = assessmentId || getAuthorizedAssessmentId(user, res);
  if (!finalAssessmentId) return;

  if (!participanteId) {
    return res.status(400).json({ error: 'participanteId es obligatorio' });
  }

  try {
    const { error } = await supabase
      .from('Participante')
      .update({ 
        ID_GrupoAssessment: grupoAssessmentId === null ? null : Number(grupoAssessmentId) 
      })
      .eq('ID_Assessment', Number(finalAssessmentId))
      .eq('ID_Participante', Number(participanteId));

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ 
      message: grupoAssessmentId === null 
        ? 'Participante desvinculado del grupo' 
        : 'Participante asignado al grupo' 
    });
  } catch (error) {
    console.error('❌ Error al gestionar grupo de participante:', error);
    res.status(500).json({ error: 'Error al gestionar grupo de participante' });
  }
}
