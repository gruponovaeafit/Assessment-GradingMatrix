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
      .from('GrupoEstudiantil')
      .select('ID_GrupoEstudiantil, Nombre_GrupoEstudiantil, Descripcion_GrupoEstudiantil')
      .order('ID_GrupoEstudiantil', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const payload =
      data?.map((row) => ({
        id: row.ID_GrupoEstudiantil,
        nombre: row.Nombre_GrupoEstudiantil,
        descripcion: row.Descripcion_GrupoEstudiantil ?? null,
      })) ?? [];

    res.status(200).json(payload);
  } catch (error) {
    console.error('❌ Error al listar grupos estudiantiles:', error);
    res.status(500).json({ error: 'Error al listar grupos estudiantiles' });
  }
}
