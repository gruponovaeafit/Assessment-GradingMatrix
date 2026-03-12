import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/auth/cookie';

/**
 * GET /api/auth/me
 * Lightweight session validation endpoint.
 * Reads the session cookie, verifies the JWT, and returns user info.
 * No DB call — pure JWT decode.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Read token from cookie first, fall back to Authorization header
  let token: string | null = req.cookies?.[COOKIE_NAME] ?? null;

  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  }

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  return res.status(200).json({
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  });
}
