import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  try {
    const { data, error } = await supabase
      .from('Assessment')
      .select(
        'ID_Assessment, Nombre_Assessment, Descripcion_Assessment, Activo_Assessment, ID_GrupoEstudiantil, GrupoEstudiantil:GrupoEstudiantil(Nombre_GrupoEstudiantil)'
      )
      .order('ID_Assessment', { ascending: true });

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
