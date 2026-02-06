// src/pages/api/base/list.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { assessmentId } = req.query;

  try {
    let query = supabase
      .from('Bases')
      .select(`
        ID_Base,
        ID_Assessment,
        Numero_Base,
        Nombre_Base,
        Competencia_Base,
        Descripcion_Base,
        Comportamiento1_Base,
        Comportamiento2_Base,
        Comportamiento3_Base
      `)
      .order('Numero_Base', { ascending: true });

    // Filtrar por assessment si se proporciona
    if (assessmentId) {
      query = query.eq('ID_Assessment', Number(assessmentId));
    }

    const { data: bases, error } = await query;

    if (error) {
      throw error;
    }

    res.status(200).json(bases || []);
  } catch (error) {
    console.error('❌ Error listando bases:', error);
    res.status(500).json({
      error: 'Error al listar bases',
      details: (error as Error).message,
    });
  }
}
