import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';
import { hashPassword } from '@/lib/auth';
import { requireRoles } from '@/lib/apiAuth';

const shortHash = (input: string) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash).toString(36).slice(0, 6);
};

const buildAdminEmail = (assessmentName: string, assessmentId: number, groupName: string) => {
  const domain = groupName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  const hash = shortHash(assessmentName || String(assessmentId));
  return `${hash}_${assessmentId}@${domain || 'grupo'}.agm`;
};

const generatePassword = (length = 16) => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%';
  const all = `${upper}${lower}${numbers}${symbols}`;
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  const values = new Uint32Array(Math.max(length, required.length));
  globalThis.crypto.getRandomValues(values);
  const rest = Array.from(values, (val) => all[val % all.length]).slice(0, length - required.length);
  const merged = [...required, ...rest];
  for (let i = merged.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [merged[i], merged[j]] = [merged[j], merged[i]];
  }
  return merged.join('');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!requireRoles(req, res, ['admin'])) return;

  const { assessmentIds } = req.body ?? {};
  const targetIds =
    Array.isArray(assessmentIds) && assessmentIds.length > 0
      ? assessmentIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
      : null;

  try {
    const { data: assessments, error: assessmentsError } = await supabase
      .from('Assessment')
      .select('ID_Assessment, Nombre_Assessment, Activo_Assessment, GrupoEstudiantil:GrupoEstudiantil(Nombre_GrupoEstudiantil)')
      .eq('Activo_Assessment', true);

    if (assessmentsError) throw new Error(assessmentsError.message);

    const activeAssessments = (assessments ?? []).map((row) => {
      const grupo =
        Array.isArray(row.GrupoEstudiantil) && row.GrupoEstudiantil.length > 0
          ? row.GrupoEstudiantil[0]
          : null;
      return {
        id: row.ID_Assessment as number,
        nombre: row.Nombre_Assessment as string,
        grupoNombre: grupo?.Nombre_GrupoEstudiantil ?? 'Grupo',
      };
    });

    if (targetIds && targetIds.length > 0) {
      const filtered = activeAssessments.filter((item) => targetIds.includes(item.id));
      return await handlerWithAssessments(filtered, res);
    }

    return await handlerWithAssessments(activeAssessments, res);
  } catch (error) {
    console.error('❌ Error en bulk create admins:', error);
    res.status(500).json({ error: 'Error al crear admins masivos' });
  }
}

async function handlerWithAssessments(
  activeAssessments: { id: number; nombre: string; grupoNombre: string }[],
  res: NextApiResponse
) {
  if (activeAssessments.length === 0) {
    return res.status(200).json({ created: [], skipped: [] });
  }

  const assessmentIds = activeAssessments.map((item) => item.id);

  const { data: existingAdmins, error: existingError } = await supabase
    .from('Staff')
    .select('ID_Staff, Correo_Staff, ID_Assessment')
    .eq('Rol_Staff', 'admin')
    .in('ID_Assessment', assessmentIds);

  if (existingError) throw new Error(existingError.message);

  const existingByAssessment = new Set(
    (existingAdmins ?? []).map((row) => Number(row.ID_Assessment))
  );
  const existingEmails = new Set(
    (existingAdmins ?? []).map((row) => String(row.Correo_Staff).toLowerCase())
  );

  const toCreate = activeAssessments
    .map((item) => {
      const correo = buildAdminEmail(item.nombre, item.id, item.grupoNombre);
      return { ...item, correo };
    })
    .filter((item) => !existingByAssessment.has(item.id) && !existingEmails.has(item.correo.toLowerCase()));

  const skipped = activeAssessments.filter(
    (item) => existingByAssessment.has(item.id) || existingEmails.has(buildAdminEmail(item.nombre, item.id, item.grupoNombre).toLowerCase())
  );

  if (toCreate.length === 0) {
    return res.status(200).json({ created: [], skipped });
  }

  const generated = toCreate.map((item) => ({
    ...item,
    password: generatePassword(),
  }));

  const hashed = await Promise.all(
    generated.map(async (item) => ({
      ...item,
      hashedPassword: await hashPassword(item.password),
    }))
  );

  const { data: created, error: createError } = await supabase
    .from('Staff')
    .insert(
      hashed.map((item) => ({
        ID_Assessment: item.id,
        Correo_Staff: item.correo,
        Contrasena_Staff: item.hashedPassword,
        Rol_Staff: 'admin',
      }))
    )
    .select('ID_Staff, ID_Assessment, Correo_Staff');

  if (createError) throw new Error(createError.message);

  const createdPayload =
    created?.map((row) => {
      const match = generated.find((item) => item.correo === row.Correo_Staff);
      return {
        id: row.ID_Staff,
        correo: row.Correo_Staff,
        assessmentId: row.ID_Assessment,
        assessmentNombre: match?.nombre ?? null,
        grupoNombre: match?.grupoNombre ?? null,
        password: match?.password ?? null,
      };
    }) ?? [];

  return res.status(200).json({ created: createdPayload, skipped });
}
