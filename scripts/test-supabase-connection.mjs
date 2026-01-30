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

try {
  const { count, error } = await supabase
    .from('Assessment')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(error.message);
  }

  console.log('✅ Conexión OK. Assessments:', count ?? 0);
} catch (err) {
  console.error('❌ Error al probar conexión:', err.message || err);
  process.exit(1);
}
