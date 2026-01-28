// pages/api/admin/hash-passwords.ts
// Utilidad para migrar contraseñas en texto plano a hash (solo admin)
import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import { connectToDatabase } from '../db';
import { hashPassword, withAdminAuth } from '../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const pool = await connectToDatabase();

    // Obtener todos los calificadores con contraseñas sin hashear
    const result = await pool.request()
      .query(`
        SELECT ID, Contrasena 
        FROM Calificadores 
        WHERE Contrasena NOT LIKE '$2%'
      `);

    if (result.recordset.length === 0) {
      return res.status(200).json({ 
        message: 'Todas las contraseñas ya están hasheadas',
        updated: 0 
      });
    }

    let updatedCount = 0;

    for (const calificador of result.recordset) {
      const hashedPassword = await hashPassword(calificador.Contrasena);
      
      await pool.request()
        .input('ID', sql.Int, calificador.ID)
        .input('HashedPassword', sql.NVarChar, hashedPassword)
        .query('UPDATE Calificadores SET Contrasena = @HashedPassword WHERE ID = @ID');
      
      updatedCount++;
    }

    res.status(200).json({ 
      message: `Se hashearon ${updatedCount} contraseñas correctamente`,
      updated: updatedCount 
    });

  } catch (error) {
    console.error('❌ Error al hashear contraseñas:', error);
    res.status(500).json({ error: 'Error al procesar las contraseñas' });
  }
}

// Exportar con middleware de autenticación admin
export default withAdminAuth(handler);
