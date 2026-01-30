import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseServer";
import { requireRoles } from "@/lib/apiAuth";

type StaffRow = {
  ID_Staff: number;
  Correo_Staff: string;
  Rol_Staff: string;
  ID_Assessment: number;
  ID_GrupoAssessment?: number | null;
  Rotaciones_Staff?: number | null;
  Grupo?: { Nombre_GrupoAssessment?: string | null } | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!requireRoles(req, res, ["admin"])) return;

  try {
    const assessmentId = req.query.assessmentId ? Number(req.query.assessmentId) : null;

    const baseSelect = "ID_Staff, Correo_Staff, Rol_Staff, ID_Assessment";
    const fullSelect = "ID_Staff, Correo_Staff, Rol_Staff, ID_Assessment, ID_GrupoAssessment, Rotaciones_Staff";

    let query = supabase
      .from("Staff")
      .select(fullSelect)
      .eq("Rol_Staff", "calificador")
      .order("ID_Staff", { ascending: true });
    if (assessmentId) {
      query = query.eq("ID_Assessment", assessmentId);
    }

    let { data, error } = await query;

    if (error) {
      const shouldFallback =
        error.message.toLowerCase().includes("column") ||
        error.message.includes("ID_GrupoAssessment") ||
        error.message.includes("Rotaciones_Staff");

      if (shouldFallback) {
        let fallbackQuery = supabase
          .from("Staff")
          .select(baseSelect)
          .eq("Rol_Staff", "calificador")
          .order("ID_Staff", { ascending: true });
        if (assessmentId) {
          fallbackQuery = fallbackQuery.eq("ID_Assessment", assessmentId);
        }
        const fallback = await fallbackQuery;
        if (fallback.error) throw fallback.error;
        data = (fallback.data as StaffRow[])?.map((row) => ({
          ...row,
          ID_GrupoAssessment: null,
          Rotaciones_Staff: null,
        }));
      } else {
        throw error;
      }
    }

    let groupNameById = new Map<number, string>();
    const hasGroupColumn = (data as StaffRow[] | null)?.some(
      (row) => row.ID_GrupoAssessment !== undefined
    );
    if (hasGroupColumn) {
      const groupIds = (data as StaffRow[] | null)
        ?.map((row) => row.ID_GrupoAssessment)
        .filter((id): id is number => typeof id === "number");
      if (groupIds && groupIds.length > 0) {
        const { data: groups, error: groupsError } = await supabase
          .from("GrupoAssessment")
          .select("ID_GrupoAssessment, Nombre_GrupoAssessment")
          .in("ID_GrupoAssessment", Array.from(new Set(groupIds)));
        if (!groupsError && groups) {
          for (const group of groups) {
            groupNameById.set(group.ID_GrupoAssessment as number, group.Nombre_GrupoAssessment as string);
          }
        }
      }
    }

    const payload = (data as StaffRow[] | null)?.map((staff) => ({
      id: staff.ID_Staff,
      correo: staff.Correo_Staff,
      rol: staff.Rol_Staff,
      assessmentId: staff.ID_Assessment,
      grupoId: staff.ID_GrupoAssessment ?? null,
      grupoNombre:
        staff.ID_GrupoAssessment != null ? groupNameById.get(staff.ID_GrupoAssessment) ?? null : null,
      rotaciones: staff.Rotaciones_Staff ?? 0,
    })) ?? [];

    res.status(200).json(payload);
  } catch (error) {
    console.error("❌ Error obteniendo rotaciones de staff:", error);
    res.status(500).json({ error: "Error al cargar rotaciones" });
  }
}
