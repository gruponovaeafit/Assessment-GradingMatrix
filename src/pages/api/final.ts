import type { NextApiRequest, NextApiResponse } from "next";
import sql, { config as SqlConfig } from "mssql";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await sql.connect(dbConfig);

    // Traer personas con su grupo (usando join a PersonasPorGrupo y Grupos)
    const personasResult = await pool.request().query(`
      SELECT 
        P.ID,
        P.Nombre AS Participante,
        P.Correo,
        G.Nombre AS Grupo,
        P.role,
        P.photo,
        -- Calcula el promedio final (promedio de todos los promedios por base)
        (
          SELECT 
            AVG(
              (ISNULL(C.Calificacion_1,0) + ISNULL(C.Calificacion_2,0) + ISNULL(C.Calificacion_3,0)) / 
              (CASE 
                WHEN C.Calificacion_1 IS NOT NULL AND C.Calificacion_2 IS NOT NULL AND C.Calificacion_3 IS NOT NULL THEN 3
                WHEN (C.Calificacion_1 IS NOT NULL AND C.Calificacion_2 IS NOT NULL) OR (C.Calificacion_1 IS NOT NULL AND C.Calificacion_3 IS NOT NULL) OR (C.Calificacion_2 IS NOT NULL AND C.Calificacion_3 IS NOT NULL) THEN 2
                WHEN C.Calificacion_1 IS NOT NULL OR C.Calificacion_2 IS NOT NULL OR C.Calificacion_3 IS NOT NULL THEN 1
                ELSE NULL
              END)
            )
          FROM CalificacionesPorPersona C
          WHERE C.ID_Persona = P.ID
        ) AS Calificacion_Promedio
      FROM Personas P
      LEFT JOIN PersonasPorGrupo PG ON PG.ID_Persona = P.ID
      LEFT JOIN Grupos G ON G.ID = PG.ID_Grupo
    `);

    const personas = personasResult.recordset;

    // Calificaciones promedio por base
    const calificacionesResult = await pool.request().query(`
      SELECT 
        C.ID_Persona,
        B.Nombre,
        AVG(
          (ISNULL(C.Calificacion_1,0) + ISNULL(C.Calificacion_2,0) + ISNULL(C.Calificacion_3,0)) / 
          (CASE 
            WHEN C.Calificacion_1 IS NOT NULL AND C.Calificacion_2 IS NOT NULL AND C.Calificacion_3 IS NOT NULL THEN 3
            WHEN (C.Calificacion_1 IS NOT NULL AND C.Calificacion_2 IS NOT NULL) OR (C.Calificacion_1 IS NOT NULL AND C.Calificacion_3 IS NOT NULL) OR (C.Calificacion_2 IS NOT NULL AND C.Calificacion_3 IS NOT NULL) THEN 2
            WHEN C.Calificacion_1 IS NOT NULL OR C.Calificacion_2 IS NOT NULL OR C.Calificacion_3 IS NOT NULL THEN 1
            ELSE NULL
          END)
        ) AS PromedioBase
      FROM CalificacionesPorPersona C
      INNER JOIN Bases B ON C.ID_Base = B.ID
      GROUP BY C.ID_Persona, B.Nombre
    `);

    // Organizar calificaciones por persona y base
    const calificacionesPorPersona: Record<number, any> = {};
    for (const row of calificacionesResult.recordset) {
      if (!calificacionesPorPersona[row.ID_Persona])
        calificacionesPorPersona[row.ID_Persona] = {};
      calificacionesPorPersona[row.ID_Persona][row.NombreBase] = row.PromedioBase;
    }

    // Construir respuesta
    const data = personas.map((p: any) => {
      const bases = calificacionesPorPersona[p.ID] || {};
      return {
        ...p,
        Estado: p.Calificacion_Promedio != null ? "Completado" : "Pendiente",
        Calificacion_Base_1: bases["Base 1"] ?? null,
        Calificacion_Base_2: bases["Base 2"] ?? null,
        Calificacion_Base_3: bases["Base 3"] ?? null,
        // Si tienes más bases, agrégalas aquí
      };
    });

    res.status(200).json(data);
  } catch (error: any) {
    console.error("❌ Error en dashboardadmin:", error);
    res.status(500).json({ error: "Error interno al cargar datos" });
  }
}
