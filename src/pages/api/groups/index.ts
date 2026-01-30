import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { getDefaultAssessmentId } from '@/lib/assessment';
import { requireRoles } from '@/lib/apiAuth';

// API para subir la distribución de los grupos
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { groups } = req.body;

  if (!groups || !Array.isArray(groups)) {
    return res.status(400).json({ error: 'Datos de grupos inválidos' });
  }

  try {
    const assessmentId = await getDefaultAssessmentId();
    const groupNames = groups.map((_: unknown, index: number) => `Grupo${index + 1}`);

    const { data: existingGroups, error: existingError } = await supabase
      .from('GrupoAssessment')
      .select('ID_GrupoAssessment, Nombre_GrupoAssessment')
      .eq('ID_Assessment', assessmentId)
      .in('Nombre_GrupoAssessment', groupNames);

    if (existingError) {
      throw new Error(existingError.message);
    }

    const groupMap = new Map<string, number>();

    for (const group of existingGroups || []) {
      groupMap.set(group.Nombre_GrupoAssessment, group.ID_GrupoAssessment);
    }

    const missingGroupNames = groupNames.filter((name) => !groupMap.has(name));

    if (missingGroupNames.length > 0) {
      const { data: insertedGroups, error: insertError } = await supabase
        .from('GrupoAssessment')
        .insert(
          missingGroupNames.map((name) => ({
            ID_Assessment: assessmentId,
            Nombre_GrupoAssessment: name,
          }))
        )
        .select('ID_GrupoAssessment, Nombre_GrupoAssessment');

      if (insertError) {
        throw new Error(insertError.message);
      }

      for (const group of insertedGroups || []) {
        groupMap.set(group.Nombre_GrupoAssessment, group.ID_GrupoAssessment);
      }
    }

    const { error: clearError } = await supabase
      .from('Participante')
      .update({ ID_GrupoAssessment: null })
      .eq('ID_Assessment', assessmentId);

    if (clearError) {
      throw new Error(clearError.message);
    }

    for (let i = 0; i < groups.length; i++) {
      const groupName = groupNames[i];
      const groupId = groupMap.get(groupName);
      const members = groups[i] as Array<{ ID?: number }>;

      if (!groupId) {
        console.error(`❌ El grupo ${groupName} no existe en la base de datos.`);
        continue;
      }

      const memberIds = members
        .map((member) => member.ID)
        .filter((id): id is number => typeof id === 'number');

      if (memberIds.length === 0) {
        continue;
      }

      const { error: updateError } = await supabase
        .from('Participante')
        .update({ ID_GrupoAssessment: groupId })
        .in('ID_Participante', memberIds)
        .eq('ID_Assessment', assessmentId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    res.status(200).json({ message: 'Grupos subidos exitosamente' });
  } catch (error) {
    console.error('❌ Error al subir los grupos:', error);
    res.status(500).json({ error: 'Error al subir los grupos a la base de datos' });
  }
}
