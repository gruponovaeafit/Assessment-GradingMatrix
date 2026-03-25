// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { comparePassword, generateToken, hashPassword } from '@/lib/auth';
import { setSessionCookie } from '@/lib/auth/cookie';
import { logAudit, AuditActions, getClientIP } from '@/lib/utils/audit';

// API de login
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  // Verificar si es admin
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || (!adminPassword && !adminPasswordHash)) {
    return res.status(500).json({ error: 'Configuración de admin incompleta' });
  }

  if (email === adminEmail) {
    const isAdminPasswordValid = adminPasswordHash
      ? await comparePassword(password, adminPasswordHash)
      : password === adminPassword;

    if (isAdminPasswordValid) {
      const token = generateToken({ id: 0, email: adminEmail, role: 'admin' });
      setSessionCookie(res, token, 'admin');

      // 📝 Log Audit: Login SuperAdmin
      await logAudit({
        accion: AuditActions.LOGIN_SUCCESS,
        usuario_id: 0,
        usuario_email: adminEmail,
        detalles: { role: 'admin', superAdmin: true },
        ip,
        user_agent: userAgent
      });

      return res.status(200).json({
        role: 'admin',
        superAdmin: true,
        message: 'Login exitoso',
      });
    } else {
        // 📝 Log Audit: Failed SuperAdmin Login
        await logAudit({
            accion: AuditActions.LOGIN_FAILED,
            usuario_id: null,
            usuario_email: adminEmail,
            detalles: { reason: 'Contraseña incorrecta', target: 'superadmin' },
            ip,
            user_agent: userAgent
        });
        return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  }

  try {
    const { data: staff, error } = await supabase
      .from('Staff')
      .select('ID_Staff, Correo_Staff, Contrasena_Staff, ID_Base, ID_Assessment, Rol_Staff, Active')
      .eq('Correo_Staff', email)
      .single();

    if (error || !staff) {
      // 📝 Log Audit: Failed Login (User not found)
      await logAudit({
        accion: AuditActions.LOGIN_FAILED,
        usuario_id: null,
        usuario_email: email,
        detalles: { reason: 'Usuario no encontrado' },
        ip,
        user_agent: userAgent
      });
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar contraseña
    let isValidPassword = false;

    if (staff.Contrasena_Staff?.startsWith('$2')) {
      isValidPassword = await comparePassword(password, staff.Contrasena_Staff);
    } else {
      isValidPassword = staff.Contrasena_Staff === password;

      if (isValidPassword) {
        const hashedPassword = await hashPassword(password);
        await supabase
          .from('Staff')
          .update({ Contrasena_Staff: hashedPassword })
          .eq('ID_Staff', staff.ID_Staff);
      }
    }

    if (!isValidPassword) {
      // 📝 Log Audit: Failed Login (Wrong password)
      await logAudit({
        accion: AuditActions.LOGIN_FAILED,
        usuario_id: staff.ID_Staff,
        usuario_email: staff.Correo_Staff,
        detalles: { reason: 'Contraseña incorrecta' },
        ip,
        user_agent: userAgent
      });
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // 2. Add validation after staff is found and password verified:
    if (staff.Active === false) {
      // 📝 Log Audit: Failed Login (Account disabled)
      await logAudit({
        accion: AuditActions.LOGIN_FAILED,
        usuario_id: staff.ID_Staff,
        usuario_email: staff.Correo_Staff,
        detalles: { reason: 'Cuenta desactivada' },
        ip,
        user_agent: userAgent
      });
      return res.status(401).json({ error: 'Tu cuenta ha sido desactivada por el administrador.' });
    }

    // 3. Check assessment status (if not super-admin):
    const { data: assessment, error: assessmentError } = await supabase
      .from('Assessment')
      .select('Activo_Assessment')
      .eq('ID_Assessment', staff.ID_Assessment)
      .single();

    if (assessmentError || !assessment || !assessment.Activo_Assessment) {
      // 📝 Log Audit: Failed Login (Assessment inactive)
      await logAudit({
        accion: AuditActions.LOGIN_FAILED,
        usuario_id: staff.ID_Staff,
        usuario_email: staff.Correo_Staff,
        detalles: { reason: 'Assessment desactivado', assessmentId: staff.ID_Assessment },
        ip,
        user_agent: userAgent
      });
      return res.status(401).json({ error: 'Este assessment se encuentra desactivado.' });
    }

    // Generar token JWT
    let role: 'admin' | 'registrador' | 'calificador' = 'calificador';
    if (staff.Rol_Staff === 'admin') {
      role = 'admin';
    } else if (staff.Rol_Staff === 'registrador') {
      role = 'registrador';
    }

    const token = generateToken({
      id: staff.ID_Staff,
      email: staff.Correo_Staff,
      role,
      assessmentId: staff.ID_Assessment,
    });

    setSessionCookie(res, token, role);

    // 📝 Log Audit: Successful Login
    await logAudit({
        accion: AuditActions.LOGIN_SUCCESS,
        usuario_id: staff.ID_Staff,
        usuario_email: staff.Correo_Staff,
        detalles: { role, assessmentId: staff.ID_Assessment },
        ip,
        user_agent: userAgent
    });

    res.status(200).json({
      role,
      superAdmin: false,
      ID_Grupo: null,
      ID_Base: staff.ID_Base,
      ID_Calificador: staff.ID_Staff,
      message: 'Login exitoso',
    });
  } catch (error) {
    console.error('❌ Error al procesar el login:', error);
    res.status(500).json({ error: 'Error al procesar el login' });
  }
}
