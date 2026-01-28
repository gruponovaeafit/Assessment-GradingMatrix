// pages/api/getCalificador.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import { connectToDatabase } from './db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo se permite POST' });
  }

  const { id_calificador } = req.body;

  if (!id_calificador) {
    return res.status(400).json({ error: 'ID del calificador no proporcionado' });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input('ID', sql.Int, id_calificador)
      .query('SELECT Correo FROM Calificadores WHERE ID = @ID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Calificador no encontrado' });
    }

    const correo = result.recordset[0].Correo;
    return res.status(200).json({ Correo: correo });
  } catch (error) {
    console.error('❌ Error al obtener calificador:', error);
    res.status(500).json({ error: 'Error interno al obtener calificador' });
  }
}

