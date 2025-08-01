// pages/api/dashboardadmin/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import sql, { config as SqlConfig } from "mssql";

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

// Función para conectar a la base de datos
export async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    console.error("❌ Error conectando a MSSQL en la nube:", error);
    throw new Error("No se pudo conectar a la base de datos en la nube");
  }
}

// API para obtener datos del dashboard admin
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let pool;
  try {
    pool = await connectToDatabase();
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
  } finally {
    if (pool) await pool.close();
  }
}
