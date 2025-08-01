// pages/api/groupsId.ts
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
  // Ahora recibes idCalificador en el body
  const { idCalificador } = req.body;

  if (!idCalificador || isNaN(Number(idCalificador))) {
    return res.status(400).json({ error: 'ID de calificador inválido' });
  }

  const pool = await connectToDatabase();
  let request = new sql.Request(pool);

  // 1. Buscar el ID_Grupo del calificador
  request.input('ID', sql.Int, Number(idCalificador));
  const grupoResult = await request.query(`
    SELECT ID_Grupo FROM Calificadores WHERE ID = @ID
  `);

  if (grupoResult.recordset.length === 0) {
    return res.status(404).json({ error: 'No se encontró el calificador' });
  }

  const idGrupo = grupoResult.recordset[0].ID_Grupo;

  if (!idGrupo) {
    return res.status(404).json({ error: 'El calificador no tiene grupo asignado' });
  }

  console.log('🔍 Buscando miembros del grupo:', idGrupo);

  // 2. Buscar los miembros del grupo
  request = new sql.Request(pool); // Nuevo request limpio
  request.input('ID_Grupo', sql.Int, Number(idGrupo));

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
    WHERE PG.ID_Grupo = @ID_Grupo
  `;

  const result = await request.query(query);

  if (result.recordset.length === 0) {
    return res.status(404).json({ message: 'No se encontraron personas en este grupo' });
  }
  res.status(200).json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener los miembros del grupo:', error);
    res.status(500).json({ error: 'Error al obtener los miembros del grupo' });
  }
}
