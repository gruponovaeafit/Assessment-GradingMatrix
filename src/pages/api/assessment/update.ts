import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { assessmentId, descripcion, activo, grupoEstudiantilId } = req.body ?? {};

  if (!assessmentId) {
    return res.status(400).json({ error: 'assessmentId es obligatorio' });
  }

  const updatePayload: Record<string, string | number | boolean | null> = {};

  if (descripcion !== undefined) {
    updatePayload.Descripcion_Assessment = descripcion || null;
  }

  if (activo !== undefined) {
    updatePayload.Activo_Assessment = Boolean(activo);
  }

  if (grupoEstudiantilId !== undefined) {
    if (!grupoEstudiantilId || Number.isNaN(Number(grupoEstudiantilId))) {
      return res.status(400).json({ error: 'grupoEstudiantilId inválido' });
    }
    updatePayload.ID_GrupoEstudiantil = Number(grupoEstudiantilId);
  }

  if (Object.keys(updatePayload).length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  try {
    const { data, error } = await supabase
      .from('Assessment')
      .update(updatePayload)
      .eq('ID_Assessment', Number(assessmentId))
      .select('ID_Assessment')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error actualizando assessment');
    }

    if (activo === true) {
      let targetGroupId = updatePayload.ID_GrupoEstudiantil as number | undefined;
      if (!targetGroupId) {
        const { data: current, error: currentError } = await supabase
          .from('Assessment')
          .select('ID_GrupoEstudiantil')
          .eq('ID_Assessment', Number(assessmentId))
          .single();
        if (currentError || !current) {
          throw new Error(currentError?.message || 'No se pudo resolver el grupo del assessment');
        }
        targetGroupId = current.ID_GrupoEstudiantil as number;
      }

      const { error: deactivateError } = await supabase
        .from('Assessment')
        .update({ Activo_Assessment: false })
        .eq('ID_GrupoEstudiantil', Number(targetGroupId))
        .neq('ID_Assessment', Number(assessmentId));

      if (deactivateError) {
        throw new Error(deactivateError.message);
      }
    }

    res.status(200).json({ message: 'Assessment actualizado', id: data.ID_Assessment });
  } catch (error) {
    console.error('❌ Error al actualizar assessment:', error);
    res.status(500).json({ error: 'Error al actualizar assessment' });
  }
}
