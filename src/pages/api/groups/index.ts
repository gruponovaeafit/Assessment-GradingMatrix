// pages/api/groups/index.ts
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

  console.log('📦 Datos recibidos para insertar:', JSON.stringify(groups, null, 2));

  let pool;
  let transaction;
  try {
    pool = await connectToDatabase();
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    const request = new sql.Request(transaction);

    // Limpiar las tablas antes de insertar nuevos datos
    await request.query('DELETE FROM PersonasPorGrupo');
    await request.query('DELETE FROM Grupos');

    for (let i = 0; i < groups.length; i++) {
      const groupName = `Grupo ${i + 1}`;

      // Insertar grupo en la tabla Grupos y obtener el ID
      await request.input('Nombre', sql.NVarChar, groupName).query('INSERT INTO Grupos (Nombre)');
      const idResult = await request.query('SELECT SCOPE_IDENTITY() AS ID');
      const grupoID = idResult.recordset[0].ID;

      // Insertar personas en la tabla PersonasPorGrupo
      for (const member of groups[i]) {
        if (member.ID && grupoID) {
          const insertQuery = 'INSERT INTO PersonasPorGrupo (ID_Persona, ID_Grupo) VALUES (@ID_Persona, @ID_Grupo)';
          console.log(`Ejecutando consulta: ${insertQuery} con ID_Persona=${member.ID}, ID_Grupo=${grupoID}`);

          await request
            .input('ID_Persona', sql.Int, member.ID)
            .input('ID_Grupo', sql.Int, grupoID)
            .query(insertQuery);
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
