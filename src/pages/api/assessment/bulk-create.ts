import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

const buildName = (groupName: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const semester = now.getMonth() < 6 ? 1 : 2;
  const sanitized = groupName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  return `Assessment_${sanitized}_${year}_S${semester}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { grupoIds, activo } = req.body ?? {};
  const activeFlag = Boolean(activo);

  try {
    const groupQuery = supabase
      .from('GrupoEstudiantil')
      .select('ID_GrupoEstudiantil, Nombre_GrupoEstudiantil');

    if (Array.isArray(grupoIds) && grupoIds.length > 0) {
      groupQuery.in('ID_GrupoEstudiantil', grupoIds.map((id) => Number(id)));
    }

    const { data: groups, error: groupsError } = await groupQuery;
    if (groupsError) throw new Error(groupsError.message);

    const payloads =
      groups?.map((group) => ({
        grupoId: group.ID_GrupoEstudiantil,
        nombre: buildName(group.Nombre_GrupoEstudiantil),
      })) ?? [];

    if (payloads.length === 0) {
      return res.status(200).json({ created: [], skipped: [] });
    }

    const names = payloads.map((item) => item.nombre);
    const { data: existing, error: existingError } = await supabase
      .from('Assessment')
      .select('ID_Assessment, Nombre_Assessment, ID_GrupoEstudiantil')
      .in('Nombre_Assessment', names);

    if (existingError) throw new Error(existingError.message);

    const existingNames = new Set((existing ?? []).map((row) => row.Nombre_Assessment));
    const toCreate = payloads.filter((item) => !existingNames.has(item.nombre));
    const skipped = payloads.filter((item) => existingNames.has(item.nombre));

    if (toCreate.length === 0) {
      return res.status(200).json({ created: [], skipped });
    }

    const { data: created, error: createError } = await supabase
      .from('Assessment')
      .insert(
        toCreate.map((item) => ({
          ID_GrupoEstudiantil: item.grupoId,
          Nombre_Assessment: item.nombre,
          Descripcion_Assessment: null,
          Activo_Assessment: activeFlag,
        }))
      )
      .select('ID_Assessment, ID_GrupoEstudiantil, Nombre_Assessment, Activo_Assessment');

    if (createError) throw new Error(createError.message);

    if (activeFlag && created && created.length > 0) {
      await Promise.all(
        created.map((row) =>
          supabase
            .from('Assessment')
            .update({ Activo_Assessment: false })
            .eq('ID_GrupoEstudiantil', row.ID_GrupoEstudiantil)
            .neq('ID_Assessment', row.ID_Assessment)
        )
      );
    }

    res.status(200).json({
      created:
        created?.map((row) => ({
          id: row.ID_Assessment,
          nombre: row.Nombre_Assessment,
          grupoId: row.ID_GrupoEstudiantil,
          activo: row.Activo_Assessment,
        })) ?? [],
      skipped,
    });
  } catch (error) {
    console.error('❌ Error en bulk create assessments:', error);
    res.status(500).json({ error: 'Error al crear assessments masivos' });
  }
}
