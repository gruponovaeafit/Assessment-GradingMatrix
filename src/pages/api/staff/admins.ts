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

  const authorizedAssessmentId = getAuthorizedAssessmentId(user, res);
  if (!authorizedAssessmentId) return;

  try {
    let query = supabase
      .from('Staff')
      .select(
        'ID_Staff, Correo_Staff, ID_Assessment, Rol_Staff, Assessment:Assessment(Nombre_Assessment, ID_GrupoEstudiantil, GrupoEstudiantil:GrupoEstudiantil(Nombre_GrupoEstudiantil))'
      )
      .eq('Rol_Staff', 'admin')
      .order('ID_Staff', { ascending: true });

    // Si es admin normal, solo puede ver a los admins de su assessment
    if (user.id !== 0) {
      query = query.eq('ID_Assessment', authorizedAssessmentId);
    }
    // Si es super-admin, y tiene un assessment asignado, podemos filtrar o dejarlo ver todos
    // Mantendremos el comportamiento de ver todos para super admin por ahora, o filtrar si hay impersonation
    // Mejor, para super admin mostramos todos como estaba antes, o los de su assessment si tiene

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const payload =
      data?.map((row) => {
        const assessment =
          Array.isArray(row.Assessment) && row.Assessment.length > 0 ? row.Assessment[0] : null;
        const grupo =
          assessment && Array.isArray(assessment.GrupoEstudiantil) && assessment.GrupoEstudiantil.length > 0
            ? assessment.GrupoEstudiantil[0]
            : null;

        return {
          id: row.ID_Staff,
          correo: row.Correo_Staff,
          assessmentId: row.ID_Assessment,
          assessmentNombre: assessment?.Nombre_Assessment ?? null,
          grupoNombre: grupo?.Nombre_GrupoEstudiantil ?? null,
        };
      }) ?? [];

    res.status(200).json(payload);
  } catch (error) {
    console.error('❌ Error al listar admins:', error);
    res.status(500).json({ error: 'Error al listar admins' });
  }
}
