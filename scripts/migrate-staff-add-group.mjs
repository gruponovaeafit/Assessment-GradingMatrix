// scripts/migrate-staff-add-group.mjs
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('🚀 Running Staff migration on:', supabaseUrl);

  const sql = `
    ALTER TABLE public."Staff"
    ADD COLUMN IF NOT EXISTS "ID_GrupoAssessment" integer NULL;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Staff_GrupoAssessment'
      ) THEN
        ALTER TABLE public."Staff"
        ADD CONSTRAINT "FK_Staff_GrupoAssessment"
        FOREIGN KEY ("ID_GrupoAssessment")
        REFERENCES public."GrupoAssessment"("ID_GrupoAssessment")
        ON UPDATE RESTRICT
        ON DELETE SET NULL;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "IX_Staff_GrupoAssessment"
    ON public."Staff" ("ID_GrupoAssessment");
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error executing SQL via exec_sql:', error.message);
      console.log('\nIf exec_sql is not defined, paste this SQL manually in Supabase SQL editor:\n');
      console.log(sql);
      process.exit(1);
    }

    console.log('✅ Migration executed successfully');

    const { data, error: sampleError } = await supabase
      .from('Staff')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (sampleError) {
      console.error('⚠️ Could not read Staff after migration:', sampleError.message);
    } else if (data) {
      const cols = Object.keys(data);
      console.log('📊 Columns now in Staff:', cols);
      console.log('Has ID_GrupoAssessment?', cols.includes('ID_GrupoAssessment'));
    } else {
      console.log('⚠️ Staff has no rows yet, but migration should be applied.');
    }
  } catch (err) {
    console.error('❌ Unexpected error during migration:', err);
    console.log('\n📝 If RPC is not available, run this SQL manually in Supabase:\n');
    console.log(sql);
  }
}

run();
