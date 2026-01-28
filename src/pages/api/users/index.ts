import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import { connectToDatabase } from '../db';

// API para manejar GET y POST
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await connectToDatabase();

    if (req.method === 'GET') {
      // Obtener todas las personas
      const result = await pool.request().query('SELECT ID, Nombre, Correo, role FROM Personas');
      res.status(200).json(result.recordset);
    } 
    else if (req.method === 'POST') {
      // Registrar nueva persona
      const { nombre, correo } = req.body;

      if (!nombre || !correo) {
        return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
      }

      await pool.request()
        .input('Nombre', sql.NVarChar, nombre)
        .input('Correo', sql.NVarChar, correo)
        .query('INSERT INTO Personas (Nombre, Correo) VALUES (@Nombre, @Correo)');

      res.status(200).json({ message: 'Persona inscrita exitosamente' });
    } 
    else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error: unknown) {
    const err: any = error;
    if (req.method === 'POST' && err && err.number === 2627) {
      res.status(400).json({ error: 'El correo ya está registrado' });
    } else {
      console.error('❌ Error al procesar la solicitud:', error);
      res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
  }
} 
