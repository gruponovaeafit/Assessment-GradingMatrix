import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { assessmentId, activo } = req.body;

  if (assessmentId === undefined || activo === undefined) {
    return res.status(400).json({ error: 'assessmentId y activo son obligatorios' });
  }

  try {
    const { data, error } = await supabase
      .from('Assessment')
      .update({ Activo_Assessment: Boolean(activo) })
      .eq('ID_Assessment', Number(assessmentId))
      .select('ID_Assessment, Activo_Assessment, ID_GrupoEstudiantil')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error actualizando assessment');
    }

    if (Boolean(activo)) {
      const groupId = data.ID_GrupoEstudiantil as number;
      const { error: deactivateError } = await supabase
        .from('Assessment')
        .update({ Activo_Assessment: false })
        .eq('ID_GrupoEstudiantil', Number(groupId))
        .neq('ID_Assessment', Number(assessmentId));

      if (deactivateError) {
        throw new Error(deactivateError.message);
      }
    }

    res.status(200).json({ message: 'Assessment actualizado', ...data });
  } catch (error) {
    console.error('❌ Error al actualizar assessment:', error);
    res.status(500).json({ error: 'Error al actualizar assessment' });
  }
}
