import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, type TokenPayload } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/auth/cookie';
import { supabase } from '@/lib/supabase/server';
import { logAudit, AuditActions, getClientIP } from '@/lib/utils/audit';

type Role = TokenPayload['role'];

export async function requireRoles(
  req: NextApiRequest,
  res: NextApiResponse,
  allowed: Role[]
): Promise<TokenPayload | null> {
  // Read token from cookie first, fall back to Authorization header
  let token: string | null = req.cookies?.[COOKIE_NAME] ?? null;

  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  }

  const decoded = token ? verifyToken(token) : null;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!decoded || !token) {
    // 📝 Log Audit: Unauthorized (No token or invalid)
    await logAudit({
      accion: AuditActions.UNAUTHORIZED_ACCESS,
      usuario_id: null,
      usuario_email: 'anonymous',
      detalles: { reason: 'Token inválido o ausente', path: req.url },
      ip,
      user_agent: userAgent
    });
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }

  if (!allowed.includes(decoded.role)) {
    // 📝 Log Audit: Unauthorized (Wrong role)
    await logAudit({
      accion: AuditActions.UNAUTHORIZED_ACCESS,
      usuario_id: decoded.id,
      usuario_email: decoded.email,
      detalles: { 
        reason: 'Rol insuficiente', 
        required: allowed, 
        actual: decoded.role,
        path: req.url 
      },
      ip,
      user_agent: userAgent
    });
    res.status(403).json({ error: 'Prohibido: Permisos insuficientes' });
    return null;
  }

  // 🛡️ Verificar Blacklist (RevokedTokens)
  const { data: revoked, error: revokedError } = await supabase
    .from('RevokedTokens')
    .select('Token')
    .eq('Token', token)
    .maybeSingle();

  if (revokedError) {
    console.error('[requireRoles] Error verificando blacklist:', revokedError);
    // Si la DB falla, permitimos el paso por defecto para evitar logouts falsos positivos
  } else if (revoked) {
    console.warn('[requireRoles] Acceso denegado: Token revocado');
    res.status(401).json({ error: 'Sesión terminada' });
    return null;
  }

  return decoded;
}
