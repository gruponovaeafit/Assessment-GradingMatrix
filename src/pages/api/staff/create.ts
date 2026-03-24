import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';
import { logAudit, AuditActions, getClientIP } from '@/lib/utils/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  const { correo, password, rol, idBase } = req.body;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  const assessmentId = getAuthorizedAssessmentId(user, res);
  if (!assessmentId) return;

  if (!correo || !password || !rol) {
    return res.status(400).json({ error: 'correo, password y rol son obligatorios' });
  }

  try {
    if (idBase) {
      const { data: baseData, error: baseError } = await supabase
        .from('Bases')
        .select('ID_Assessment')
        .eq('ID_Base', Number(idBase))
        .single();

      if (baseError || !baseData || baseData.ID_Assessment !== Number(assessmentId)) {
        return res.status(400).json({ error: 'El Base no pertenece a este Assessment' });
      }
    }

    const hashedPassword = await hashPassword(password);

    const staffData = {
      ID_Assessment: Number(assessmentId),
      Correo_Staff: correo,
      Contrasena_Staff: hashedPassword,
      Rol_Staff: rol,
      Active: true,
      ID_Base: idBase ? Number(idBase) : null,
    };

    const { data, error } = await supabase
      .from('Staff')
      .insert(staffData)
      .select('ID_Staff')
      .single();

    if (error) {
      // Correo duplicado — unique constraint de Supabase/Postgres
      if (error.code === '23505') {
        return res.status(409).json({ error: `El correo ${correo} ya esta registrado como staff` });
      }
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('No se pudo crear el staff');
    }

    // 📝 Log Audit: Staff Created
    await logAudit({
      accion: AuditActions.STAFF_CREATED,
      usuario_id: user.id,
      usuario_email: user.email,
      detalles: { 
        targetEmail: correo, 
        role: rol, 
        assessmentId, 
        staffId: data.ID_Staff,
        baseId: idBase || null
      },
      ip,
      user_agent: userAgent
    });

    res.status(200).json({ message: 'Staff registrado', ID_Staff: data.ID_Staff });
  } catch (error) {
    console.error('Error al crear staff:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error inesperado al crear staff',
    });
  }
}
