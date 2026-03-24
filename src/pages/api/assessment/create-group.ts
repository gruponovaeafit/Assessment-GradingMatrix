import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  const assessmentId = getAuthorizedAssessmentId(user, res);
  if (!assessmentId) return;

  const { nombre } = req.body ?? {};

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
  }

  const cleanName = nombre.trim();

  try {
    // 1. Verificar duplicados en el mismo assessment
    const { data: existing, error: checkError } = await supabase
      .from('GrupoAssessment')
      .select('ID_GrupoAssessment')
      .eq('ID_Assessment', assessmentId)
      .eq('Nombre_GrupoAssessment', cleanName)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un grupo con este nombre en el assessment' });
    }

    // 2. Insertar el nuevo grupo
    const { data: newGroup, error: insertError } = await supabase
      .from('GrupoAssessment')
      .insert({
        ID_Assessment: assessmentId,
        Nombre_GrupoAssessment: cleanName,
      })
      .select('ID_GrupoAssessment, Nombre_GrupoAssessment')
      .single();

    if (insertError) throw insertError;

    res.status(200).json({
      message: 'Grupo creado exitosamente',
      group: {
        id: newGroup.ID_GrupoAssessment,
        nombre: newGroup.Nombre_GrupoAssessment,
      },
    });
  } catch (error) {
    console.error('❌ Error al crear grupo manual:', error);
    res.status(500).json({ error: 'Error interno al crear el grupo' });
  }
}
