import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  try {
    const [groupsResult, assessmentsResult, adminsResult] = await Promise.all([
      supabase
        .from('GrupoEstudiantil')
        .select('ID_GrupoEstudiantil, Nombre_GrupoEstudiantil, Descripcion_GrupoEstudiantil')
        .order('ID_GrupoEstudiantil', { ascending: true }),
      supabase
        .from('Assessment')
        .select(
          'ID_Assessment, Nombre_Assessment, Descripcion_Assessment, Activo_Assessment, ID_GrupoEstudiantil, GrupoEstudiantil:GrupoEstudiantil(Nombre_GrupoEstudiantil)'
        )
        .order('ID_Assessment', { ascending: true }),
      supabase
        .from('Staff')
        .select(
          'ID_Staff, Correo_Staff, ID_Assessment, Rol_Staff, Assessment:Assessment(Nombre_Assessment, ID_GrupoEstudiantil, GrupoEstudiantil:GrupoEstudiantil(Nombre_GrupoEstudiantil))'
        )
        .eq('Rol_Staff', 'admin')
        .order('ID_Staff', { ascending: true }),
    ]);

    if (groupsResult.error) throw new Error(groupsResult.error.message);
    if (assessmentsResult.error) throw new Error(assessmentsResult.error.message);
    if (adminsResult.error) throw new Error(adminsResult.error.message);

    const groups =
      groupsResult.data?.map((row) => ({
        id: row.ID_GrupoEstudiantil,
        nombre: row.Nombre_GrupoEstudiantil,
        descripcion: row.Descripcion_GrupoEstudiantil ?? null,
      })) ?? [];

    const assessments =
      assessmentsResult.data?.map((row) => {
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

    const admins =
      adminsResult.data?.map((row) => {
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

    res.status(200).json({ groups, assessments, admins });
  } catch (error) {
    console.error('❌ Error al cargar panel admin:', error);
    res.status(500).json({ error: 'Error al cargar panel admin' });
  }
}
