import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from "@/lib/auth/apiAuth";

// Endpoint de verificación de conexión para Supabase
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!await requireRoles(req, res, ["admin"])) return;

    const { data, error } = await supabase
      .from("Assessment")
      .select("ID_Assessment")
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(500).json({ error: "Error conectando a la base de datos" });
    }

    res.status(200).json({ message: "Conexión exitosa" });
  } catch (error) {
    console.error("❌ Error conectando a Supabase:", error);
    res.status(500).json({ error: "Error conectando a la base de datos" });
  }
}