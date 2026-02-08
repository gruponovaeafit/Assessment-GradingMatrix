// scripts/check-schema-admin.mjs
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ⚠️ CLAVE IMPORTANTE

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan credenciales de Supabase en .env.local');
  console.log('Asegúrate de tener:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY (NO la publishable key)');
  process.exit(1);
}

// Usar service role para bypassear RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔍 Conectando a Supabase con Service Role Key...\n');

async function checkSchema() {
  try {
    // 1. Verificar estructura de tabla Participante
    console.log('📋 === TABLA PARTICIPANTE ===');
    const { data: participantes, error: participanteError } = await supabase
      .from('Participante')
      .select('*')
      .limit(5);

    if (participanteError) {
      console.error('❌ Error al consultar Participante:', participanteError.message);
    } else {
      console.log(`✅ Total de registros (muestra): ${participantes.length}`);
      if (participantes.length > 0) {
        console.log('\n📊 Estructura de columnas:');
        console.log(Object.keys(participantes[0]));
        console.log('\n📄 Primer registro:');
        console.log(JSON.stringify(participantes[0], null, 2));
      } else {
        console.log('⚠️  No hay participantes en la base de datos');
      }
    }

    // 2. Verificar estructura de tabla GrupoAssessment
    console.log('\n\n📋 === TABLA GRUPOASSESSMENT ===');
    const { data: grupos, error: grupoError } = await supabase
      .from('GrupoAssessment')
      .select('*')
      .limit(5);

    if (grupoError) {
      console.error('❌ Error al consultar GrupoAssessment:', grupoError.message);
    } else {
      console.log(`✅ Total de registros (muestra): ${grupos.length}`);
      if (grupos.length > 0) {
        console.log('\n📊 Estructura de columnas:');
        console.log(Object.keys(grupos[0]));
        console.log('\n📄 Primer registro:');
        console.log(JSON.stringify(grupos[0], null, 2));
      } else {
        console.log('⚠️  No hay grupos en la base de datos');
      }
    }

    // 3. Listar TODOS los assessments
    console.log('\n\n📋 === TODOS LOS ASSESSMENTS ===');
    const { data: assessments, error: aError } = await supabase
      .from('Assessment')
      .select('ID_Assessment, Nombre_Assessment, Activo_Assessment')
      .order('ID_Assessment');

    if (aError) {
      console.error('❌ Error:', aError.message);
    } else {
      console.log(`✅ Total: ${assessments.length} assessments`);
      console.table(assessments);
    }

    // 4. Buscar el participante específico del problema (ID=5)
    console.log('\n\n🔎 === BUSCANDO PARTICIPANTE ID=5 ===');
    const { data: participante5, error: p5Error } = await supabase
      .from('Participante')
      .select('*')
      .eq('ID_Participante', 5)
      .maybeSingle(); // Cambio a maybeSingle para evitar error si no existe

    if (p5Error) {
      console.error('❌ Error:', p5Error.message);
    } else if (!participante5) {
      console.log('⚠️  No existe participante con ID=5');
    } else {
      console.log('✅ Encontrado:');
      console.log(JSON.stringify(participante5, null, 2));
    }

    // 5. Verificar Assessment ID=2
    console.log('\n\n🔎 === VERIFICANDO ASSESSMENT ID=2 ===');
    const { data: assessment2, error: a2Error } = await supabase
      .from('Assessment')
      .select('*')
      .eq('ID_Assessment', 2)
      .maybeSingle();

    if (a2Error) {
      console.error('❌ Error:', a2Error.message);
    } else if (!assessment2) {
      console.log('⚠️  No existe assessment con ID=2');
    } else {
      console.log('✅ Encontrado:');
      console.log(JSON.stringify(assessment2, null, 2));
    }

    // 6. Verificar Grupo ID=5
    console.log('\n\n🔎 === VERIFICANDO GRUPO ID=5 ===');
    const { data: grupo5, error: g5Error } = await supabase
      .from('GrupoAssessment')
      .select('*')
      .eq('ID_GrupoAssessment', 5)
      .maybeSingle();

    if (g5Error) {
      console.error('❌ Error:', g5Error.message);
    } else if (!grupo5) {
      console.log('⚠️  No existe grupo con ID=5');
    } else {
      console.log('✅ Encontrado:');
      console.log(JSON.stringify(grupo5, null, 2));
      
      if (participante5 && assessment2 && grupo5.ID_Assessment !== assessment2.ID_Assessment) {
        console.warn(`⚠️  PROBLEMA: El grupo 5 pertenece al Assessment ${grupo5.ID_Assessment}, pero intentas asignarlo al participante del Assessment ${assessment2.ID_Assessment}!`);
      }
    }

    // 7. Listar participantes por assessment
    const { data: allParticipants, error: apError } = await supabase
      .from('Participante')
      .select('ID_Participante, Nombre_Participante, ID_Assessment, ID_GrupoAssessment')
      .order('ID_Assessment')
      .order('ID_Participante');

    if (!apError && allParticipants && allParticipants.length > 0) {
      console.log('\n\n📋 === TODOS LOS PARTICIPANTES (agrupados por Assessment) ===');
      const byAssessment = allParticipants.reduce((acc, p) => {
        if (!acc[p.ID_Assessment]) acc[p.ID_Assessment] = [];
        acc[p.ID_Assessment].push(p);
        return acc;
      }, {});

      for (const [assessmentId, participants] of Object.entries(byAssessment)) {
        console.log(`\n🎯 Assessment ${assessmentId}: ${participants.length} participantes`);
        console.table(participants);
      }
    }

    // 8. Listar grupos por assessment
    const { data: allGroups, error: agError } = await supabase
      .from('GrupoAssessment')
      .select('ID_GrupoAssessment, Nombre_GrupoAssessment, ID_Assessment')
      .order('ID_Assessment')
      .order('ID_GrupoAssessment');

    if (!agError && allGroups && allGroups.length > 0) {
      console.log('\n\n📋 === TODOS LOS GRUPOS (agrupados por Assessment) ===');
      const byAssessment = allGroups.reduce((acc, g) => {
        if (!acc[g.ID_Assessment]) acc[g.ID_Assessment] = [];
        acc[g.ID_Assessment].push(g);
        return acc;
      }, {});

      for (const [assessmentId, groups] of Object.entries(byAssessment)) {
        console.log(`\n🎯 Assessment ${assessmentId}: ${groups.length} grupos`);
        console.table(groups);
      }
    }

    // 9. Simulación de UPDATE
    if (participante5 && grupo5) {
      console.log('\n\n🧪 === SIMULACIÓN DE UPDATE ===');
      
      if (participante5.ID_Assessment === grupo5.ID_Assessment) {
        console.log('✅ El participante y el grupo están en el mismo Assessment');
        console.log(`Actualizar Participante ${participante5.ID_Participante} al Grupo ${grupo5.ID_GrupoAssessment} debería funcionar`);
      } else {
        console.log('❌ CONFLICTO DE FOREIGN KEY:');
        console.log(`   Participante ${participante5.ID_Participante} está en Assessment ${participante5.ID_Assessment}`);
        console.log(`   Grupo ${grupo5.ID_GrupoAssessment} está en Assessment ${grupo5.ID_Assessment}`);
        console.log('   PostgreSQL rechazará este UPDATE por violación de foreign key constraint');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
checkSchema().then(() => {
  console.log('\n\n✅ Análisis completado');
  process.exit(0);
});
