import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { verifyToken, generateToken, type TokenPayload } from '@/lib/auth';
import { setSessionCookie, clearSessionCookie, COOKIE_NAME } from '@/lib/auth/cookie';

const SUPER_ADMIN_ID = 0;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { assessmentId } = req.body;

  if (!assessmentId || typeof assessmentId !== 'number') {
    return res.status(400).json({ error: 'assessmentId es obligatorio y debe ser un número' });
  }

  const parsedId = Number(assessmentId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({ error: 'assessmentId debe ser un entero positivo' });
  }

  let token: string | null = req.cookies?.[COOKIE_NAME] ?? null;

  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  }

  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  if (decoded.id !== SUPER_ADMIN_ID) {
    return res.status(403).json({ error: 'Solo el super-admin puede cambiar de assessment' });
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from('Assessment')
    .select('ID_Assessment')
    .eq('ID_Assessment', parsedId)
    .single();

  if (assessmentError || !assessment) {
    return res.status(404).json({ error: 'Assessment no encontrado' });
  }

  const newToken = generateToken({
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    assessmentId: parsedId,
  });

  setSessionCookie(res, newToken, decoded.role);

  res.status(200).json({
    message: 'Assessment switched successfully',
    assessmentId: parsedId,
  });
}
