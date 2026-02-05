import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from '@/lib/supabaseServer';
import { getDefaultAssessmentId } from "@/lib/assessment";
import { requireRoles } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!requireRoles(req, res, ["admin"])) return;
    const queryAssessment = Array.isArray(req.query.assessmentId)
      ? req.query.assessmentId[0]
      : req.query.assessmentId;
    const parsedAssessment = queryAssessment ? Number(queryAssessment) : null;
    const assessmentId = parsedAssessment && !Number.isNaN(parsedAssessment)
      ? parsedAssessment
      : await getDefaultAssessmentId();

    // Obtener participantes y su grupo
    const { data: participantes, error: participantesError } = await supabase
      .from('Participante')
      .select(
        'ID_Participante, Nombre_Participante, Correo_Participante, Rol_Participante, FotoUrl_Participante, Grupo:GrupoAssessment(Nombre_GrupoAssessment)'
      )
      .eq('ID_Assessment', assessmentId);
    if (participantesError) throw participantesError;

    // Obtener bases del assessment para mapear ID_Base -> Numero_Base
    const { data: bases, error: basesError } = await supabase
      .from('Bases')
      .select('ID_Base, Numero_Base')
      .eq('ID_Assessment', assessmentId);
    if (basesError) throw basesError;

    const baseNumberById = new Map<number, number>();
    for (const base of bases || []) {
      baseNumberById.set(base.ID_Base, base.Numero_Base);
    }

    // Obtener calificaciones por persona y base
    const { data: calificaciones, error: calificacionesError } = await supabase
      .from('CalificacionesPorPersona')
      .select('ID_Participante, ID_Base, Calificacion_1, Calificacion_2, Calificacion_3')
      .eq('ID_Assessment', assessmentId);
    if (calificacionesError) throw calificacionesError;

    // Calcular promedios por participante y base
    const basePromByPersona: Record<number, Record<string, number | null>> = {};
    for (const cal of calificaciones || []) {
      const id = cal.ID_Participante as number;
      const numeroBase = baseNumberById.get(cal.ID_Base as number);
      const baseNom = numeroBase ? `Base ${numeroBase}` : 'Base';
      const califs = [cal.Calificacion_1, cal.Calificacion_2, cal.Calificacion_3].filter(
        (x) => x !== null && x !== undefined
      ) as number[];
      const promedio = califs.length > 0 ? califs.reduce((a, b) => a + b, 0) / califs.length : null;
      if (!basePromByPersona[id]) basePromByPersona[id] = {};
      basePromByPersona[id][baseNom] = promedio;
    }

    // Calcular promedio general por persona
    const generalPromByPersona: Record<number, number | null> = {};
    for (const id in basePromByPersona) {
      const proms = Object.values(basePromByPersona[id]).filter((x) => x !== null && x !== undefined) as number[];
      generalPromByPersona[Number(id)] = proms.length > 0 ? proms.reduce((a, b) => a + b, 0) / proms.length : null;
    }

    const baseNames = ["Base 1", "Base 2", "Base 3", "Base 4", "Base 5"];

    const data = (participantes || []).map((p) => {
      const bases = basePromByPersona[p.ID_Participante] || {};
      const calificacionesBases = baseNames.reduce((acc, nombreBase, i) => {
        acc[`Calificacion_Base_${i + 1}`] = nombreBase in bases ? (bases[nombreBase] as number | null) : null;
        return acc;
      }, {} as Record<string, number | null>);

      const promedio = generalPromByPersona[p.ID_Participante] ?? null;

      return {
        ID: p.ID_Participante,
        Participante: p.Nombre_Participante,
        Correo: p.Correo_Participante,
        role: p.Rol_Participante ?? '0',
        Foto: p.FotoUrl_Participante ?? null,
        Grupo: p.Grupo?.[0]?.Nombre_GrupoAssessment ?? 'Sin grupo',
        Estado: promedio != null ? "Completado" : "Pendiente",
        Calificacion_Promedio: promedio,
        ...calificacionesBases,
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Error en endpoint dashboard/gh:", error);
    const message = error instanceof Error ? error.message : "Error interno al cargar datos";
    if (message.includes("No se encontró ningún Assessment")) {
      return res.status(200).json([]);
    }
    res.status(500).json({ error: message });
  }
}
