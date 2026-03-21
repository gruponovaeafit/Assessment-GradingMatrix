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

  let authorizedAssessmentId = null;
  if (user.id !== 0) {
    authorizedAssessmentId = getAuthorizedAssessmentId(user, res);
    if (!authorizedAssessmentId) return;
  }

  try {
    let query = supabase
      .from('Assessment')
      .select(
        'ID_Assessment, Nombre_Assessment, Descripcion_Assessment, Activo_Assessment, ID_GrupoEstudiantil, GrupoEstudiantil:GrupoEstudiantil(Nombre_GrupoEstudiantil)'
      )
      .order('ID_Assessment', { ascending: true });

    if (authorizedAssessmentId) {
      query = query.eq('ID_Assessment', authorizedAssessmentId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const payload =
      data?.map((row) => {
        const grupo =
          Array.isArray(row.GrupoEstudiantil) && row.GrupoEstudiantil.length > 0
            ? row.GrupoEstudiantil[0]
            : null;
        return {
          id: row.ID_Assessment,
          nombre: row.Nombre_Assessment,
          descripcion: row.Descripcion_Assessment ?? null,
          activo: row.Activo_Assessment,
          grupoId: row.ID_GrupoEstudiantil,
          grupoNombre: grupo?.Nombre_GrupoEstudiantil ?? null,
        };
      }) ?? [];

    res.status(200).json(payload);
  } catch (error) {
    console.error('❌ Error al listar assessments con grupo:', error);
    res.status(500).json({ error: 'Error al listar assessments' });
  }
}
