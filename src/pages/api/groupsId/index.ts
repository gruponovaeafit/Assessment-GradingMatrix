import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  if (!requireRoles(req, res, ['admin', 'calificador'])) return;

  try {
    const { idCalificador } = req.body;

    if (!idCalificador || isNaN(Number(idCalificador))) {
      return res.status(400).json({ error: 'ID de calificador inválido' });
    }

    const { data: staff, error: staffError } = await supabase
      .from('Staff')
      .select('ID_Assessment, ID_GrupoAssessment')
      .eq('ID_Staff', Number(idCalificador))
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ message: 'Calificador no encontrado' });
    }

    if (!staff.ID_GrupoAssessment) {
      return res.status(400).json({ error: 'Calificador sin grupo asignado' });
    }

    const { data: participantes, error: participantesError } = await supabase
      .from('Participante')
      .select(
        'ID_Participante, Nombre_Participante, Rol_Participante, FotoUrl_Participante, Grupo:GrupoAssessment(Nombre_GrupoAssessment)'
      )
      .eq('ID_Assessment', staff.ID_Assessment)
      .eq('ID_GrupoAssessment', staff.ID_GrupoAssessment)
      .order('ID_Participante', { ascending: true });

    if (participantesError) {
      throw new Error(participantesError.message);
    }

    if (!participantes || participantes.length === 0) {
      return res.status(404).json({ message: 'No se encontraron personas en este assessment' });
    }

    const payload = participantes.map((p) => ({
      ID_Persona: p.ID_Participante,
      ID: p.ID_Participante,
      Nombre: p.Nombre_Participante,
      role: p.Rol_Participante ?? '0',
      Grupo: p.Grupo?.[0]?.Nombre_GrupoAssessment ?? null,
      Photo: p.FotoUrl_Participante ?? null,
    }));

    res.status(200).json(payload);
  } catch (error) {
    console.error('❌ Error al obtener los miembros del grupo:', error);
    res.status(500).json({ error: 'Error al obtener los miembros del grupo' });
  }
}
