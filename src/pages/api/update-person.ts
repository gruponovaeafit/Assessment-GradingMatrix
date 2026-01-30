import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { getDefaultAssessmentId } from '@/lib/assessment';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { id, nombre, correo, role } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID es obligatorio' });
  }

  if (nombre === undefined && correo === undefined && role === undefined) {
    return res.status(400).json({ error: 'Debe enviarse al menos un campo para actualizar' });
  }

  try {
    const assessmentId = await getDefaultAssessmentId();
    const updateData: Record<string, unknown> = {};

    if (nombre !== undefined) {
      updateData.Nombre_Participante = nombre;
    }

    if (correo !== undefined) {
      updateData.Correo_Participante = correo;
    }

    if (role !== undefined) {
      updateData.Rol_Participante = role;
    }

    const { error } = await supabase
      .from('Participante')
      .update(updateData)
      .eq('ID_Participante', id)
      .eq('ID_Assessment', assessmentId);

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }
      throw new Error(error.message);
    }

    return res.status(200).json({ message: 'Participante actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar participante:', error);
    return res.status(500).json({ error: 'Error al actualizar participante' });
  }
}
