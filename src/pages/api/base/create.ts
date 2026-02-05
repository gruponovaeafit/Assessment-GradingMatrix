// src/pages/api/base/create.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const {
    assessmentId,
    numeroBase,
    nombre,
    competencia,
    descripcion,
    comportamiento1,
    comportamiento2,
    comportamiento3,
  } = req.body;

  // Validaciones
  if (
    !assessmentId ||
    !numeroBase ||
    !nombre ||
    !competencia ||
    !descripcion ||
    !comportamiento1 ||
    !comportamiento2 ||
    !comportamiento3
  ) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    // Verificar que el assessment existe
    const { data: assessment, error: assessmentError } = await supabase
      .from('Assessment')
      .select('ID_Assessment')
      .eq('ID_Assessment', Number(assessmentId))
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({ error: 'Assessment no encontrado' });
    }

    // Crear la base
    const { data: newBase, error: insertError } = await supabase
      .from('Bases')
      .insert({
        ID_Assessment: Number(assessmentId),
        Numero_Base: Number(numeroBase),
        Nombre_Base: nombre.trim(),
        Competencia_Base: competencia.trim(),
        Descripcion_Base: descripcion.trim(),
        Comportamiento1_Base: comportamiento1.trim(),
        Comportamiento2_Base: comportamiento2.trim(),
        Comportamiento3_Base: comportamiento3.trim(),
      })
      .select('ID_Base')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint violation
        return res.status(400).json({
          error: `Ya existe una base con el número ${numeroBase} en este assessment`,
        });
      }
      throw insertError;
    }

    res.status(201).json({
      message: 'Base creada exitosamente',
      ID_Base: newBase.ID_Base,
    });
  } catch (error) {
    console.error('❌ Error creando base:', error);
    res.status(500).json({
      error: 'Error al crear la base',
      details: (error as Error).message,
    });
  }
}
