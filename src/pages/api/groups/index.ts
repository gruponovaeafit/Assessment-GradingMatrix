// pages/api/groups/members.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sql, { config as SqlConfig } from 'mssql';

// Configuración de la base de datos
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

// Conectar a la base de datos
export async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a MSSQL:', error);
    throw new Error('No se pudo conectar a la base de datos');
  }
}

// API para obtener miembros de un grupo específico
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'OPTIONS') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id }  = JSON.parse(req.body)
  const idGrupo = id;

  if (!idGrupo || isNaN(Number(idGrupo))) {
    return res.status(400).json({ error: 'ID de grupo inválido' });
  }

  let pool;
  try {
    pool = await connectToDatabase();
    const request = new sql.Request(pool);

    request.input('ID', sql.Int, Number(idGrupo));

    const query = `
      SELECT P.ID, P.Nombre, P.Apellido
      FROM PersonasPorGrupo PG
      JOIN Personas P ON PG.ID_Persona = P.ID
      WHERE PG.ID_Grupo = @ID_Grupo
    `;

    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'No se encontraron personas en este grupo' });
    }

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener los miembros del grupo:', error);
    res.status(500).json({ error: 'Error al obtener los miembros del grupo' });
  } finally {
    if (pool) await pool.close();
  }
}
