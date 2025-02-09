
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

// Funcíon para conectar a la base de datos
export async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a MSSQL en la nube:', error);
    throw new Error('No se pudo conectar a la base de datos en la nube');
  }
}

// API para registrar personas
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { nombre, correo } = req.body;

  if (!nombre || !correo) {
    return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
  }

  let pool;
  try {
    pool = await connectToDatabase();
    const result = await pool.request()
      .input('Nombre', sql.NVarChar, nombre)
      .input('Correo', sql.NVarChar, correo)
      .query('INSERT INTO Personas (Nombre, Correo) VALUES (@Nombre, @Correo)');

    res.status(200).json({ message: 'Persona inscrita exitosamente' });
  } catch (error: any) {
    if (error.number === 2627) { // Error por correo duplicado (clave única)
      res.status(400).json({ error: 'El correo ya está registrado' });
    } else {
      console.error('❌ Error al registrar la persona:', error);
      res.status(500).json({ error: 'Error al registrar la persona' });
    }
  } finally {
    if (pool) await pool.close();
  }
} 
