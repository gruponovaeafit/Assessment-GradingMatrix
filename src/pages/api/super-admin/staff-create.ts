import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth';
import { requireRoles } from '@/lib/auth/apiAuth';
import { logAudit, AuditActions, getClientIP } from '@/lib/utils/audit';

/**
 * POST /api/super-admin/staff-create
 *
 * Creates a staff member for a given assessment.
 * Unlike /api/staff/create, this endpoint accepts `assessmentId` from
 * the request body — necessary so the super-admin (who has no assessmentId
 * in their JWT) can create staff for newly created assessments without
 * triggering the session-destruction logic in getAuthorizedAssessmentId().
 *
 * Protected: super-admin only (user.id === 0).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  // Restrict to super-admin
  if (user.id !== 0) {
    return res.status(403).json({ error: 'Solo el super-admin puede usar este endpoint' });
  }

  const { assessmentId, correo, password, rol } = req.body;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!assessmentId || Number.isNaN(Number(assessmentId))) {
    return res.status(400).json({ error: 'assessmentId inválido o ausente' });
  }
  if (!correo || typeof correo !== 'string' || !correo.trim()) {
    return res.status(400).json({ error: 'correo es obligatorio' });
  }
  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'password es obligatorio' });
  }
  if (!rol) {
    return res.status(400).json({ error: 'rol es obligatorio' });
  }

  // Basic server-side email format guard
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(correo.trim())) {
    return res.status(400).json({ error: 'El formato del correo no es válido' });
  }

  try {
    const hashedPassword = await hashPassword(password.trim());

    const { data, error } = await supabase
      .from('Staff')
      .insert({
        ID_Assessment: Number(assessmentId),
        Correo_Staff: correo.trim().toLowerCase(),
        Contrasena_Staff: hashedPassword,
        Rol_Staff: rol,
        Active: true, // Admin is active immediately
      })
      .select('ID_Staff')
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un administrador con ese correo en este assessment' });
      }
      throw new Error(error?.message || 'Error al crear el staff');
    }

    // 📝 Log Audit: Staff Created (by Super Admin)
    await logAudit({
      accion: AuditActions.STAFF_CREATED,
      usuario_id: user.id,
      usuario_email: user.email,
      detalles: { 
        targetEmail: correo.trim().toLowerCase(), 
        role: rol, 
        assessmentId: Number(assessmentId),
        staffId: data.ID_Staff,
        context: 'super-admin'
      },
      ip,
      user_agent: userAgent
    });

    return res.status(200).json({ message: 'Administrador creado', ID_Staff: data.ID_Staff });
  } catch (err: any) {
    console.error('[API:super-admin/staff-create] ❌', err.message);
    return res.status(500).json({ error: 'Error interno al crear el administrador' });
  }
}
