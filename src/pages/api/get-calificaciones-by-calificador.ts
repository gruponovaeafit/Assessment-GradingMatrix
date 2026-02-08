// src/pages/api/get-calificaciones-by-calificador.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { requireRoles } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar autenticación
  if (!requireRoles(req, res, ['admin', 'calificador'])) return;

  try {
    const { idCalificador, idBase } = req.body;

    // Validar parámetros
    if (!idCalificador || !idBase) {
      console.error('❌ Faltan parámetros:', { idCalificador, idBase });
      return res.status(400).json({ error: 'idCalificador e idBase son obligatorios' });
    }

    const calificadorId = Number(idCalificador);
    const baseId = Number(idBase);

    if (Number.isNaN(calificadorId) || Number.isNaN(baseId)) {
      console.error('❌ Parámetros inválidos:', { idCalificador, idBase });
      return res.status(400).json({ error: 'Los parámetros deben ser números válidos' });
    }

    // Obtener el assessment del calificador
    const { data: staff, error: staffError } = await supabase
      .from('Staff')
      .select('ID_Assessment')
      .eq('ID_Staff', calificadorId)
      .single();

    if (staffError) {
      console.error('❌ Error al buscar Staff:', staffError);
      return res.status(404).json({ error: 'No se encontró el calificador', details: staffError.message });
    }

    if (!staff) {
      console.error('❌ Staff no encontrado para ID:', calificadorId);
      return res.status(404).json({ error: 'No se encontró el calificador' });
    }

    const assessmentId = staff.ID_Assessment;

    // Obtener todas las calificaciones de este calificador para esta base
    const { data: calificaciones, error: gradesError } = await supabase
      .from('CalificacionesPorPersona')
      .select('ID_Participante, Calificacion_1, Calificacion_2, Calificacion_3')
      .eq('ID_Assessment', assessmentId)
      .eq('ID_Base', baseId)
      .eq('ID_Staff', calificadorId);

    if (gradesError) {
      console.error('❌ Error al obtener calificaciones:', gradesError);
      return res.status(500).json({ 
        error: 'Error al obtener calificaciones', 
        details: gradesError.message 
      });
    }

    console.log('✅ Calificaciones encontradas:', calificaciones?.length || 0);
    
    return res.status(200).json({ 
      calificaciones: calificaciones || [],
      count: calificaciones?.length || 0
    });

  } catch (error) {
    console.error('❌ Error inesperado en get-calificaciones-by-calificador:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: (error as Error).message,
    });
  }
}
