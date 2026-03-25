import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';
import { logAudit, AuditActions, getClientIP } from '@/lib/utils/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  const authorizedAssessmentId = getAuthorizedAssessmentId(user, res);
  if (!authorizedAssessmentId) return;

  const { id, active, role, correo } = req.body;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!id) {
    return res.status(400).json({ error: 'ID es obligatorio' });
  }

  // Basic server-side email format guard
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (correo && !emailRegex.test(String(correo).trim())) {
    return res.status(400).json({ error: 'El formato del correo no es válido' });
  }

  const updateData: Record<string, any> = {};
  if (active !== undefined) updateData.Active = active;
  if (role !== undefined) updateData.Rol_Staff = role;
  if (correo !== undefined) updateData.Correo_Staff = String(correo).trim().toLowerCase();

  try {
    const { error } = await supabase
      .from('Staff')
      .update(updateData)
      .eq('ID_Staff', id)
      .eq('ID_Assessment', authorizedAssessmentId);

    if (error) throw new Error(error.message);

    // 📝 Log Audit: Staff Updated
    await logAudit({
        accion: AuditActions.STAFF_UPDATED,
        usuario_id: user.id,
        usuario_email: user.email,
        detalles: { 
          targetStaffId: id,
          assessmentId: authorizedAssessmentId,
          changes: updateData 
        },
        ip,
        user_agent: userAgent
    });

    return res.status(200).json({ message: 'Staff actualizado correctamente' });
  } catch (error: any) {
    console.error('❌ Error al actualizar staff:', error);
    return res.status(500).json({ error: error.message || 'Error al actualizar staff' });
  }
}
