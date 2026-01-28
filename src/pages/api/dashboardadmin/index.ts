// pages/api/dashboardadmin/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../db";

// API para obtener datos del dashboard admin
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
      WITH PromediosPorBase AS (
        SELECT
          cpg.ID_Persona,
          cpg.ID_Grupo,
          AVG((ISNULL(cpg.Calificacion_1, 0) + ISNULL(cpg.Calificacion_2, 0) + ISNULL(cpg.Calificacion_3, 0)) / 3.0) AS PromedioBase
        FROM CalificacionesPorPersona cpg
        GROUP BY cpg.ID_Persona, cpg.ID_Grupo, cpg.ID_Base
      ),
      PromediosGenerales AS (
        SELECT
          ID_Persona,
          ID_Grupo,
          AVG(PromedioBase) AS Calificacion_Promedio
        FROM PromediosPorBase
        GROUP BY ID_Persona, ID_Grupo
      )
      SELECT 
        g.Nombre AS Grupo,
        p.ID AS ID,
        p.Nombre AS Participante,
        p.Correo AS Correo,
        p.role AS role,
        p.Photo AS Photo, -- <-- Se incluye la foto
        pg.Calificacion_Promedio,
        CASE 
          WHEN pg.Calificacion_Promedio >= 4.0 THEN 'Aprobado'
          ELSE 'Reprobado'
        END AS Estado
      FROM PersonasPorGrupo ppg
      JOIN Personas p ON p.ID = ppg.ID_Persona
      JOIN Grupos g ON g.ID = ppg.ID_Grupo
      LEFT JOIN PromediosGenerales pg ON pg.ID_Persona = p.ID AND pg.ID_Grupo = ppg.ID_Grupo
      ORDER BY g.Nombre, p.Nombre;
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener los datos del dashboard:", error);
    res.status(500).json({ error: "Error al obtener los datos del dashboard" });
  }
}
