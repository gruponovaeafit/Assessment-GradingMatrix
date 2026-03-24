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

  const assessmentId = getAuthorizedAssessmentId(user, res);
  if (!assessmentId) return;

  try {
    const { data, error } = await supabase
      .from('Participante')
      .select('ID_Participante, Nombre_Participante, Correo_Participante, ID_GrupoAssessment, Rol_Participante')
      .eq('ID_Assessment', assessmentId)
      .order('ID_Participante', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json(
      (data || []).map((item) => ({
        id: item.ID_Participante,
        nombre: item.Nombre_Participante,
        correo: item.Correo_Participante,
        grupoId: item.ID_GrupoAssessment,
        isImpostor: item.Rol_Participante === "1" || item.Rol_Participante === "Impostor",
      }))
    );
  } catch (error) {
    console.error('❌ Error al listar participantes:', error);
    res.status(500).json({ error: 'Error al listar participantes' });
  }
}
