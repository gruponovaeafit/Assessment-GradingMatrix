// pages/api/auth/login.ts
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

// Función para conectar a la base de datos
export async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a MSSQL:', error);
    throw new Error('No se pudo conectar a la base de datos');
  }
}

// API de login
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  // Verificar si es admin (credenciales en servidor)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
    return res.status(200).json({ role: 'admin' });
  }

  let pool;
  try {
    pool = await connectToDatabase();

    const result = await pool.request()
      .input('Correo', sql.NVarChar, email)
      .input('Contrasena', sql.NVarChar, password)
      .query('SELECT ID, Correo, ID_Grupo, ID_Base FROM Calificadores WHERE Correo = @Correo AND Contrasena = @Contrasena');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const calificador = result.recordset[0];

    res.status(200).json({ role: 'calificador', ID_Grupo: calificador.ID_Grupo, ID_Base: calificador.ID_Base, ID_Calificador: calificador.ID });
  } catch (error) {
    console.error('❌ Error al procesar el login:', error);
    res.status(500).json({ error: 'Error al procesar el login' });
  } finally {
    if (pool) await pool.close();
  }
}
