// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { comparePassword, generateToken, hashPassword } from '../../../../lib/auth';

// API de login
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

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
      return res.status(200).json({
        role: 'admin',
        superAdmin: true,
        token,
        message: 'Login exitoso',
      });
    }
  }

  try {
    const { data: staff, error } = await supabase
      .from('Staff')
      .select('ID_Staff, Correo_Staff, Contrasena_Staff, ID_Base, Rol_Staff, Active')
      .eq('Correo_Staff', email)
      .single();

    if (error || !staff) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (staff.Active) {
      return res.status(409).json({ error: 'Sesión ya activa para este usuario' });
    }

    // Verificar contraseña
    // Si la contraseña en BD no está hasheada (legado), comparar directamente
    let isValidPassword = false;

    if (staff.Contrasena_Staff?.startsWith('$2')) {
      // Contraseña hasheada con bcrypt
      isValidPassword = await comparePassword(password, staff.Contrasena_Staff);
    } else {
      // Contraseña en texto plano (legado) - comparar directamente
      isValidPassword = staff.Contrasena_Staff === password;

      // Opcional: actualizar a hash para próximos logins
      if (isValidPassword) {
        const hashedPassword = await hashPassword(password);
        await supabase
          .from('Staff')
          .update({ Contrasena_Staff: hashedPassword })
          .eq('ID_Staff', staff.ID_Staff);
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
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
    });

    await supabase
      .from('Staff')
      .update({ Active: true })
      .eq('ID_Staff', staff.ID_Staff);

    res.status(200).json({
      role,
      superAdmin: false,
      ID_Grupo: null,
      ID_Base: staff.ID_Base,
      ID_Calificador: staff.ID_Staff,
      token,
      message: 'Login exitoso',
    });
  } catch (error) {
    console.error('❌ Error al procesar el login:', error);
    res.status(500).json({ error: 'Error al procesar el login' });
  }
}
