import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan las variables de entorno de Supabase en .env.local');
  process.exit(1);
}

// Cliente con Service Role
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTestData() {
  console.log('🌱 Iniciando la generación de datos de prueba...');

  try {
    // 1. Obtener o crear un Grupo Estudiantil Dummy
    let { data: grupoEstudiantil } = await supabase
      .from('GrupoEstudiantil')
      .select('ID_GrupoEstudiantil')
      .limit(1)
      .single();

    if (!grupoEstudiantil) {
      console.log('Creando Grupo Estudiantil por defecto...');
      const { data, error } = await supabase
        .from('GrupoEstudiantil')
        .insert({
          Nombre_GrupoEstudiantil: 'Grupo de Prueba Global',
          Descripcion_GrupoEstudiantil: 'Creado para testing'
        })
        .select()
        .single();
      if (error) throw error;
      grupoEstudiantil = data;
    }

    const { ID_GrupoEstudiantil } = grupoEstudiantil!;

    // 2. Crear Assessment de Prueba
    console.log('Creando Assessment...');
    const { data: assessment, error: assessmentError } = await supabase
      .from('Assessment')
      .insert({
        ID_GrupoEstudiantil,
        Nombre_Assessment: `Assessment de Prueba ${Date.now()}`,
        Descripcion_Assessment: 'Assessment generado automáticamente para desarrollo local',
        Activo_Assessment: true
      })
      .select()
      .single();
    if (assessmentError) throw assessmentError;

    const { ID_Assessment } = assessment;

    // 3. Crear una Base
    console.log('Creando Base de competencia...');
    const { data: base, error: baseError } = await supabase
      .from('Bases')
      .insert({
        ID_Assessment,
        Numero_Base: 1,
        Nombre_Base: 'Liderazgo y Pruebas',
        Competencia_Base: 'Resolución de Conflictos',
        Descripcion_Base: 'Base generada para testear a los grupos',
        Comportamiento1_Base: 'Se comunica efectivamente',
        Comportamiento2_Base: 'Asume la responsabilidad',
        Comportamiento3_Base: 'Ayuda a sus compañeros'
      })
      .select()
      .single();
    if (baseError) throw baseError;

    // 4. Crear 3 Grupos Assessment
    console.log('Creando 3 Grupos de prueba...');
    const gruposPayload = [1, 2, 3].map((num) => ({
      ID_Assessment,
      Nombre_GrupoAssessment: `Equipo Testing ${num}`,
      Descripcion_GrupoAssessment: `Equipo automático de prueba ${num}`
    }));

    const { data: gruposAssessment, error: groupError } = await supabase
      .from('GrupoAssessment')
      .insert(gruposPayload)
      .select();
    if (groupError) throw groupError;

    const grupoIds = gruposAssessment.map(g => g.ID_GrupoAssessment);

    // 5. Crear Calificador y Registrador (Staff)
    console.log('Creando Calificador y Registrador (Staff)...');
    const passwordRaw = 'prueba123';
    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    const suffix = Date.now();
    const emailCalificador = `calificador_${suffix}@test.com`;
    const emailRegistrador = `registrador_${suffix}@test.com`;

    const staffPayload = [
      {
        ID_Assessment,
        Correo_Staff: emailCalificador,
        Contrasena_Staff: passwordHash,
        Rol_Staff: 'calificador',
        Active: true,
        ID_Base: base.ID_Base, 
        ID_GrupoAssessment: null
      },
      {
        ID_Assessment,
        Correo_Staff: emailRegistrador,
        Contrasena_Staff: passwordHash,
        Rol_Staff: 'registrador',
        Active: true,
        ID_Base: null, 
        ID_GrupoAssessment: null
      }
    ];

    const { error: staffError } = await supabase
      .from('Staff')
      .insert(staffPayload);
    if (staffError) throw staffError;

    // 6. Crear 9 Participantes (3 por grupo)
    console.log('Añadiendo 9 Participantes (3 por cada equipo)...');
    
    const participantesPayload = [];
    let participantCount = 1;

    for (const grupoId of grupoIds) {
      for (let i = 0; i < 3; i++) {
        participantesPayload.push({
          ID_Assessment,
          ID_GrupoAssessment: grupoId,
          Nombre_Participante: `Estudiante de Prueba ${participantCount}`,
          Correo_Participante: `estudiante_test${participantCount}@dummy.com`,
          Rol_Participante: 'Estudiante',
          FotoUrl_Participante: '' 
        });
        participantCount++;
      }
    }

    const { error: partError } = await supabase
      .from('Participante')
      .insert(participantesPayload);
    if (partError) throw partError;

    console.log('\n✅ ¡Datos creados exitosamente! Ya puedes probar tu aplicación.');
    console.log('=========================================');
    console.log('🔑 Credenciales del Calificador:');
    console.log(`   Email:    ${emailCalificador}`);
    console.log(`   Password: ${passwordRaw}`);
    console.log('-----------------------------------------');
    console.log('🔑 Credenciales del Registrador:');
    console.log(`   Email:    ${emailRegistrador}`);
    console.log(`   Password: ${passwordRaw}`);
    console.log('=========================================');
    console.log(`📌 Assessment ID: ${ID_Assessment}`);
    console.log(`📌 Grupos Generados: 3 (con 3 integrantes c/u)`);
    console.log('=========================================');

  } catch (error: any) {
    console.error('❌ Ocurrió un error al seedear la base de datos:', error.message);
  } finally {
    process.exit(0);
  }
}

seedTestData();
