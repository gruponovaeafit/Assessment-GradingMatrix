// pages/api/admin/hash-passwords.ts
// Utilidad para migrar contraseñas en texto plano a hash (solo admin)
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { hashPassword, withAdminAuth } from '../../../lib/auth';
import { requireRoles } from '@/lib/apiAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    if (!requireRoles(req, res, ['admin'])) return;
    const { data: staffList, error } = await supabase
      .from('Staff')
      .select('ID_Staff, Contrasena_Staff')
      .not('Contrasena_Staff', 'like', '$2%');

    if (error) {
      throw new Error(error.message);
    }

    if (!staffList || staffList.length === 0) {
      return res.status(200).json({
        message: 'Todas las contraseñas ya están hasheadas',
        updated: 0,
      });
    }

    let updatedCount = 0;

    for (const staff of staffList) {
      if (!staff.Contrasena_Staff) {
        continue;
      }

      const hashedPassword = await hashPassword(staff.Contrasena_Staff);

      const { error: updateError } = await supabase
        .from('Staff')
        .update({ Contrasena_Staff: hashedPassword })
        .eq('ID_Staff', staff.ID_Staff);

      if (updateError) {
        throw new Error(updateError.message);
      }

      updatedCount++;
    }

    res.status(200).json({
      message: `Se hashearon ${updatedCount} contraseñas correctamente`,
      updated: updatedCount,
    });
  } catch (error) {
    console.error('❌ Error al hashear contraseñas:', error);
    res.status(500).json({ error: 'Error al procesar las contraseñas' });
  }
}

// Exportar con middleware de autenticación admin
export default withAdminAuth(handler);
