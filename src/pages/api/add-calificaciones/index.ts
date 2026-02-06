// pages/api/add-calificaciones.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  if (!requireRoles(req, res, ["admin", "calificador"])) return;

  const calificaciones = req.body;

  if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
    return res.status(400).json({ message: "Se requiere un arreglo de calificaciones" });
  }

  try {
    const calificadorId = Number(calificaciones[0].ID_Calificador);

    if (!calificadorId || Number.isNaN(calificadorId)) {
      return res.status(400).json({ message: "ID_Calificador inválido" });
    }

    const { data: staff, error: staffError } = await supabase
      .from('Staff')
      .select('ID_Assessment')
      .eq('ID_Staff', calificadorId)
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ message: 'No se encontró el calificador' });
    }

    const assessmentId = staff.ID_Assessment;
    const idBase = Number(calificaciones[0].ID_Base);

    // ✅ NUEVA VALIDACIÓN: Verificar si ya existen calificaciones previas
    const { data: existingGrades, error: checkError } = await supabase
      .from('CalificacionesPorPersona')
      .select('ID_Calificacion')
      .eq('ID_Assessment', assessmentId)
      .eq('ID_Base', idBase)
      .eq('ID_Staff', calificadorId)
      .limit(1);

    if (checkError) {
      throw new Error(`Error al verificar calificaciones previas: ${checkError.message}`);
    }

    // ✅ Si ya calificó antes, bloquear el intento
    if (existingGrades && existingGrades.length > 0) {
      return res.status(400).json({
        error: 'Ya has calificado a este grupo anteriormente. No puedes volver a calificar.',
        code: 'ALREADY_GRADED',
        message: 'No es posible recalificar al mismo grupo ni a las mismas personas.',
      });
    }

    const upsertPayload = calificaciones.map((cal) => {
      const ID_Participante = Number(cal.ID_Persona ?? cal.ID_Participante);
      const ID_Base = Number(cal.ID_Base);
      const ID_Staff = Number(cal.ID_Calificador);
      const Calificacion_1 = Number(cal.Calificacion_1);
      const Calificacion_2 = Number(cal.Calificacion_2);
      const Calificacion_3 = Number(cal.Calificacion_3);

      if (
        Number.isNaN(ID_Participante) ||
        Number.isNaN(ID_Base) ||
        Number.isNaN(ID_Staff) ||
        Number.isNaN(Calificacion_1) ||
        Number.isNaN(Calificacion_2) ||
        Number.isNaN(Calificacion_3)
      ) {
        console.error('❌ Datos inválidos detectados:', cal);
        throw new Error('Faltan campos obligatorios o hay valores inválidos en alguna calificación');
      }

      return {
        ID_Assessment: assessmentId,
        ID_Base,
        ID_Staff,
        ID_Participante,
        Calificacion_1,
        Calificacion_2,
        Calificacion_3,
        Fecha_Calificacion: new Date().toISOString(),
      };
    });

    // ✅ CAMBIO: Usar INSERT en lugar de UPSERT para no permitir updates
    const { error: insertError } = await supabase
      .from('CalificacionesPorPersona')
      .insert(upsertPayload);

    if (insertError) {
      throw new Error(`Error al guardar calificación: ${insertError.message}`);
    }

    res.status(200).json({
      message: "✅ Calificaciones procesadas correctamente",
      nuevoGrupo: null,
    });
  } catch (error) {
    console.error("❌ Error en procesamiento de calificaciones:", error);
    res.status(500).json({
      message: "Error al procesar las calificaciones",
      error: (error as Error).message,
    });
  }
}
