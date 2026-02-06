import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const decoded = token ? verifyToken(token) : null;

  if (!decoded) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (decoded.id === 0) {
    return res.status(200).json({ message: 'Logout ok' });
  }

  try {
    const { error } = await supabase
      .from('Staff')
      .update({ Active: false })
      .eq('ID_Staff', decoded.id);

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ message: 'Logout ok' });
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
}
