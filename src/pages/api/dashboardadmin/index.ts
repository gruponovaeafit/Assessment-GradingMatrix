// pages/api/dashboard/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import sql, { pool, config as SqlConfig } from "mssql";

// Configuración de la base de datos
export const dbConfig: SqlConfig = {
  user: process.env.DB_USER as string,
  password: process.env.DB_PASS as string,
  database: process.env.DB_NAME as string,
  server: process.env.DB_SERVER as string,
  port: parseInt(process.env.DB_PORT ?? "1433", 10),
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

// Funcíon para conectar a la base de datos
export async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    console.error("❌ Error conectando a MSSQL en la nube:", error);
    throw new Error("No se pudo conectar a la base de datos en la nube");
  }
}

// API para obtener datos del dashboard
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
      SELECT 
        g.Nombre AS Grupo,
        p.Nombre AS Participante,
        AVG(cpg.Calificacion) AS Calificacion_Promedio,
        CASE 
          WHEN AVG(cpg.Calificacion) >= 60 THEN 'Aprobado'
          ELSE 'Reprobado'
        END AS Estado
      FROM PersonasPorGrupo ppg
      JOIN Personas p ON p.ID = ppg.ID_Persona
      JOIN Grupos g ON g.ID = ppg.ID_Grupo
      LEFT JOIN CalificacionesPorGrupo cpg ON cpg.ID_Grupo = g.ID
      GROUP BY g.Nombre, p.Nombre
      ORDER BY g.Nombre, p.Nombre;
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener los datos del dashboard:", error);
    res.status(500).json({ error: "Error al obtener los datos del dashboard" });
  } finally {
    await pool.close();
  }
} 
