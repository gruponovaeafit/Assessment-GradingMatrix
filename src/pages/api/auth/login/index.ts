// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import { connectToDatabase } from '../../db';
import { comparePassword, generateToken, hashPassword } from '../../../../lib/auth';

// Credenciales de admin (en producción usar variables de entorno)
const ADMIN_EMAIL = 'admin@assessment.com';
const ADMIN_PASSWORD_HASH = '$2a$10$XQxBtJXKQJZJZJZJZJZJZuHashedPasswordForAdmin'; // Hash pre-generado

// API de login
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  // Verificar si es admin
  const adminEmail = process.env.ADMIN_EMAIL || ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Fallback para desarrollo

  if (email === adminEmail && password === adminPassword) {
    const token = generateToken({ id: 0, email: adminEmail, role: 'admin' });
    return res.status(200).json({ 
      role: 'admin',
      token,
      message: 'Login exitoso'
    });
  }

  try {
    const pool = await connectToDatabase();

    // Buscar calificador por correo (la contraseña ahora debería estar hasheada en BD)
    const result = await pool.request()
      .input('Correo', sql.NVarChar, email)
      .query('SELECT ID, Correo, Contrasena, ID_Grupo, ID_Base FROM Calificadores WHERE Correo = @Correo');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const calificador = result.recordset[0];
    
    // Verificar contraseña
    // Si la contraseña en BD no está hasheada (legado), comparar directamente
    let isValidPassword = false;
    
    if (calificador.Contrasena.startsWith('$2')) {
      // Contraseña hasheada con bcrypt
      isValidPassword = await comparePassword(password, calificador.Contrasena);
    } else {
      // Contraseña en texto plano (legado) - comparar directamente
      isValidPassword = calificador.Contrasena === password;
      
      // Opcional: actualizar a hash para próximos logins
      if (isValidPassword) {
        const hashedPassword = await hashPassword(password);
        await pool.request()
          .input('ID', sql.Int, calificador.ID)
          .input('HashedPassword', sql.NVarChar, hashedPassword)
          .query('UPDATE Calificadores SET Contrasena = @HashedPassword WHERE ID = @ID');
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar token JWT
    const token = generateToken({ 
      id: calificador.ID, 
      email: calificador.Correo, 
      role: 'calificador' 
    });

    res.status(200).json({ 
      role: 'calificador', 
      ID_Grupo: calificador.ID_Grupo, 
      ID_Base: calificador.ID_Base, 
      ID_Calificador: calificador.ID,
      token,
      message: 'Login exitoso'
    });
  } catch (error) {
    console.error('❌ Error al procesar el login:', error);
    res.status(500).json({ error: 'Error al procesar el login' });
  }
}
