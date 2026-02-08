import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';
import { resolveParticipantPhotoUrls } from '@/lib/participantPhotoUrl';

/**
 * Devuelve los participantes de un grupo para que el calificador los califique.
 * POST body: { idCalificador, idGrupo }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  if (!requireRoles(req, res, ['admin', 'calificador'])) return;

  try {
    const { idCalificador, idGrupo } = req.body;

    if (!idCalificador || isNaN(Number(idCalificador))) {
      return res.status(400).json({ error: 'idCalificador inválido' });
    }
    if (idGrupo == null || idGrupo === '' || isNaN(Number(idGrupo))) {
      return res.status(400).json({ error: 'idGrupo inválido' });
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
    const grupoId = Number(idGrupo);

    const { data: participantes, error: participantesError } = await supabase
      .from('Participante')
      .select(
        'ID_Participante, Nombre_Participante, Rol_Participante, FotoUrl_Participante, Grupo:GrupoAssessment(Nombre_GrupoAssessment)'
      )
      .eq('ID_Assessment', assessmentId)
      .eq('ID_GrupoAssessment', grupoId)
      .order('ID_Participante', { ascending: true });

    if (participantesError) throw participantesError;

    if (!participantes || participantes.length === 0) {
      return res.status(200).json([]);
    }

    const photoUrls = await resolveParticipantPhotoUrls(
      supabase,
      participantes.map((p) => p.FotoUrl_Participante)
    );

    const payload = participantes.map((p, i) => ({
      ID_Persona: p.ID_Participante,
      ID: p.ID_Participante,
      Nombre: p.Nombre_Participante,
      role: p.Rol_Participante ?? '0',
      Grupo: p.Grupo?.[0]?.Nombre_GrupoAssessment ?? null,
      Photo: photoUrls[i] ?? null,
    }));

    res.status(200).json(payload);
  } catch (error) {
    console.error('❌ Error al obtener participantes del grupo:', error);
    res.status(500).json({ error: 'Error al obtener participantes' });
  }
}
