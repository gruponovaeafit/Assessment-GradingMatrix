// Sistema de logs de auditoría
import { supabase } from '@/lib/supabase/server';

export interface AuditLog {
  accion: string;
  usuario_id: number | null;
  usuario_email: string;
  detalles: any; // Cambiado de string a any para soportar JSONB
  ip?: string;
  user_agent?: string;
  fecha?: Date;
}

/**
 * Registra una acción en el log de auditoría
 */
export async function logAudit(log: AuditLog): Promise<void> {
  try {
    const { error } = await supabase.from('AuditLogs').insert({
      Accion: log.accion,
      UsuarioID: log.usuario_id,
      UsuarioEmail: log.usuario_email,
      Detalles: log.detalles, // Supabase-js manejará el objeto como JSONB automáticamente
      IP: log.ip || 'unknown',
      UserAgent: log.user_agent || 'unknown',
      Fecha: (log.fecha ?? new Date()).toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    // Si falla el log, solo registrar en consola (no debe romper la app)
    console.error('⚠️ Error guardando log de auditoría:', error);
    // No usamos JSON.stringify(log) para evitar leak de datos sensibles si log.detalles tiene algo
  }
}

/**
 * Tipos de acciones para auditoría
 */
export const AuditActions = {
  // Auth
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',

  // Staff
  STAFF_CREATED: 'STAFF_CREATED',
  STAFF_UPDATED: 'STAFF_UPDATED',
  STAFF_DELETED: 'STAFF_DELETED',

  // Assessment
  ASSESSMENT_CREATED: 'ASSESSMENT_CREATED',
  ASSESSMENT_UPDATED: 'ASSESSMENT_UPDATED',
  ASSESSMENT_DELETED: 'ASSESSMENT_DELETED',

  // Operaciones
  CALIFICACION_ENVIADA: 'CALIFICACION_ENVIADA',
  PERSONA_REGISTRADA: 'PERSONA_REGISTRADA',
  PERSONA_ACTUALIZADA: 'PERSONA_ACTUALIZADA',
  GRUPOS_GENERADOS: 'GRUPOS_GENERADOS',
  EXPORT_EXCEL: 'EXPORT_EXCEL',
  PASSWORD_HASHED: 'PASSWORD_HASHED',
} as const;

/**
 * Helper para obtener IP del request
 */
export function getClientIP(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
  }
  return req.socket?.remoteAddress || 'unknown';
}
