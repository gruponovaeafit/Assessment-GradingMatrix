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
    };

    for (let i = 0; i < groups.length; i++) {
      const baseName = baseMapping[i % 7];

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
          console.log(`Preparando inserción: ${insertQuery} con ID_Persona=${member.ID}, ID_Grupo=${grupoID}`);

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

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener los miembros del grupo:', error);
    res.status(500).json({ error: 'Error al obtener los miembros del grupo' });
  } finally {
    if (pool) await pool.close();
  }
}
