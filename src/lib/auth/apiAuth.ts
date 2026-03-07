import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, type TokenPayload } from '@/lib/auth';

type Role = TokenPayload['role'];

export function requireRoles(
  req: NextApiRequest,
  res: NextApiResponse,
  allowed: Role[]
): TokenPayload | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const decoded = token ? verifyToken(token) : null;

  if (!decoded || !allowed.includes(decoded.role)) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }

  return decoded;
}
