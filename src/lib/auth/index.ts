import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';

// Constantes de configuración
const JWT_SECRET = process.env.JWT_SECRET ?? '';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '8h';

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

// Tipos
export interface TokenPayload {
  id: number;
  email: string;
  role: 'admin' | 'calificador' | 'registrador';
  iat?: number;
  exp?: number;
}

// ============ FUNCIONES DE HASH ============

/**
 * Hashea una contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara una contraseña con su hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============ FUNCIONES DE JWT ============

/**
 * Genera un token JWT
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verifica y decodifica un token JWT
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// ============ MIDDLEWARE DE AUTENTICACIÓN ============

export type AuthenticatedHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: TokenPayload
) => Promise<void> | void;

/**
 * Middleware para proteger rutas de API
 * Verifica el token en el header Authorization o en cookies
 */
export function withAuth(handler: AuthenticatedHandler, allowedRoles?: ('admin' | 'calificador' | 'registrador')[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Obtener token del header Authorization o cookies
      let token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        // Intentar obtener de cookies
        const cookieToken = req.cookies?.authToken;
        if (cookieToken) {
          token = cookieToken;
        }
      }

      if (!token) {
        return res.status(401).json({ error: 'No autorizado: Token no proporcionado' });
      }

      const decoded = verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ error: 'No autorizado: Token inválido o expirado' });
      }

      // Verificar roles permitidos si se especifican
      if (allowedRoles && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Prohibido: No tienes permisos para esta acción' });
      }

      // Ejecutar el handler con el usuario autenticado
      return handler(req, res, decoded);
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      return res.status(500).json({ error: 'Error interno de autenticación' });
    }
  };
}

/**
 * Middleware solo para administradores
 */
export function withAdminAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, ['admin']);
}

/**
 * Middleware para calificadores (también permite admin)
 */
export function withCalificadorAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, ['admin', 'calificador']);
}
