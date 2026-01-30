import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

const shuffle = <T,>(arr: T[]) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickGroupIndex = (groups: number[][]) => {
  let minSize = Infinity;
  for (const group of groups) {
    if (group.length < minSize) minSize = group.length;
  }

  const candidates: number[] = [];
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i].length === minSize) {
      candidates.push(i);
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { assessmentId, numGroups } = req.body ?? {};
  const assessmentIdNum = Number(assessmentId);
  const groupCount = Number(numGroups);

  if (!assessmentId || Number.isNaN(assessmentIdNum)) {
    return res.status(400).json({ error: 'assessmentId es obligatorio' });
  }

  if (!numGroups || Number.isNaN(groupCount) || groupCount <= 0) {
    return res.status(400).json({ error: 'numGroups debe ser un número válido' });
  }

  try {
    const { data: participantes, error: participantesError } = await supabase
      .from('Participante')
      .select('ID_Participante, Rol_Participante')
      .eq('ID_Assessment', assessmentIdNum)
      .order('ID_Participante', { ascending: true });

    if (participantesError) {
      throw new Error(participantesError.message);
    }

    const allParticipants = participantes || [];

    if (allParticipants.length === 0) {
      return res.status(400).json({ error: 'No hay participantes para sortear' });
    }

    const impostores = shuffle(
      allParticipants.filter((p) => Number(p.Rol_Participante) === 1)
    );
    const restantes = shuffle(
      allParticipants.filter((p) => Number(p.Rol_Participante) !== 1)
    );

    const groups: number[][] = Array.from({ length: groupCount }, () => []);

    const initialImpostores = Math.min(groupCount, impostores.length);
    for (let i = 0; i < initialImpostores; i += 1) {
      groups[i].push(impostores[i].ID_Participante as number);
    }

    const remainingParticipants = shuffle([
      ...impostores.slice(initialImpostores),
      ...restantes,
    ]);

    for (const participant of remainingParticipants) {
      const groupIndex = pickGroupIndex(groups);
      groups[groupIndex].push(participant.ID_Participante as number);
    }

    const groupNames = Array.from({ length: groupCount }, (_, index) => `Grupo${index + 1}`);

    const { data: existingGroups, error: existingError } = await supabase
      .from('GrupoAssessment')
      .select('ID_GrupoAssessment, Nombre_GrupoAssessment')
      .eq('ID_Assessment', assessmentIdNum)
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
            ID_Assessment: assessmentIdNum,
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
      .eq('ID_Assessment', assessmentIdNum);

    if (clearError) {
      throw new Error(clearError.message);
    }

    for (let i = 0; i < groups.length; i += 1) {
      const groupName = groupNames[i];
      const groupId = groupMap.get(groupName);
      const memberIds = groups[i];

      if (!groupId || memberIds.length === 0) {
        continue;
      }

      const { error: updateError } = await supabase
        .from('Participante')
        .update({ ID_GrupoAssessment: groupId })
        .in('ID_Participante', memberIds)
        .eq('ID_Assessment', assessmentIdNum);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    res.status(200).json({
      message: 'Grupos creados y sorteados correctamente',
      totalParticipantes: allParticipants.length,
      totalGrupos: groupCount,
      totalImpostores: impostores.length,
    });
  } catch (error) {
    console.error('❌ Error al sortear grupos:', error);
    res.status(500).json({ error: 'Error al sortear grupos' });
  }
}
