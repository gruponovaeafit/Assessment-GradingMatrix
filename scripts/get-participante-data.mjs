import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Necesitamos NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔍 Consultando registros de la tabla Participante...');
  const { data, error } = await supabase
    .from('Participante')
    .select('*')
    .limit(5)
    .order('"ID_Participante"');

  if (error) {
    console.error('❌ No se pudo leer la metadata:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ No hay registros de Participante para mostrar.');
    return;
  }

  const columnas = Object.keys(data[0]);
  console.log('📋 Columnas detectadas:', columnas.join(', '));
  console.table(data);
}

main();
