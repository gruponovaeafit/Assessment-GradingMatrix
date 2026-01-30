// pages/api/getCalificador.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo se permite POST' });
  }

  if (!requireRoles(req, res, ['admin', 'calificador'])) return;

  const { id_calificador } = req.body;

  if (!id_calificador) {
    return res.status(400).json({ error: 'ID del calificador no proporcionado' });
  }

  try {
    const { data, error } = await supabase
      .from('Staff')
      .select('Correo_Staff')
      .eq('ID_Staff', id_calificador)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Calificador no encontrado' });
    }

    return res.status(200).json({ Correo: data.Correo_Staff });
  } catch (error) {
    console.error('❌ Error al obtener calificador:', error);
    res.status(500).json({ error: 'Error interno al obtener calificador' });
  }
}
