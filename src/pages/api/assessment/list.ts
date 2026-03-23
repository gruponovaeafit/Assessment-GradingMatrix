import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const user = await requireRoles(req, res, ['admin']);
    if (!user) return;
    
    // Super-admins pueden ver todos los assessments sin restricción.
    // Admins regulares se filtran a su propio assessment.
    let authorizedAssessmentId = null;
    if (user.id !== 0) {
      authorizedAssessmentId = getAuthorizedAssessmentId(user, res);
      if (!authorizedAssessmentId) return;
    }

    const { activo } = req.query;
    let query = supabase
      .from('Assessment')
      .select('ID_Assessment, Nombre_Assessment, Activo_Assessment')
      .order('ID_Assessment', { ascending: true });

    if (authorizedAssessmentId) {
      query = query.eq('ID_Assessment', authorizedAssessmentId);
    }

    if (activo === 'true') {
      query = query.eq('Activo_Assessment', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const payload = (data || []).map((item) => ({
      id: item.ID_Assessment,
      nombre: item.Nombre_Assessment,
      activo: item.Activo_Assessment,
    }));

    res.status(200).json(payload);
  } catch (error) {
    console.error('❌ Error al listar assessments:', error);
    res.status(500).json({ error: 'Error al listar assessments' });
  }
}
