import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from '@/lib/supabaseServer';
import { getDefaultAssessmentId } from "@/lib/assessment";
import { requireRoles } from "@/lib/apiAuth";

// Endpoint de verificación de conexión para Supabase
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!requireRoles(req, res, ["admin"])) return;
    const assessmentId = await getDefaultAssessmentId();

    const { data, error } = await supabase
      .from("Assessment")
      .select("ID_Assessment")
      .eq("ID_Assessment", assessmentId)
      .single();

    if (error || !data) {
      return res.status(500).json({ error: "Error conectando a la base de datos" });
    }

    res.status(200).json({ message: "Conexión exitosa", assessmentId });
  } catch (error) {
    console.error("❌ Error conectando a Supabase:", error);
    res.status(500).json({ error: "Error conectando a la base de datos" });
  }
}
