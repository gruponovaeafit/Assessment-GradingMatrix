import type { NextApiRequest, NextApiResponse } from 'next';
import sql, { config as SqlConfig } from 'mssql';

export const dbConfig: SqlConfig = {
  user: process.env.DB_USER as string,
  password: process.env.DB_PASS as string,
  database: process.env.DB_NAME as string,
  server: process.env.DB_SERVER as string,
  port: parseInt(process.env.DB_PORT ?? '1433', 10),
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  let pool: sql.ConnectionPool | null = null;
  try {
    const { idCalificador } = req.body;

    if (!idCalificador || isNaN(Number(idCalificador))) {
      return res.status(400).json({ error: 'ID de calificador inválido' });
    }

    pool = await sql.connect(dbConfig);

    const request = new sql.Request(pool);
    request.input('ID_Calificador', sql.Int, Number(idCalificador));

    const query = `
      SELECT 
        PG.ID_Persona AS ID_Persona,
        P.ID,
        P.Nombre, 
        P.role, 
        PG.ID_Grupo AS Grupo,
        P.Photo
      FROM PersonasPorGrupo PG
      JOIN Personas P ON PG.ID_Persona = P.ID
      JOIN Calificadores C ON C.ID_Grupo = PG.ID_Grupo
      WHERE C.ID = @ID_Calificador
    `;

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'No se encontraron personas en este grupo' });
    }
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener los miembros del grupo:', error);
    res.status(500).json({ error: 'Error al obtener los miembros del grupo' });
  } finally {
    if (pool) {
      try { await pool.close(); } catch (e) {}
    }
  }
}
