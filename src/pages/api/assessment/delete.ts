import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireRoles(req, res, ['admin']);
  if (!user) return;
  if (user.id !== 0) {
    return res.status(403).json({ error: 'Solo el super-admin puede eliminar assessments' });
  }

  const { id, password } = req.body;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({ error: 'ID de Assessment inválido' });
  }

  // Security Check: Password required from .env.local
  const deleteSecret = process.env.ADMIN_DELETE_PASSWORD;
  if (!deleteSecret) {
     console.error('[API:delete] ❌ ADMIN_DELETE_PASSWORD no está definida en .env.local');
     return res.status(500).json({ error: 'Configuración de seguridad incompleta en el servidor' });
  }

  if (password !== deleteSecret) {
    return res.status(401).json({ error: 'Contraseña de borrado incorrecta' });
  }

  const assessmentId = Number(id);

  try {
    // 1. Calificaciones (references Staff, Bases, Participante, Assessment)
    const { error: e1 } = await supabase
      .from('CalificacionesPorPersona')
      .delete()
      .eq('ID_Assessment', assessmentId);
    if (e1) throw new Error(`Error borrando calificaciones: ${e1.message}`);

    // 2. Participantes
    const { error: e2 } = await supabase
      .from('Participante')
      .delete()
      .eq('ID_Assessment', assessmentId);
    if (e2) throw new Error(`Error borrando participantes: ${e2.message}`);

    // 3. Staff (calificadores y admin)
    const { error: e3 } = await supabase
      .from('Staff')
      .delete()
      .eq('ID_Assessment', assessmentId);
    if (e3) throw new Error(`Error borrando staff: ${e3.message}`);

    // 4. Bases
    const { error: e4 } = await supabase
      .from('Bases')
      .delete()
      .eq('ID_Assessment', assessmentId);
    if (e4) throw new Error(`Error borrando bases: ${e4.message}`);

    // 5. GrupoAssessment (subgrupos del assessment)
    const { error: e5 } = await supabase
      .from('GrupoAssessment')
      .delete()
      .eq('ID_Assessment', assessmentId);
    if (e5) throw new Error(`Error borrando grupos del assessment: ${e5.message}`);

    // 6. Assessment (ahora sin dependencias)
    const { error: e6 } = await supabase
      .from('Assessment')
      .delete()
      .eq('ID_Assessment', assessmentId);
    if (e6) throw new Error(`Error borrando assessment: ${e6.message}`);

    res.status(200).json({ message: 'Assessment y todos sus datos eliminados con éxito' });
  } catch (error: any) {
    console.error('[API:assessment/delete] ❌', error.message);
    res.status(500).json({ error: error.message || 'Error al eliminar assessment' });
  }
}
