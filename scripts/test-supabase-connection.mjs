import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env.local'); // sube un nivel desde scripts/

dotenv.config({ path: envPath });

// DEBUG TEMPORAL
console.log('📂 Buscando .env.local en:', envPath);
const result = dotenv.config({ path: envPath });
console.log('📦 dotenv result:', result.error ?? 'OK');
console.log('🔑 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('🔑 KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

try {
  const { count, error } = await supabase
    .from('Assessment')
    .select('*', { count: 'exact', head: true });

  if (error) throw new Error(error.message);

  console.log('✅ Conexión OK. Assessments:', count ?? 0);
} catch (err) {
  console.error('❌ Error al probar conexión:', err.message || err);
  process.exit(1);
}
