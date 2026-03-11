/**
 * Schema Introspection Script
 *
 * Queries every table known from schema.sql using the Supabase service-role
 * client (bypasses RLS). For each table it:
 *   1. Fetches a sample row to discover column names.
 *   2. Prints column names and inferred JS types.
 *   3. Counts total rows.
 *
 * Usage:
 *   npx tsx scripts/introspect-schema.ts
 *
 * Requirements:
 *   - .env.local must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local (Next.js convention)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables from schema.sql — ordered by dependency level
const TABLES = [
  'GrupoEstudiantil',
  'Assessment',
  'GrupoAssessment',
  'Bases',
  'Staff',
  'Participante',
  'CalificacionesPorPersona',
] as const;

interface ColumnInfo {
  name: string;
  jsType: string;
  sampleValue: unknown;
}

function inferJsType(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    // Try to detect dates
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'timestamptz';
    return 'string';
  }
  if (typeof value === 'object') return 'json';
  return typeof value;
}

async function introspectTable(tableName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 Table: ${tableName}`);
  console.log('='.repeat(60));

  // 1. Count rows
  const { count, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`  ❌ Count error: ${countError.message}`);
  } else {
    console.log(`  📊 Total rows: ${count}`);
  }

  // 2. Fetch a sample row to discover columns
  const { data: sampleRows, error: sampleError } = await supabase
    .from(tableName)
    .select('*')
    .limit(3);

  if (sampleError) {
    console.error(`  ❌ Sample query error: ${sampleError.message}`);
    return;
  }

  if (!sampleRows || sampleRows.length === 0) {
    console.log('  ⚠️  Table is empty — cannot infer columns from data.');
    console.log('      Check schema.sql for the expected structure.');
    return;
  }

  // Build column info from all sample rows (covers nulls in first row)
  const columnMap = new Map<string, ColumnInfo>();
  for (const row of sampleRows) {
    for (const [key, value] of Object.entries(row)) {
      const existing = columnMap.get(key);
      if (!existing || existing.jsType === 'null') {
        columnMap.set(key, {
          name: key,
          jsType: inferJsType(value),
          sampleValue: value,
        });
      }
    }
  }

  const columns = Array.from(columnMap.values());

  // 3. Print column details
  console.log(`  📝 Columns (${columns.length}):`);
  console.log('  ' + '-'.repeat(56));
  console.log(`  ${'Column'.padEnd(30)} ${'Type'.padEnd(14)} Sample`);
  console.log('  ' + '-'.repeat(56));

  for (const col of columns) {
    const sample = col.sampleValue === null
      ? 'NULL'
      : typeof col.sampleValue === 'string' && col.sampleValue.length > 30
        ? `"${col.sampleValue.substring(0, 27)}..."`
        : JSON.stringify(col.sampleValue);
    console.log(`  ${col.name.padEnd(30)} ${col.jsType.padEnd(14)} ${sample}`);
  }
}

async function main() {
  console.log('🔍 Schema Introspection Script');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Tables to inspect: ${TABLES.length}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);

  for (const table of TABLES) {
    await introspectTable(table);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Introspection complete.');
  console.log('   Compare the output above with src/db/schema.sql');
  console.log('   to find mismatches (missing columns, type differences, etc.).');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
