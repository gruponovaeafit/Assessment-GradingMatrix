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

  if (!decoded || !token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // 1. Invalidar el token en el servidor (Blacklist)
  // Usamos el exp del JWT para saber cuánto tiempo guardarlo.
  // Si no tiene exp (raro), usamos 24h por defecto.
  const expiresAt = decoded.exp 
    ? new Date(decoded.exp * 1000).toISOString() 
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  try {
    await supabase
      .from('RevokedTokens')
      .insert({
        Token: token,
        ExpiresAt: expiresAt
      });

    // Clear session cookies
    clearSessionCookie(res);

    if (decoded.id === 0) {
      return res.status(200).json({ message: 'Logout ok' });
    }

    res.status(200).json({ message: 'Logout ok' });
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
}
