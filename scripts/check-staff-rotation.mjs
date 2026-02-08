// scripts/check-staff-rotation.mjs
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan credenciales');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkStaffRotation() {
  console.log('🔍 === VERIFICANDO STAFF ID 30 ===\n');

  // 1. Buscar Staff 30
  const { data: staff30, error: staffError } = await supabase
    .from('Staff')
    .select('*')
    .eq('ID_Staff', 30)
    .maybeSingle();

  if (staffError) {
    console.error('❌ Error consultando Staff:', staffError.message);
    return;
  }

  if (!staff30) {
    console.log('⚠️  No existe Staff con ID=30');
    console.log('\n📋 Listando todos los Staff (calificadores):');
    
    const { data: allStaff } = await supabase
      .from('Staff')
      .select('ID_Staff, Correo_Staff, Rol_Staff, ID_Assessment, ID_GrupoAssessment, Rotaciones_Staff')
      .eq('Rol_Staff', 'calificador')
      .order('ID_Staff');
    
    if (allStaff && allStaff.length > 0) {
      console.table(allStaff);
    } else {
      console.log('No hay calificadores registrados');
    }
    return;
  }

  console.log('✅ Staff encontrado:');
  console.log(JSON.stringify(staff30, null, 2));

  // 2. Verificar el grupo 4
  console.log('\n\n🔍 === VERIFICANDO GRUPO ID 4 ===\n');
  const { data: grupo4, error: grupoError } = await supabase
    .from('GrupoAssessment')
    .select('*')
    .eq('ID_GrupoAssessment', 4)
    .maybeSingle();

  if (grupoError) {
    console.error('❌ Error consultando Grupo:', grupoError.message);
    return;
  }

  if (!grupo4) {
    console.log('⚠️  No existe Grupo con ID=4');
    return;
  }

  console.log('✅ Grupo encontrado:');
  console.log(JSON.stringify(grupo4, null, 2));

  // 3. Validar compatibilidad
  console.log('\n\n🧪 === VALIDACIÓN DE COMPATIBILIDAD ===\n');
  
  if (staff30.ID_Assessment === grupo4.ID_Assessment) {
    console.log('✅ El Staff y el Grupo pertenecen al mismo Assessment');
    console.log(`   Assessment ID: ${staff30.ID_Assessment}`);
    console.log('\n✅ La actualización DEBERÍA funcionar');
  } else {
    console.log('❌ PROBLEMA DE FOREIGN KEY:');
    console.log(`   Staff 30 está en Assessment ${staff30.ID_Assessment}`);
    console.log(`   Grupo 4 está en Assessment ${grupo4.ID_Assessment}`);
    console.log('\n❌ PostgreSQL rechazará esta actualización');
  }

  // 4. Listar grupos del mismo assessment que el staff
  console.log(`\n\n📋 === GRUPOS DISPONIBLES PARA ASSESSMENT ${staff30.ID_Assessment} ===\n`);
  const { data: gruposDisponibles } = await supabase
    .from('GrupoAssessment')
    .select('ID_GrupoAssessment, Nombre_GrupoAssessment, ID_Assessment')
    .eq('ID_Assessment', staff30.ID_Assessment)
    .order('ID_GrupoAssessment');

  if (gruposDisponibles && gruposDisponibles.length > 0) {
    console.table(gruposDisponibles);
  } else {
    console.log('⚠️  No hay grupos en este Assessment');
  }

  // 5. Intentar el UPDATE (simulación)
  console.log('\n\n🧪 === SIMULANDO UPDATE ===\n');
  console.log('Payload enviado:');
  console.log(JSON.stringify({
    staffId: 30,
    grupoAssessmentId: 4,
    rotaciones: 0
  }, null, 2));

  try {
    const { data: result, error: updateError } = await supabase
      .from('Staff')
      .update({
        ID_GrupoAssessment: 4,
        Rotaciones_Staff: 0
      })
      .eq('ID_Staff', 30)
      .select('*')
      .single();

    if (updateError) {
      console.log('\n❌ Error en UPDATE:');
      console.log('Código:', updateError.code);
      console.log('Mensaje:', updateError.message);
      console.log('Detalles:', updateError.details);
      console.log('Hint:', updateError.hint);
    } else {
      console.log('\n✅ UPDATE exitoso:');
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err) {
    console.error('❌ Excepción:', err);
  }
}

checkStaffRotation().then(() => {
  console.log('\n✅ Diagnóstico completado');
  process.exit(0);
});
