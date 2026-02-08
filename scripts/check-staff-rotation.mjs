// scripts/check-staff-columns.mjs
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('URL:', supabaseUrl);
  console.log('--- Checking Staff columns ---');

  const { data, error } = await supabase
    .from('Staff')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('❌ Error reading Staff:', error.message);
    return;
  }

  if (!data) {
    console.log('⚠️ No rows in Staff, but table exists. Columns:');
    const { data: cols, error: colsError } = await supabase
      .from('Staff')
      .select('*')
      .limit(0);
    if (colsError) {
      console.error('Error introspecting Staff:', colsError.message);
    } else {
      console.log(Object.keys(cols));
    }
    return;
  }

  const cols = Object.keys(data);
  console.log('Columns in Staff:', cols);

  console.log('\nHas ID_GrupoAssessment?', cols.includes('ID_GrupoAssessment'));
  console.log('Has Rotaciones_Staff?', cols.includes('Rotaciones_Staff'));

  console.log('\nSample row:');
  console.log(JSON.stringify(data, null, 2));
}

run();
