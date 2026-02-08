import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseServer";
import { requireRoles } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!requireRoles(req, res, ["admin"])) return;

  const { staffId, grupoAssessmentId } = req.body ?? {};

  if (!staffId || Number.isNaN(Number(staffId))) {
    return res.status(400).json({ error: "staffId inválido" });
  }

  const updatePayload: Record<string, number | null> = {};

  if (grupoAssessmentId !== undefined) {
    if (grupoAssessmentId === null || grupoAssessmentId === "") {
      updatePayload.ID_GrupoAssessment = null;
    } else if (!Number.isNaN(Number(grupoAssessmentId))) {
      updatePayload.ID_GrupoAssessment = Number(grupoAssessmentId);
    } else {
      return res.status(400).json({ error: "grupoAssessmentId inválido" });
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return res.status(400).json({ error: "Nada para actualizar" });
  }

  try {
    const { data, error } = await supabase
      .from("Staff")
      .update(updatePayload)
      .eq("ID_Staff", Number(staffId))
      .select(
        "ID_Staff, Correo_Staff, Rol_Staff, ID_Assessment, ID_GrupoAssessment"
      )
      .single();

    if (error) {
      throw error;
    }

    // Obtener el nombre del grupo si existe
    let grupoNombre: string | null = null;
    if (data.ID_GrupoAssessment) {
      const { data: grupoData, error: grupoError } = await supabase
        .from("GrupoAssessment")
        .select("Nombre_GrupoAssessment")
        .eq("ID_GrupoAssessment", data.ID_GrupoAssessment)
        .single();

      if (!grupoError && grupoData) {
        grupoNombre = grupoData.Nombre_GrupoAssessment;
      }
    }

    res.status(200).json({
      id: data.ID_Staff,
      correo: data.Correo_Staff,
      rol: data.Rol_Staff,
      assessmentId: data.ID_Assessment,
      grupoId: data.ID_GrupoAssessment ?? null,
      grupoNombre: grupoNombre,
    });
  } catch (error) {
    console.error("❌ Error actualizando grupo de staff:", error);
    res.status(500).json({ error: "Error al actualizar grupo de staff" });
  }
}
