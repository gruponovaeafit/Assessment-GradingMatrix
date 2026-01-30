import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const envPath = path.join(process.cwd(), '.env.local');
loadEnv(envPath);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function insertSingle(table, payload, select) {
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select(select)
    .single();

  if (error || !data) {
    throw new Error(error?.message || `Error insertando en ${table}`);
  }

  return data;
}

try {
  const suffix = Date.now().toString().slice(-6);
  const groupName = `Grupo Demo ${suffix}`;
  const assessmentName = `Assessment Demo ${suffix}`;

  const grupo = await insertSingle(
    'GrupoEstudiantil',
    {
      Nombre_GrupoEstudiantil: groupName,
      Descripcion_GrupoEstudiantil: 'Grupo de prueba generado por script',
    },
    'ID_GrupoEstudiantil'
  );

  const assessment = await insertSingle(
    'Assessment',
    {
      ID_GrupoEstudiantil: grupo.ID_GrupoEstudiantil,
      Nombre_Assessment: assessmentName,
      Descripcion_Assessment: 'Assessment de prueba',
      Activo_Assessment: true,
    },
    'ID_Assessment'
  );

  const grupoAssessment = await insertSingle(
    'GrupoAssessment',
    {
      ID_Assessment: assessment.ID_Assessment,
      Nombre_GrupoAssessment: `Grupo 1 Demo ${suffix}`,
      Descripcion_GrupoAssessment: 'Grupo demo',
    },
    'ID_GrupoAssessment'
  );

  const base = await insertSingle(
    'Bases',
    {
      ID_Assessment: assessment.ID_Assessment,
      Numero_Base: 1,
      Nombre_Base: 'Base Demo',
      Competencia_Base: 'Competencia Demo',
      Descripcion_Base: 'Descripción demo de la base',
      Comportamiento1_Base: 'Comportamiento demo 1',
      Comportamiento2_Base: 'Comportamiento demo 2',
      Comportamiento3_Base: 'Comportamiento demo 3',
    },
    'ID_Base'
  );

  const staffAdmin = await insertSingle(
    'Staff',
    {
      ID_Assessment: assessment.ID_Assessment,
      Correo_Staff: `admin_${suffix}@demo.com`,
      Contrasena_Staff: 'admin123',
      Rol_Staff: 'admin',
      ID_Base: null,
    },
    'ID_Staff'
  );

  const staffRegistrador = await insertSingle(
    'Staff',
    {
      ID_Assessment: assessment.ID_Assessment,
      Correo_Staff: `registrador_${suffix}@demo.com`,
      Contrasena_Staff: 'registro123',
      Rol_Staff: 'registrador',
      ID_Base: null,
    },
    'ID_Staff'
  );

  const staffCalificador = await insertSingle(
    'Staff',
    {
      ID_Assessment: assessment.ID_Assessment,
      Correo_Staff: `calificador_${suffix}@demo.com`,
      Contrasena_Staff: 'califica123',
      Rol_Staff: 'calificador',
      ID_Base: base.ID_Base,
    },
    'ID_Staff'
  );

  const participante1 = await insertSingle(
    'Participante',
    {
      ID_Assessment: assessment.ID_Assessment,
      ID_GrupoAssessment: grupoAssessment.ID_GrupoAssessment,
      Nombre_Participante: 'Participante Demo 1',
      Correo_Participante: `demo1_${suffix}@mail.com`,
      Rol_Participante: '0',
      FotoUrl_Participante: null,
    },
    'ID_Participante'
  );

  const participante2 = await insertSingle(
    'Participante',
    {
      ID_Assessment: assessment.ID_Assessment,
      ID_GrupoAssessment: grupoAssessment.ID_GrupoAssessment,
      Nombre_Participante: 'Participante Demo 2',
      Correo_Participante: `demo2_${suffix}@mail.com`,
      Rol_Participante: '1',
      FotoUrl_Participante: null,
    },
    'ID_Participante'
  );

  await supabase.from('CalificacionesPorPersona').insert({
    ID_Assessment: assessment.ID_Assessment,
    ID_Base: base.ID_Base,
    ID_Staff: staffCalificador.ID_Staff,
    ID_Participante: participante1.ID_Participante,
    Calificacion_1: 4.5,
    Calificacion_2: 4.0,
    Calificacion_3: 4.2,
  });

  console.log('✅ Seed completado');
  console.log({
    grupoEstudiantilId: grupo.ID_GrupoEstudiantil,
    assessmentId: assessment.ID_Assessment,
    grupoAssessmentId: grupoAssessment.ID_GrupoAssessment,
    baseId: base.ID_Base,
    staffAdminId: staffAdmin.ID_Staff,
    staffRegistradorId: staffRegistrador.ID_Staff,
    staffCalificadorId: staffCalificador.ID_Staff,
    participante1Id: participante1.ID_Participante,
    participante2Id: participante2.ID_Participante,
  });
} catch (err) {
  console.error('❌ Error en seed:', err.message || err);
  process.exit(1);
}
