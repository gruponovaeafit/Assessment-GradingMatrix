import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from './dashboardadmin';
import sql from 'mssql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id_base } = req.body;

  if (!id_base) {
    return res.status(400).json({ error: 'El campo id_base es obligatorio' });
  }

  let pool;
  try {
    pool = await connectToDatabase();

    const result = await pool.request()
      .input('id_base', sql.Int, id_base)
      .query(`
        SELECT 
          Nombre,
          Competencia,
          Descripcion,
          Comportamiento1,
          Comportamiento2,
          Comportamiento3
        FROM Bases
        WHERE ID = @id_base
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Base no encontrada' });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('❌ Error al obtener la base:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    if (pool) await pool.close();
  }
}
