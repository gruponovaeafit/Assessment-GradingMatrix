import { stringify } from "csv-stringify/sync";
import { saveAs } from "file-saver";
import { showToast } from "@/components/UI/Toast";
import { type ParticipantDashboardRow } from "../schemas/gestionSchemas";

export const handleExportCSV = (
  filteredAndSortedData: ParticipantDashboardRow[],
  baseNumbers: number[],
  getEstadoInfo: (promedio: number | null) => { texto: string; color: string }
) => {
  try {
    const exportRows = filteredAndSortedData.map((item) => {
      const row: Record<string, string> = {
        Nombre: item.Participante,
        Correo: item.Correo,
        Rol: item.role === "1" ? "Infiltrado" : "Aspirante",
        Grupo: item.Grupo,
      };

      for (const n of baseNumbers) {
        const base = item.Bases.find((b) => b.numero === n);
        row[`Base ${n}`] =
          base && base.promedio != null
            ? base.promedio.toFixed(2)
            : "N/A";
      }

      row.Promedio =
        item.Calificacion_Promedio != null
          ? item.Calificacion_Promedio.toFixed(2)
          : "N/A";

      row.Estado = getEstadoInfo(item.Calificacion_Promedio).texto;

      return row;
    });

    const csv = stringify(exportRows, {
      header: true,
      columns: Object.keys(exportRows[0] ?? {}),
      delimiter: ";",
    });

    // BOM para que Excel abra UTF-8 (tildes/ñ) correctamente
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });

    const fecha = new Date().toISOString().split("T")[0];
    saveAs(blob, `calificaciones_${fecha}.csv`);

    showToast.success(`Se exportaron ${exportRows.length} registros`);
  } catch (err) {
    console.error("❌ Error exporting CSV:", err);
    showToast.error("Error al exportar a CSV");
  }
};
