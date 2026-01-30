// Sistema de logs de auditoría
import { supabase } from '@/lib/supabaseServer';

export interface AuditLog {
  accion: string;
  usuario_id: number | null;
  usuario_email: string;
  detalles: string;
  ip?: string;
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
      Detalles: log.detalles,
      IP: log.ip || 'unknown',
      Fecha: (log.fecha ?? new Date()).toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    // Si falla el log, solo registrar en consola (no debe romper la app)
    console.error('⚠️ Error guardando log de auditoría:', error);
    console.log('📝 Log (fallback):', JSON.stringify(log));
  }
}

/**
 * Tipos de acciones para auditoría
 */
export const AuditActions = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
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
