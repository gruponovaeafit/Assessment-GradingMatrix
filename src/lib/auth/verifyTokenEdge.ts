import { jwtVerify } from 'jose';

/**
 * Edge-compatible JWT verification.
 * Uses `jose` instead of `jsonwebtoken` because the Edge runtime
 * does not support Node.js crypto APIs.
 *
 * Returns decoded payload or null if the token is invalid/expired.
 */
export async function verifyTokenEdge(
  token: string
): Promise<{ id: number; email: string; role: string } | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return {
      id: payload.id as number,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}
