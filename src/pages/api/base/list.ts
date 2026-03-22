// src/pages/api/base/list.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireRoles(req, res, ['admin']);
  if (!user) return;

  const assessmentId = getAuthorizedAssessmentId(user, res);
  if (!assessmentId) return;

  try {
    const { data: bases, error } = await supabase
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
      .eq('ID_Assessment', assessmentId)
      .order('Numero_Base', { ascending: true });

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
