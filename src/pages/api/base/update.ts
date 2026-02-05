// src/pages/api/base/update.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const {
    idBase,
    nombre,
    competencia,
    descripcion,
    comportamiento1,
    comportamiento2,
    comportamiento3,
  } = req.body;

  if (!idBase) {
    return res.status(400).json({ error: 'idBase es obligatorio' });
  } 

  try {
    const updates: any = {};

    if (nombre) updates.Nombre_Base = nombre.trim();
    if (competencia) updates.Competencia_Base = competencia.trim();
    if (descripcion) updates.Descripcion_Base = descripcion.trim();
    if (comportamiento1) updates.Comportamiento1_Base = comportamiento1.trim();
    if (comportamiento2) updates.Comportamiento2_Base = comportamiento2.trim();
    if (comportamiento3) updates.Comportamiento3_Base = comportamiento3.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const { error: updateError } = await supabase
      .from('Bases')
      .update(updates)
      .eq('ID_Base', Number(idBase));

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({ message: 'Base actualizada exitosamente' });
  } catch (error) {
    console.error('❌ Error actualizando base:', error);
    res.status(500).json({
      error: 'Error al actualizar la base',
      details: (error as Error).message,
    });
  }
}
