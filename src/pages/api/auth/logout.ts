import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth';
import { clearSessionCookie, COOKIE_NAME } from '@/lib/auth/cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Read token from cookie first, fall back to Authorization header
  let token: string | null = req.cookies?.[COOKIE_NAME] ?? null;

  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  }

  const decoded = token ? verifyToken(token) : null;

  if (!decoded) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Clear session cookies
  clearSessionCookie(res);

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
