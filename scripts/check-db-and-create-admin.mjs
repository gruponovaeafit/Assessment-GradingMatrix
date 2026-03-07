import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function randomSuffix(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length);
}

function resolveEnvPath() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(scriptDir, ".env.local"),
    path.join(scriptDir, "..", ".env.local"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function buildDefaultPassword() {
  return `Admin!${randomSuffix(8)}${Date.now().toString().slice(-2)}`;
}

const envPath = resolveEnvPath();
if (envPath) {
  loadEnv(envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const inputAssessmentId = getArg("assessmentId");
const inputEmail = getArg("email");
const inputPassword = getArg("password");
const dryRun = process.argv.includes("--dryRun");

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resolveAssessmentId() {
  if (inputAssessmentId) {
    const parsed = Number(inputAssessmentId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error("assessmentId inválido. Debe ser número positivo.");
    }

    const { data, error } = await supabase
      .from("Assessment")
      .select("ID_Assessment, Nombre_Assessment")
      .eq("ID_Assessment", parsed)
      .maybeSingle();

    if (error) throw new Error(`Error validando assessmentId: ${error.message}`);
    if (!data) throw new Error(`No existe Assessment con ID ${parsed}`);
    return data;
  }

  const { data: active, error: activeError } = await supabase
    .from("Assessment")
    .select("ID_Assessment, Nombre_Assessment, Activo_Assessment")
    .eq("Activo_Assessment", true)
    .order("ID_Assessment", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError) throw new Error(`Error buscando assessment activo: ${activeError.message}`);
  if (active) return active;

  const { data: anyAssessment, error: anyError } = await supabase
    .from("Assessment")
    .select("ID_Assessment, Nombre_Assessment")
    .order("ID_Assessment", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (anyError) throw new Error(`Error buscando cualquier assessment: ${anyError.message}`);
  if (!anyAssessment) throw new Error("No hay assessments en la base de datos.");
  return anyAssessment;
}

async function main() {
  console.log("🔎 Verificando conectividad a Supabase...");
  const { count, error: connectionError } = await supabase
    .from("Assessment")
    .select("*", { count: "exact", head: true });

  if (connectionError) {
    throw new Error(`No se pudo acceder a la base de datos: ${connectionError.message}`);
  }

  console.log(`✅ Base accesible. Total de assessments: ${count ?? 0}`);

  const assessment = await resolveAssessmentId();
  const assessmentId = Number(assessment.ID_Assessment);
  const email = inputEmail || `admin_test_${Date.now().toString().slice(-6)}@nova.local`;
  const password = inputPassword || buildDefaultPassword();

  console.log(`🎯 Assessment destino: ${assessmentId} (${assessment.Nombre_Assessment ?? "sin nombre"})`);
  console.log(`👤 Correo a crear: ${email}`);

  const { data: existing, error: existingError } = await supabase
    .from("Staff")
    .select("ID_Staff")
    .eq("ID_Assessment", assessmentId)
    .eq("Correo_Staff", email)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Error verificando admin existente: ${existingError.message}`);
  }

  if (existing) {
    throw new Error(`Ya existe un Staff con correo ${email} en el assessment ${assessmentId}.`);
  }

  if (dryRun) {
    console.log("🧪 dryRun activado: no se insertó ningún admin.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data: created, error: createError } = await supabase
    .from("Staff")
    .insert({
      ID_Assessment: assessmentId,
      Correo_Staff: email,
      Contrasena_Staff: hashedPassword,
      Rol_Staff: "admin",
      Active: false,
      ID_Base: null,
    })
    .select("ID_Staff, ID_Assessment, Correo_Staff, Rol_Staff, Active")
    .single();

  if (createError || !created) {
    throw new Error(`No se pudo crear el admin: ${createError?.message || "sin detalle"}`);
  }

  console.log("✅ Admin creado correctamente.");
  console.log("📌 Resultado:");
  console.log(created);
  console.log("🔐 Credenciales de prueba:");
  console.log({ email, password });
}

main().catch((err) => {
  console.error("❌", err.message || err);
  process.exit(1);
});
