import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const assessmentId = Array.isArray(req.query.assessmentId)
    ? req.query.assessmentId[0]
    : req.query.assessmentId;

  if (!assessmentId) {
    return res.status(400).json({ error: 'assessmentId es obligatorio' });
  }

  try {
    const { data, error } = await supabase
      .from('GrupoAssessment')
      .select('ID_GrupoAssessment, Nombre_GrupoAssessment')
      .eq('ID_Assessment', Number(assessmentId))
      .order('ID_GrupoAssessment', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json(
      (data || []).map((item) => ({
        id: item.ID_GrupoAssessment,
        nombre: item.Nombre_GrupoAssessment,
      }))
    );
  } catch (error) {
    console.error('❌ Error al listar grupos:', error);
    res.status(500).json({ error: 'Error al listar grupos' });
  }
}
