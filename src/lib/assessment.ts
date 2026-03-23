import { supabase } from '@/lib/supabase/server';
import type { TokenPayload } from '@/lib/auth';
import { clearSessionCookie } from '@/lib/auth/cookie';
import type { NextApiResponse } from 'next';

// Super admin tiene id 0 en el token
const SUPER_ADMIN_ID = 0;

/**
 * Verifica si el usuario tiene acceso al assessment solicitado.
 * Para super-admin (id=0), permite acceso a cualquier assessment.
 * Para otros roles, verifica que el assessmentId del token coincida con el solicitado.
 * Si no hay acceso, destruye la sesión.
 */
export function verifyAssessmentAccess(
  user: TokenPayload,
  requestedAssessmentId: number,
  res: NextApiResponse
): boolean {
  // Super admin tiene acceso a todos los assessments
  if (user.id === SUPER_ADMIN_ID) {
    return true;
  }

  // Verificar que el usuario tenga un assessmentId en su token
  if (!user.assessmentId) {
    console.warn('[verifyAssessmentAccess] Usuario sin assessmentId en token');
    clearSessionCookie(res);
    res.status(403).json({ error: 'Sin acceso a ningún assessment' });
    return false;
  }

  // Verificar que el assessmentId coincida
  if (user.assessmentId !== requestedAssessmentId) {
    console.warn(`[verifyAssessmentAccess] Acceso denegado: usuario ${user.id} intenta acceder a assessment ${requestedAssessmentId}, tiene ${user.assessmentId}`);
    clearSessionCookie(res);
    res.status(403).json({ error: 'No tienes acceso a este assessment' });
    return false;
  }

  return true;
}

/**
 * Obtiene el ID del assessment de forma segura a partir del JWT del usuario.
 * Retorna el ID validado o null si no se encuentra o no hay acceso (respondiendo con error HTTP).
 * Las rutas deben usar esto en lugar de confiar en req.query.assessmentId o req.body.assessmentId.
 */
export function getAuthorizedAssessmentId(
  user: TokenPayload,
  res: NextApiResponse
): number | null {
  const assessmentId = user.assessmentId;

  if (!assessmentId) {
    if (user.id === SUPER_ADMIN_ID) {
      console.warn(`[getAuthorizedAssessmentId] Super-admin ${user.id} intentó acceder sin assessmentId en el token. Debe usar /api/auth/switch-assessment`);
    } else {
      console.warn(`[getAuthorizedAssessmentId] Usuario ${user.id} no tiene assessmentId en su token`);
    }
    clearSessionCookie(res);
    res.status(403).json({ error: 'No tienes un assessment asignado activo' });
    return null;
  }

  if (!verifyAssessmentAccess(user, assessmentId, res)) {
    return null;
  }

  return assessmentId;
}

// Función para resolver el ID del Assessment a partir de un string o número
export async function resolveAssessmentId(data: string | string[] | number | undefined): Promise<{ id: number } | { error: string; status: number }> {
  if (data === undefined || data === null || Array.isArray(data)) {
    return { error: 'AssessmentId is required', status: 400 };
  }

  const parsed = Number(data);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: 'AssessmentId must be a positive integer', status: 400 };
  }

  const { data: assessmentData, error } = await supabase
    .from('Assessment')
    .select('ID_Assessment')
    .eq('ID_Assessment', parsed)
    .single();

  if (error || !assessmentData) {
    return { error: 'Assessment not found', status: 404 };
  }

  return { id: assessmentData.ID_Assessment };
}

// Función para obtener el ID del Assessment asociado a un Staff específico
export async function getAssessmentIdForStaff(staffId: number): Promise<{ id: number } | { error: string; status: number }> {
  const { data, error } = await supabase
    .from('Staff')
    .select('ID_Assessment')
    .eq('ID_Staff', staffId)
    .single();

  if (error || !data) {
    return { error: 'Staff not found', status: 404 };
  }

  return { id: data.ID_Assessment };
}

// Función para obtener el ID del Assessment asociado a un Participante específico
export async function getAssessmentIdForParticipant(participantId: number): Promise<{ id: number } | { error: string; status: number }> {
  const { data, error } = await supabase
    .from('Participante')
    .select('ID_Assessment')
    .eq('ID_Participante', participantId)
    .single();

  if (error || !data) {
    return { error: 'Participant not found', status: 404 };
  }

  return { id: data.ID_Assessment };
}