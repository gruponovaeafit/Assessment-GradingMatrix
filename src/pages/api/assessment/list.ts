import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    if (!requireRoles(req, res, ['admin'])) return;
    const { data, error } = await supabase
      .from('Assessment')
      .select('ID_Assessment, Nombre_Assessment, Activo_Assessment')
      .order('ID_Assessment', { ascending: true });

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
