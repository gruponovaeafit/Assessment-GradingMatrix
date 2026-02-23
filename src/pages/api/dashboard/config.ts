// pages/api/dashboard/config.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from '@/lib/supabaseServer';
import { getDefaultAssessmentId } from "@/lib/assessment";
import { requireRoles } from "@/lib/apiAuth";
import { resolveParticipantPhotoUrls } from "@/lib/participantPhotoUrl";

// API para obtener datos del dashboard admin
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!requireRoles(req, res, ["admin"])) return;
    const assessmentId = req.query.assessmentId 
    ? Number(req.query.assessmentId) 
    : await getDefaultAssessmentId();

    const { data: assessment, error: assessmentError } = await supabase
    .from('Assessment')
    .select('ID_Assessment, Nombre_Assessment')
    .eq('ID_Assessment', assessmentId)
    .single();

    const { data: participantes, error: participantesError } = await supabase
      .from('Participante')
      .select(
        'ID_Participante, Nombre_Participante, Correo_Participante, Rol_Participante, FotoUrl_Participante, ID_GrupoAssessment, GrupoAssessment(Nombre_GrupoAssessment)'
      )
      .eq('ID_Assessment', assessmentId)
      .order('ID_Participante', { ascending: true });

    if (participantesError) {
      throw new Error(participantesError.message);
    }

    const { data: calificaciones, error: calificacionesError } = await supabase
      .from('CalificacionesPorPersona')
      .select('ID_Participante, ID_Base, Calificacion_1, Calificacion_2, Calificacion_3')
      .eq('ID_Assessment', assessmentId);

    if (calificacionesError) {
      throw new Error(calificacionesError.message);
    }

    const basePromByPersona: Record<number, Record<number, number>> = {};

    for (const cal of calificaciones || []) {
      const id = cal.ID_Participante as number;
      const baseId = cal.ID_Base as number;
      const califs = [cal.Calificacion_1, cal.Calificacion_2, cal.Calificacion_3].filter(
        (x) => x !== null && x !== undefined
      ) as number[];

      if (califs.length === 0) {
        continue;
      }

      const promedio = califs.reduce((a, b) => a + b, 0) / califs.length;

      if (!basePromByPersona[id]) {
        basePromByPersona[id] = {};
      }

      basePromByPersona[id][baseId] = promedio;
    }

    const generalPromByPersona: Record<number, number | null> = {};

    for (const [idString, bases] of Object.entries(basePromByPersona)) {
      const proms = Object.values(bases);
      generalPromByPersona[Number(idString)] =
        proms.length > 0 ? proms.reduce((a, b) => a + b, 0) / proms.length : null;
    }

    const photoUrls = await resolveParticipantPhotoUrls(
      supabase,
      (participantes || []).map((p) => p.FotoUrl_Participante)
    );

    const data = (participantes || []).map((p, i) => {
      const promedio = generalPromByPersona[p.ID_Participante] ?? null;

      const grupoNombre = p.GrupoAssessment 
        ? (Array.isArray(p.GrupoAssessment) 
            ? p.GrupoAssessment[0]?.Nombre_GrupoAssessment 
            : (p.GrupoAssessment as any).Nombre_GrupoAssessment)
        : null;

      return {
        Grupo: grupoNombre ?? 'Sin grupo',        
        ID: p.ID_Participante,
        Participante: p.Nombre_Participante,
        Correo: p.Correo_Participante,
        role: p.Rol_Participante ?? '0',
        Photo: photoUrls[i] ?? null,
        Calificacion_Promedio: promedio,
        Estado: promedio != null ? "Completado" : "Pendiente",
        AssessmentId: assessmentId,
        AssessmentNombre: assessment?.Nombre_Assessment ?? 'Sin assessment'
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Error al obtener los datos del dashboard:", error);
    res.status(500).json({ error: "Error al obtener los datos del dashboard" });
  }
}
