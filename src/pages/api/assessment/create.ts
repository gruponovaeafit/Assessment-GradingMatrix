import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireRoles(req, res, ['admin']);
  if (!user) return;

  if (user.id !== 0) {
    return res.status(403).json({ error: 'Solo el super-admin puede crear assessments' });
  }

  const { grupoEstudiantilId, nombre, descripcion, activo } = req.body;

  if (!grupoEstudiantilId || !nombre) {
    return res.status(400).json({ error: 'grupoEstudiantilId y nombre son obligatorios' });
  }

  try {
    const { data: grupo, error: grupoError } = await supabase
      .from('GrupoEstudiantil')
      .select('ID_GrupoEstudiantil')
      .eq('ID_GrupoEstudiantil', Number(grupoEstudiantilId))
      .single();

    if (grupoError || !grupo) {
      return res.status(400).json({ error: 'ID de GrupoEstudiantil no existe' });
    }

    const { data, error } = await supabase
      .from('Assessment')
      .insert({
        ID_GrupoEstudiantil: Number(grupoEstudiantilId),
        Nombre_Assessment: nombre,
        Descripcion_Assessment: descripcion || null,
        Activo_Assessment: activo !== undefined ? Boolean(activo) : true,
      })
      .select('ID_Assessment')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error creando assessment');
    }

    res.status(200).json({ message: 'Assessment creado', ID_Assessment: data.ID_Assessment });
  } catch (error) {
    console.error('❌ Error al crear assessment:', error);
    res.status(500).json({ error: 'Error al crear assessment' });
  }
}
