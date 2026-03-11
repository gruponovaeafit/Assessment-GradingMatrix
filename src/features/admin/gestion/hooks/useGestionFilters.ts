import { useState, useMemo, useEffect } from 'react';
import { type ParticipantDashboardRow, type ClassificationRanges } from '../schemas/gestionSchemas';
import { CheckCircle, ClipboardList, TriangleAlert, XCircle, Hourglass } from 'lucide-react';

export function useGestionFilters(data: ParticipantDashboardRow[], classificationRanges: ClassificationRanges) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrupo, setFilterGrupo] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterRol, setFilterRol] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<"nombre" | "promedio" | "grupo">("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getEstadoInfo = (promedio: number | null) => {
    if (promedio == null) return { texto: "Pendiente", color: "text-white/60", Icon: Hourglass };
    if (promedio >= classificationRanges.group) return { texto: "Pasa al grupo", color: "text-success", Icon: CheckCircle };
    if (promedio >= classificationRanges.interview)
      return { texto: "Pasa a entrevista", color: "text-success-light", Icon: ClipboardList };
    if (promedio >= classificationRanges.discussion)
      return { texto: "Pasa a discusión", color: "text-yellow-400", Icon: TriangleAlert };
    return { texto: "No pasa", color: "text-error", Icon: XCircle };
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((item) => {
      const matchSearch =
        item.Participante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Correo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGrupo = filterGrupo === "todos" || item.Grupo === filterGrupo;

      const estado = getEstadoInfo(item.Calificacion_Promedio).texto;
      const matchEstado = filterEstado === "todos" || estado === filterEstado;

      const matchRol =
        filterRol === "todos" ||
        (filterRol === "infiltrado" && item.role === "1") ||
        (filterRol === "aspirante" && item.role === "0");

      return matchSearch && matchGrupo && matchEstado && matchRol;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "nombre":
          comparison = a.Participante.localeCompare(b.Participante);
          break;
        case "promedio": {
          const promedioA = a.Calificacion_Promedio ?? -1;
          const promedioB = b.Calificacion_Promedio ?? -1;
          comparison = promedioA - promedioB;
          break;
        }
        case "grupo":
          comparison = a.Grupo.localeCompare(b.Grupo);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, filterGrupo, filterEstado, filterRol, sortBy, sortOrder, classificationRanges]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const grupos = useMemo(() => {
    const uniqueGrupos = [...new Set(data.map((item) => item.Grupo))];
    return uniqueGrupos.sort();
  }, [data]);

  const baseNumbers = useMemo(() => {
    return Array.from(
      new Set(data.flatMap((item) => item.Bases.map((b) => b.numero)))
    ).sort((a, b) => a - b);
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGrupo, filterEstado, filterRol]);

  return {
    searchTerm, setSearchTerm,
    filterGrupo, setFilterGrupo,
    filterEstado, setFilterEstado,
    filterRol, setFilterRol,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    filteredAndSortedData,
    paginatedData,
    totalPages,
    grupos,
    baseNumbers,
    getEstadoInfo
  };
}
