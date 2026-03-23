import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireRoles(req, res, ['admin']);
  if (!user) return;
  if (user.id !== 0) {
    return res.status(403).json({ error: 'Solo el super-admin puede eliminar assessments' });
  }

  const { id } = req.body;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({ error: 'ID de Assessment inválido' });
  }

  try {
    // Attempt deletion. Supabase will fail if there are foreign key constraints 
    // restrictively set (like Calificaciones). If we need cascading, it depends on the schema.
    const { error } = await supabase
      .from('Assessment')
      .delete()
      .eq('ID_Assessment', Number(id));

    if (error) {
      if (error.code === '23503') { // Foreign key constraint error typically
        throw new Error('No se puede eliminar el assessment porque ya tiene dependencias (por ejemplo, calificaciones o participantes).');
      }
      throw new Error(error.message);
    }

    res.status(200).json({ message: 'Assessment eliminado con éxito' });
  } catch (error: any) {
    console.error('❌ Error al eliminar assessment:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar assessment' });
  }
}
