import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = 'public';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno necesarias para conectarse a Supabase.');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exitCode = 1;
  throw new Error('Variables de entorno incompletas');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function formatColumnType(column) {
  const baseType = column.data_type ?? 'unknown';
  if (column.character_maximum_length) {
    return `${baseType}(${column.character_maximum_length})`;
  }

  if (column.numeric_precision) {
    const scale = column.numeric_scale ?? 0;
    return `${baseType}(${column.numeric_precision},${scale})`;
  }

  return baseType;
}

function formatDefaultValue(value) {
  if (!value) return '-';
  return value.replace(/\s+/g, ' ').trim();
}

async function fetchTables() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_schema, table_name, table_type')
    .eq('table_schema', schema)
    .eq('table_type', 'BASE TABLE')
    .order('table_name', { ascending: true });

  if (error) {
    throw new Error(`Falló la consulta de tablas: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No se encontraron tablas en el esquema ${schema}`);
  }

  return data;
}

async function fetchColumns(tableName) {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select(
      'column_name, data_type, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale'
    )
    .eq('table_schema', schema)
    .eq('table_name', tableName)
    .order('ordinal_position', { ascending: true });

  if (error) {
    throw new Error(`Falló la consulta de columnas para ${tableName}: ${error.message}`);
  }

  return data ?? [];
}

async function buildMarkdown() {
  const tables = await fetchTables();
  const sections = [
    '# Esquema de base de datos',
    '',
    `*Generado el ${new Date().toLocaleString('es-CO')} usando Supabase Service Role Key y el esquema '${schema}'.*`,
    '',
  ];

  for (const table of tables) {
    sections.push(`## Tabla: ${table.table_name}`);
    sections.push('');
    const columns = await fetchColumns(table.table_name);
    if (columns.length === 0) {
      sections.push('_No se encontraron columnas para esta tabla._', '');
      continue;
    }

    sections.push('| Columna | Tipo | Nulo | Default |');
    sections.push('| --- | --- | --- | --- |');

    for (const column of columns) {
      const type = formatColumnType(column);
      const isNullable = column.is_nullable === 'YES' ? 'sí' : 'no';
      const defaultValue = formatDefaultValue(column.column_default);
      sections.push(`| ${column.column_name} | ${type} | ${isNullable} | ${defaultValue} |`);
    }

    sections.push('');
  }

  return sections.join('\n');
}

async function writeOutput(content) {
  const docsDir = path.join(process.cwd(), 'docs');
  const outputPath = path.join(docsDir, 'db-schema.md');
  await mkdir(docsDir, { recursive: true });
  await writeFile(outputPath, content, { encoding: 'utf-8' });
  return outputPath;
}

async function main() {
  try {
    console.log('🔍 Recolectando metadata de la base de datos...');
    const markdown = await buildMarkdown();
    const savedPath = await writeOutput(markdown);
    console.log(`✅ Documento generado en ${savedPath}`);
  } catch (error) {
    console.error('❌ No se pudo generar el esquema:', error.message);
    process.exitCode = 1;
  }
}

main();
