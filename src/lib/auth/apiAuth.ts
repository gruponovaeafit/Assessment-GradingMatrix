import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, type TokenPayload } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/auth/cookie';

type Role = TokenPayload['role'];

export function requireRoles(
  req: NextApiRequest,
  res: NextApiResponse,
  allowed: Role[]
): TokenPayload | null {
  // Read token from cookie first, fall back to Authorization header
  let token: string | null = req.cookies?.[COOKIE_NAME] ?? null;

  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  }

  const decoded = token ? verifyToken(token) : null;

  if (!decoded || !allowed.includes(decoded.role)) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }

  return decoded;
}
