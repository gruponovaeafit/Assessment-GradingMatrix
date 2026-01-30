import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { getDefaultAssessmentId } from '@/lib/assessment';
import { requireRoles } from '@/lib/apiAuth';

// API para manejar GET y POST
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!requireRoles(req, res, ['admin'])) return;
    const assessmentId = await getDefaultAssessmentId();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('Participante')
        .select('ID_Participante, Nombre_Participante, Correo_Participante, Rol_Participante')
        .eq('ID_Assessment', assessmentId)
        .order('ID_Participante', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const payload = (data || []).map((p) => ({
        ID: p.ID_Participante,
        Participante: p.Nombre_Participante,
        Nombre: p.Nombre_Participante,
        Correo: p.Correo_Participante,
        role: p.Rol_Participante ?? '0',
      }));

      res.status(200).json(payload);
    } else if (req.method === 'POST') {
      const { nombre, correo } = req.body;

      if (!nombre || !correo) {
        return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
      }

      const { error } = await supabase
        .from('Participante')
        .insert({
          ID_Assessment: assessmentId,
          Nombre_Participante: nombre,
          Correo_Participante: correo,
          Rol_Participante: '0',
        });

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ error: 'El correo ya está registrado' });
        }
        throw new Error(error.message);
      }

      res.status(200).json({ message: 'Persona inscrita exitosamente' });
    } else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error) {
    console.error('❌ Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}
