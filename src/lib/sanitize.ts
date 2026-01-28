// Utilidades para sanitizar y validar inputs
// Previene SQL injection y XSS

/**
 * Sanitiza un string removiendo caracteres peligrosos
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return '';
  
  return input
    .toString()
    .trim()
    // Remover tags HTML
    .replace(/<[^>]*>/g, '')
    // Escapar caracteres especiales SQL
    .replace(/['";\\]/g, '')
    // Limitar longitud
    .substring(0, 500);
}

/**
 * Sanitiza un email
 */
export function sanitizeEmail(email: string | undefined | null): string {
  if (!email) return '';
  
  const sanitized = email.toString().trim().toLowerCase();
  
  // Validar formato básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized.substring(0, 255);
}

/**
 * Sanitiza un número entero
 */
export function sanitizeInt(input: unknown): number | null {
  if (input === undefined || input === null || input === '') return null;
  
  const num = parseInt(String(input), 10);
  
  if (isNaN(num)) return null;
  
  return num;
}

/**
 * Sanitiza un número decimal
 */
export function sanitizeFloat(input: unknown): number | null {
  if (input === undefined || input === null || input === '') return null;
  
  const num = parseFloat(String(input));
  
  if (isNaN(num)) return null;
  
  return num;
}

/**
 * Valida que un valor esté en un rango
 */
export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Sanitiza un objeto de calificación
 */
export function sanitizeCalificacion(cal: Record<string, unknown>): {
  ID_Persona: number | null;
  ID_Base: number | null;
  ID_Calificador: number | null;
  Calificacion_1: number | null;
  Calificacion_2: number | null;
  Calificacion_3: number | null;
} {
  return {
    ID_Persona: sanitizeInt(cal.ID_Persona),
    ID_Base: sanitizeInt(cal.ID_Base),
    ID_Calificador: sanitizeInt(cal.ID_Calificador),
    Calificacion_1: sanitizeFloat(cal.Calificacion_1),
    Calificacion_2: sanitizeFloat(cal.Calificacion_2),
    Calificacion_3: sanitizeFloat(cal.Calificacion_3),
  };
}

/**
 * Valida calificaciones (deben estar entre 1 y 5)
 */
export function validateCalificaciones(
  cal1: number | null,
  cal2: number | null,
  cal3: number | null
): boolean {
  if (cal1 === null || cal2 === null || cal3 === null) return false;
  
  return (
    validateRange(cal1, 1, 5) &&
    validateRange(cal2, 1, 5) &&
    validateRange(cal3, 1, 5)
  );
}
