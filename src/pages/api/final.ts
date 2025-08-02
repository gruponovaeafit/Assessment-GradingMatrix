import type { NextApiRequest, NextApiResponse } from "next";
import sql, { config as SqlConfig } from "mssql";

// Configuración MSSQL
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

function normalizaBase(nombre: string) {
  // Deja solo los números del nombre y lo devuelve como "Base N"
  const match = nombre.match(/\d+/);
  return match ? `Base ${parseInt(match[0], 10)}` : nombre;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await sql.connect(dbConfig);

    const personasResult = await pool.request().query(`
      SELECT 
        P.ID,
        P.Nombre AS Participante,
        P.Correo,
        G.Nombre AS Grupo,
        P.role,
        P.photo AS Foto
      FROM Personas P
      LEFT JOIN PersonasPorGrupo PG ON PG.ID_Persona = P.ID
      LEFT JOIN Grupos G ON G.ID = PG.ID_Grupo
    `);
    const personas = personasResult.recordset;

    const basePromResult = await pool.request().query(`
      SELECT
        T.ID_Persona,
        T.NombreBase,
        AVG(T.Promedio_Registro) AS PromedioPorBase
      FROM (
        SELECT
          P.ID_Persona,
          B.Nombre AS NombreBase,
          (
            ISNULL(P.Calificacion_1,0) + ISNULL(P.Calificacion_2,0) + ISNULL(P.Calificacion_3,0)
          ) /
          (CASE
            WHEN P.Calificacion_1 IS NOT NULL AND P.Calificacion_2 IS NOT NULL AND P.Calificacion_3 IS NOT NULL THEN 3
            WHEN (P.Calificacion_1 IS NOT NULL AND P.Calificacion_2 IS NOT NULL) OR (P.Calificacion_1 IS NOT NULL AND P.Calificacion_3 IS NOT NULL) OR (P.Calificacion_2 IS NOT NULL AND P.Calificacion_3 IS NOT NULL) THEN 2
            WHEN P.Calificacion_1 IS NOT NULL OR P.Calificacion_2 IS NOT NULL OR P.Calificacion_3 IS NOT NULL THEN 1
            ELSE NULL
          END) AS Promedio_Registro
        FROM CalificacionesPorPersona P
        INNER JOIN Bases B ON P.ID_Base = B.ID
      ) AS T
      GROUP BY T.ID_Persona, T.NombreBase
      HAVING COUNT(*) = 2
    `);

    const generalPromResult = await pool.request().query(`
      SELECT 
        ID_Persona,
        AVG(PromedioPorBase) AS PromedioGeneral
      FROM (
        SELECT 
          P.ID_Persona,
          AVG(
            (ISNULL(P.Calificacion_1,0) + ISNULL(P.Calificacion_2,0) + ISNULL(P.Calificacion_3,0)) /
              (CASE 
                  WHEN P.Calificacion_1 IS NOT NULL AND P.Calificacion_2 IS NOT NULL AND P.Calificacion_3 IS NOT NULL THEN 3
                  WHEN (P.Calificacion_1 IS NOT NULL AND P.Calificacion_2 IS NOT NULL) OR (P.Calificacion_1 IS NOT NULL AND P.Calificacion_3 IS NOT NULL) OR (P.Calificacion_2 IS NOT NULL AND P.Calificacion_3 IS NOT NULL) THEN 2
                  WHEN P.Calificacion_1 IS NOT NULL OR P.Calificacion_2 IS NOT NULL OR P.Calificacion_3 IS NOT NULL THEN 1
                  ELSE NULL
              END)
          ) AS PromedioPorBase
        FROM CalificacionesPorPersona P
        GROUP BY P.ID_Persona, P.ID_Base
      ) t
      GROUP BY ID_Persona
    `);

    // <-- NORMALIZA AQUI -->
    const basePromByPersona: Record<number, Record<string, number>> = {};
    for (const row of basePromResult.recordset) {
      const baseNom = normalizaBase(row.NombreBase);
      if (!basePromByPersona[row.ID_Persona]) basePromByPersona[row.ID_Persona] = {};
      basePromByPersona[row.ID_Persona][baseNom] = row.PromedioPorBase;
    }

    const generalPromByPersona: Record<number, number> = {};
    for (const row of generalPromResult.recordset) {
      generalPromByPersona[row.ID_Persona] = row.PromedioGeneral;
    }

    const baseNames = ["Base 1", "Base 2", "Base 3", "Base 4", "Base 5"];

    const data = personas.map((p: any) => {
      const bases = basePromByPersona[p.ID] || {};
      const calificacionesBases = baseNames.reduce((acc, nombreBase, i) => {
        acc[`Calificacion_Base_${i + 1}`] =
          nombreBase in bases ? bases[nombreBase] : null;
        return acc;
      }, {} as Record<string, number | null>);

      const promedio = generalPromByPersona[p.ID] ?? null;

      return {
        ...p,
        Estado: promedio != null ? "Completado" : "Pendiente",
        Calificacion_Promedio: promedio,
        ...calificacionesBases,
      };
    });

    res.status(200).json(data);
    res.status(200).json(data);
    await pool.close();
  } catch (error: any) {
    console.error("❌ Error en dashboardadmin:", error);
    res.status(500).json({ error: "Error interno al cargar datos" });
  }
}