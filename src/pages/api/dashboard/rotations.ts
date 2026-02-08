import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseServer";
import { requireRoles } from "@/lib/apiAuth";

type StaffRow = {
  ID_Staff: number;
  Correo_Staff: string;
  Rol_Staff: string;
  ID_Assessment: number;
  ID_Base?: number | null;
  ID_GrupoAssessment?: number | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!requireRoles(req, res, ["admin"])) return;

  try {
    const assessmentId = req.query.assessmentId ? Number(req.query.assessmentId) : null;

    const fullSelect = "ID_Staff, Correo_Staff, Rol_Staff, ID_Assessment, ID_Base, ID_GrupoAssessment";

    let query = supabase
      .from("Staff")
      .select(fullSelect)
      .eq("Rol_Staff", "calificador")
      .order("ID_Staff", { ascending: true });
    
    if (assessmentId) {
      query = query.eq("ID_Assessment", assessmentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error en query inicial:", error);
      throw error;
    }

    console.log("✅ Data obtenida:", data?.length, "calificadores");
    console.log("📊 Ejemplo de data:", data?.[0]);

    // Obtener nombres de grupos
    let groupNameById = new Map<number, string>();
    const groupIds = (data as StaffRow[])
      ?.map((row) => row.ID_GrupoAssessment)
      .filter((id): id is number => typeof id === "number" && id !== null);
    
    console.log("🔍 Group IDs encontrados:", groupIds);

    if (groupIds && groupIds.length > 0) {
      const { data: groups, error: groupsError } = await supabase
        .from("GrupoAssessment")
        .select("ID_GrupoAssessment, Nombre_GrupoAssessment")
        .in("ID_GrupoAssessment", Array.from(new Set(groupIds)));
      
      console.log("📦 Grupos obtenidos:", groups);
      
      if (!groupsError && groups) {
        for (const group of groups) {
          groupNameById.set(group.ID_GrupoAssessment as number, group.Nombre_GrupoAssessment as string);
        }
      } else if (groupsError) {
        console.error("❌ Error obteniendo grupos:", groupsError);
      }
    }

    // ✅ Obtener información de las bases
    let baseInfoById = new Map<number, { nombre: string; numero: number }>();
    const baseIds = (data as StaffRow[])
      ?.map((row) => row.ID_Base)
      .filter((id): id is number => typeof id === "number" && id !== null);
    
    console.log("🔍 Base IDs encontrados:", baseIds);

    if (baseIds && baseIds.length > 0) {
      const { data: bases, error: basesError } = await supabase
        .from("Bases")
        .select("ID_Base, Nombre_Base, Numero_Base")
        .in("ID_Base", Array.from(new Set(baseIds)));
      
      console.log("📦 Bases obtenidas:", bases);
      
      if (!basesError && bases) {
        for (const base of bases) {
          baseInfoById.set(base.ID_Base as number, {
            nombre: base.Nombre_Base as string,
            numero: base.Numero_Base as number,
          });
        }
      } else if (basesError) {
        console.error("❌ Error obteniendo bases:", basesError);
      }
    }

    const payload = (data as StaffRow[])?.map((staff) => ({
      id: staff.ID_Staff,
      correo: staff.Correo_Staff,
      rol: staff.Rol_Staff,
      assessmentId: staff.ID_Assessment,
      baseId: staff.ID_Base ?? null,
      baseNombre: staff.ID_Base != null ? (baseInfoById.get(staff.ID_Base)?.nombre ?? null) : null,
      baseNumero: staff.ID_Base != null ? (baseInfoById.get(staff.ID_Base)?.numero ?? null) : null,
      grupoId: staff.ID_GrupoAssessment ?? null,
      grupoNombre:
        staff.ID_GrupoAssessment != null ? groupNameById.get(staff.ID_GrupoAssessment) ?? null : null,
    })) ?? [];

    console.log("📤 Payload final (primero):", payload[0]);

    res.status(200).json(payload);
  } catch (error) {
    console.error("❌ Error obteniendo rotaciones de staff:", error);
    res.status(500).json({ error: "Error al cargar rotaciones" });
  }
}
