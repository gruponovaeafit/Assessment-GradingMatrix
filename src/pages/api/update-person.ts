import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from './db';
import sql from 'mssql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id, nombre, correo, role } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID es obligatorio' });
  }

  if (nombre === undefined && correo === undefined && role === undefined) {
    return res.status(400).json({ error: 'Debe enviarse al menos un campo para actualizar' });
  }

  try {
    const pool = await connectToDatabase();
    const request = pool.request().input('ID', sql.Int, id);
    const updateFields: string[] = [];

    if (nombre !== undefined) {
      request.input('Nombre', sql.NVarChar, nombre);
      updateFields.push('Nombre = @Nombre');
    }

    if (correo !== undefined) {
      request.input('Correo', sql.NVarChar, correo);
      updateFields.push('Correo = @Correo');
    }

    if (role !== undefined) {
      request.input('role', sql.NVarChar, role);
      updateFields.push('role = @role');
    }

    const updateQuery = `
      UPDATE Personas
      SET ${updateFields.join(', ')}
      WHERE ID = @ID
    `;

    await request.query(updateQuery);

    return res.status(200).json({ message: 'Participante actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar participante:', error);
    return res.status(500).json({ error: 'Error al actualizar participante' });
  }
}
