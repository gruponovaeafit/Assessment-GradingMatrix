import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id_base } = req.body;

  if (!id_base) {
    return res.status(400).json({ error: 'El campo id_base es obligatorio' });
  }

  try {
    const { data, error } = await supabase
      .from('Bases')
      .select(
        'ID_Base, Nombre_Base, Competencia_Base, Descripcion_Base, Comportamiento1_Base, Comportamiento2_Base, Comportamiento3_Base'
      )
      .eq('ID_Base', id_base)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Base no encontrada' });
    }

    return res.status(200).json({
      ID_Base: data.ID_Base,
      Nombre: data.Nombre_Base,
      Competencia: data.Competencia_Base,
      Descripcion: data.Descripcion_Base,
      Comportamiento1: data.Comportamiento1_Base,
      Comportamiento2: data.Comportamiento2_Base,
      Comportamiento3: data.Comportamiento3_Base,
    });
  } catch (error) {
    console.error('❌ Error al obtener la base:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
