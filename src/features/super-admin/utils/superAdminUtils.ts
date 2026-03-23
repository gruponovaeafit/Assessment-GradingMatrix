import { stringify } from "csv-stringify/sync";
import { saveAs } from "file-saver";
import { showToast } from "@/components/UI/Toast";
import { type Assessment, type AdminUser, type GrupoEstudiantil } from "../schemas/superAdminSchemas";

/**
 * Generates a short deterministic hash from a string.
 */
export const shortHash = (input: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash).toString(36).slice(0, 6);
};

/**
 * Calculates the semester (YYYY-1 or YYYY-2) from a date.
 * Jan-Jun = 1, Jul-Dec = 2.
 */
export const calculateSemester = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-11
  const semester = month < 6 ? 1 : 2;
  return `${year}-${semester}`;
};

/**
 * Builds a standardized internal admin email.
 */
export const buildAdminEmail = (
  assessmentId: string, 
  assessment?: Assessment, 
  nombre?: string, 
  personalEmail?: string
): string => {
  const baseDomain = assessment?.grupoNombre || assessment?.nombre;
  const domainSlug = baseDomain
    ? baseDomain
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_+/g, "_")
    : "grupo";
  
  const baseSeed =
    (nombre && personalEmail && `${nombre}|${personalEmail}`) ||
    (nombre ? nombre : "") ||
    (personalEmail ? personalEmail : "") ||
    assessment?.nombre ||
    `${assessmentId}`;
    
  const seed = `${baseSeed}|${assessmentId}`;
  const hash = shortHash(seed);
  return `${hash}_${assessmentId}@${domainSlug}.agm`;
};

/**
 * Calculates payloads for bulk assessment creation.
 */
export const getBulkAssessmentPayloads = (
  grupos: GrupoEstudiantil[], 
  existingAssessments: Assessment[]
) => {
  const now = new Date();
  const year = now.getFullYear();
  const semester = now.getMonth() < 6 ? 1 : 2;
  const existingNames = new Set(existingAssessments.map((item) => item.nombre.toLowerCase()));
  
  return grupos.map((grupo) => {
    const nombre = `Assessment_${grupo.nombre
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_")}_${year}_S${semester}`;
    return {
      nombre,
      grupoEstudiantilId: grupo.id,
      exists: existingNames.has(nombre.toLowerCase()),
    };
  });
};

/**
 * Calculates payloads for bulk admin creation.
 */
export const getBulkAdminPayloads = (
  activeAssessments: Assessment[], 
  existingAdmins: AdminUser[]
) => {
  const existingEmails = new Set(existingAdmins.map((admin) => admin.correo.toLowerCase()));
  return activeAssessments.map((assessment) => {
    const correo = buildAdminEmail(String(assessment.id), assessment);
    return {
      assessment,
      correo,
      exists: existingEmails.has(correo.toLowerCase()),
    };
  });
};

/**
 * Exports admin data to CSV.
 */
export const handleExportAdminsCSV = (admins: AdminUser[]) => {
  try {
    const exportRows = admins.map((admin) => ({
      ID: admin.id,
      Correo: admin.correo,
      Grupo: admin.grupoNombre || "N/A",
      Assessment: admin.assessmentNombre || "N/A",
    }));

    const csv = stringify(exportRows, {
      header: true,
      columns: ["ID", "Correo", "Grupo", "Assessment"],
      delimiter: ";",
    });

    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const fecha = new Date().toISOString().split("T")[0];
    saveAs(blob, `admins_reporte_${fecha}.csv`);
    
    showToast.success(`Exportados ${exportRows.length} administradores`);
  } catch (err) {
    console.error("❌ Error exporting CSV:", err);
    showToast.error("Error al exportar a CSV");
  }
};
