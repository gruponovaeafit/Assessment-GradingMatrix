import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';
import { getAuthorizedAssessmentId } from '@/lib/assessment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await requireRoles(req, res, ['admin']);
  if (!user) return;

  const authorizedAssessmentId = getAuthorizedAssessmentId(user, res);
  if (!authorizedAssessmentId) return;

  try {
    const { data, error } = await supabase
      .from('Staff')
      .select('ID_Staff, Correo_Staff, Rol_Staff, ID_Base, ID_GrupoAssessment, Active')
      .eq('ID_Assessment', authorizedAssessmentId)
      .order('ID_Staff', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const payload = data?.map((row) => ({
      ID: row.ID_Staff,
      Correo: row.Correo_Staff,
      role: row.Rol_Staff,
      Active: row.Active,
      // For compatibility with the existing grid that expects some fields:
      Participante: row.Correo_Staff.split('@')[0], // Fallback name
      Grupo: 'N/A',
      Calificacion_Promedio: null,
      Estado: row.Active ? 'Activo' : 'Inactivo'
    })) ?? [];

    res.status(200).json(payload);
  } catch (error) {
    console.error('❌ Error al listar staff:', error);
    res.status(500).json({ error: 'Error al listar staff' });
  }
}
