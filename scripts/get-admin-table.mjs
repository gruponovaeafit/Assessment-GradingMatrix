import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son necesarios en .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔍 Obteniendo usuarios con rol admin desde Staff...');
  const { data, error } = await supabase
    .from('Staff')
    .select('*, Assessment:Assessment(Nombre_Assessment)')
    .eq('Rol_Staff', 'admin')
    .order('"ID_Staff"')
    .limit(10);

  if (error) {
    console.error('❌ No se pudieron obtener los admins:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ No hay registros de admin en Staff.');
    return;
  }

  const columnas = Object.keys(data[0]);
  console.log('📋 Columnas detectadas en Staff (solo registros admin):', columnas.join(', '));
  console.table(data);
}

main();
