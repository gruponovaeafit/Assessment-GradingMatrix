// src/pages/api/base/delete.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { idBase } = req.body;

  if (!idBase) {
    return res.status(400).json({ error: 'idBase es obligatorio' });
  }

  try {
    // Verificar si la base tiene calificaciones asociadas
    const { data: calificaciones, error: checkError } = await supabase
      .from('CalificacionesPorPersona')
      .select('ID_Calificacion')
      .eq('ID_Base', Number(idBase))
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (calificaciones && calificaciones.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la base porque tiene calificaciones asociadas',
      });
    }

    // Verificar si hay staff asignado a esta base
    const { data: staff, error: staffError } = await supabase
      .from('Staff')
      .select('ID_Staff')
      .eq('ID_Base', Number(idBase))
      .limit(1);

    if (staffError) {
      throw staffError;
    }

    if (staff && staff.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la base porque tiene staff asignado',
      });
    }

    // Eliminar la base
    const { error: deleteError } = await supabase
      .from('Bases')
      .delete()
      .eq('ID_Base', Number(idBase));

    if (deleteError) {
      throw deleteError;
    }

    res.status(200).json({ message: 'Base eliminada exitosamente' });
  } catch (error) {
    console.error('❌ Error eliminando base:', error);
    res.status(500).json({
      error: 'Error al eliminar la base',
      details: (error as Error).message,
    });
  }
}
