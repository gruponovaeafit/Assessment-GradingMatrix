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

// API para subir la distribución de los grupos
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { groups } = req.body;

  if (!groups || !Array.isArray(groups)) {
    return res.status(400).json({ error: 'Datos de grupos inválidos' });
  }

  // debug: payload received for insertion
  let pool;
  let transaction;
  try {
    pool = await connectToDatabase();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);
    // Limpiar la tabla PersonasPorGrupo antes de insertar nuevos datos
    await request.query('DELETE FROM PersonasPorGrupo');
    // Mapear los grupos a las bases existentes
    const baseMapping: { [key: number]: string } = {
      0: 'Grupo1',
      1: 'Grupo2',
      2: 'Grupo3',
      3: 'Grupo4',
      4: 'Grupo5',
      5: 'Grupo6',
      6: 'Grupo7',
      7: 'Grupo8',
    };
    for (let i = 0; i < groups.length; i++) {
      const baseName = baseMapping[i % 8];

      // Crear una nueva instancia de request para cada iteración
      const groupRequest = new sql.Request(transaction);
      const groupResult = await groupRequest.input('NombreBase', sql.NVarChar, baseName)
        .query('SELECT ID FROM Grupos WHERE Nombre = @NombreBase');

      if (groupResult.recordset.length === 0) {
        console.error(`❌ La base ${baseName} no existe en la base de datos.`);
        continue;
      }

      const grupoID = groupResult.recordset[0].ID;
      // Insertar personas en la tabla PersonasPorGrupo
      for (const member of groups[i]) {
        if (member.ID && grupoID) {
          const insertQuery = 'INSERT INTO PersonasPorGrupo (ID_Persona, ID_Grupo) VALUES (@ID_Persona, @ID_Grupo)';
          // preparación de inserción de miembro
          const insertRequest = new sql.Request(transaction);
          insertRequest.input('ID_Persona', sql.Int, member.ID);
          insertRequest.input('ID_Grupo', sql.Int, grupoID);
          await insertRequest.query(insertQuery);
        } else {
          console.error('❌ Datos inválidos para inserción:', { ID_Persona: member.ID, ID_Grupo: grupoID });
        }
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Grupos subidos exitosamente' });
  } catch (error) {
    console.error('❌ Error al subir los grupos:', error);
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: 'Error al subir los grupos a la base de datos' });
  } finally {
    if (pool) await pool.close();
  }
} 