import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { hashPassword } from '@/lib/auth';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { assessmentId, correo, password, rol, idBase } = req.body;

  if (!assessmentId || !correo || !password || !rol) {
    return res.status(400).json({ error: 'assessmentId, correo, password y rol son obligatorios' });
  }
  
  try {
    // Validar que el Base pertenezca al Assessment si se proporciona
    
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
      Active: false,
      ID_Base: idBase ? Number(idBase) : null,
    };

    console.log('📝 Intentando insertar en Staff:', staffData);

    const { data, error } = await supabase
      .from('Staff')
      .insert(staffData)
      .select('ID_Staff')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error creando staff');
    }

    res.status(200).json({ message: 'Calificador registrado', ID_Staff: data.ID_Staff });
  } catch (error) {
    console.error('❌ Error al crear staff:', error);
    res.status(500).json({ error: 'Error al crear staff' });
  }
}
