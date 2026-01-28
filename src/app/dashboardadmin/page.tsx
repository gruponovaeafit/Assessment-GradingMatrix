"use client";
import { useEffect, useState, useMemo } from 'react';
import { useAdminAuth } from '../Hooks/useAdminAuth';
import { Spinner, SkeletonDashboardCard } from '../components/UI/Loading';
import { showToast } from '../components/UI/Toast';

interface Calificacion {
  Grupo: string;
  ID: number;
  Participante: string;
  Correo: string;
  role: string;
  Calificacion_Promedio: number;
  Estado: string;
}

export default function Dashboard() {
  const { isAdmin, isLoading: authLoading, requireAdmin, logout } = useAdminAuth();
  const [data, setData] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<Calificacion | null>(null);
  const [originalData, setOriginalData] = useState<Calificacion | null>(null);

  // Estados para búsqueda, filtros, orden y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrupo, setFilterGrupo] = useState<string>("todos");
  const [filterRol, setFilterRol] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<"nombre" | "promedio" | "grupo">("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Proteger la ruta - redirige si no es admin
  useEffect(() => {
    requireAdmin();
  }, [isAdmin, authLoading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboardadmin');
        if (!response.ok) throw new Error('Error al cargar los datos');
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Obtener lista única de grupos
  const grupos = useMemo(() => {
    const uniqueGrupos = [...new Set(data.map((item) => item.Grupo))];
    return uniqueGrupos.sort();
  }, [data]);

  // Datos filtrados y ordenados
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((item) => {
      const matchSearch =
        item.Participante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Correo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrupo = filterGrupo === "todos" || item.Grupo === filterGrupo;
      const matchRol = filterRol === "todos" || item.role === filterRol;
      return matchSearch && matchGrupo && matchRol;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "nombre":
          comparison = a.Participante.localeCompare(b.Participante);
          break;
        case "promedio":
          comparison = (a.Calificacion_Promedio ?? -1) - (b.Calificacion_Promedio ?? -1);
          break;
        case "grupo":
          comparison = a.Grupo.localeCompare(b.Grupo);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, filterGrupo, filterRol, sortBy, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  // Reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGrupo, filterRol]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !originalData) return;

  const updates: Record<string, string | number> = { id: editModal.ID };
    if (editModal.Participante !== originalData.Participante) updates.nombre = editModal.Participante;
    if (editModal.Correo !== originalData.Correo) updates.correo = editModal.Correo;
    if (editModal.role !== originalData.role) updates.role = editModal.role;

    if (Object.keys(updates).length === 1) {
      showToast.error("Debe modificarse al menos un campo");
      return;
    }

    const res = await fetch('/api/update-person', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const result = await res.json();
    if (res.ok) {
      showToast.success("Participante actualizado correctamente");
      setData((prev) =>
        prev.map((p) => (p.ID === editModal.ID ? editModal : p))
      );
      setEditModal(null);
      setOriginalData(null);
    } else {
      showToast.error(result.error || "Error al actualizar");
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[color:var(--color-bg)]">
        <Spinner size="xl" color="var(--color-accent)" />
        <p className="text-[color:var(--color-text)] text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 bg-[color:var(--color-bg)]">
        <div className="w-full max-w-[900px] flex justify-between items-center mb-4 px-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-accent)]">Panel de Calificaciones</h1>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <Spinner size="lg" color="var(--color-accent)" />
          <span className="text-[color:var(--color-muted)] text-lg">Cargando datos...</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 max-w-[900px] w-full">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonDashboardCard key={i} />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[color:var(--color-bg)]">
        <p className="text-error text-xl">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[color:var(--color-surface)] text-[color:var(--color-text)] rounded-lg border border-[color:var(--color-muted)] hover:bg-[color:var(--color-muted)]/20"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-4 bg-white"
    >
      {/* Header con título y botón logout */}
      <div className="w-full max-w-[900px] flex justify-between items-center mb-4 px-2">
        <h1 className="text-3xl font-extrabold text-gray-900">Panel de Calificaciones</h1>
        <button
          onClick={logout}
          className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="w-full max-w-[900px] mb-4 px-2">
        <div className="bg-white rounded-xl p-4 space-y-3 shadow border border-gray-100">
          {/* Búsqueda */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[color:var(--color-accent)] focus:outline-none transition text-base"
            />
          </div>

          {/* Filtros y ordenamiento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={filterGrupo}
              onChange={(e) => setFilterGrupo(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-base"
            >
              <option value="todos" className="text-black">Todos los grupos</option>
              {grupos.map((grupo) => (
                <option key={grupo} value={grupo} className="text-black">{grupo}</option>
              ))}
            </select>

            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-base"
            >
              <option value="todos" className="text-black">Todos los roles</option>
              <option value="0" className="text-black">Aspirantes</option>
              <option value="1" className="text-black">Infiltrados</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "nombre" | "promedio" | "grupo")}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-base"
            >
              <option value="nombre" className="text-black">Ordenar: Nombre</option>
              <option value="promedio" className="text-black">Ordenar: Promedio</option>
              <option value="grupo" className="text-black">Ordenar: Grupo</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 hover:bg-gray-100 transition text-base"
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>

          {/* Info de resultados */}
          <div className="flex justify-between items-center text-gray-500 text-xs">
            <span>
              Mostrando {paginatedData.length} de {filteredAndSortedData.length} resultados
            </span>
            {(searchTerm || filterGrupo !== "todos" || filterRol !== "todos") && (
              <button
                onClick={() => { setSearchTerm(""); setFilterGrupo("todos"); setFilterRol("todos"); }}
                className="text-[color:var(--color-accent)] hover:text-gray-500 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 max-w-[900px] w-full rounded-md p-2 sm:p-4">
        {paginatedData.map((item) => (
          <div
            key={item.ID}
            className="flex flex-col justify-center items-center text-gray-900 px-4 sm:px-6 py-3 sm:py-4 rounded-lg bg-white shadow animate-fadeIn border border-gray-100"
            style={{
              width: '100%',
              maxWidth: '320px',
              minHeight: '240px',
            }}
          >
            <div className="w-full flex justify-center mb-2">
              <h2 className="text-lg font-bold text-[color:var(--color-accent)] text-center w-full leading-tight">
                {item.Participante}
              </h2>
            </div>

            <div className="w-full flex justify-center mb-2">
              <div className="border-t border-gray-200" style={{ width: '95%' }} />
            </div>

            <div className="text-left w-full leading-5 sm:leading-6 text-base">
              <p><span className="font-bold">ID:</span> {item.ID}</p>
              <p><span className="font-bold">Grupo:</span> {item.Grupo}</p>
              <p className="truncate"><span className="font-bold">Correo:</span> {item.Correo}</p>
              <p><span className="font-bold">Rol:</span> {item.role}</p>
              <p>
                <span className="font-bold">Promedio:</span>{" "}
                {item.Calificacion_Promedio != null
                  ? item.Calificacion_Promedio.toFixed(2)
                  : "Sin calificación"}
              </p>
              <p>
                <span className="font-bold">Estado:</span>{' '}
                <span className={item.Calificacion_Promedio < 4 ? 'text-error' : 'text-success'}>
                  {item.Estado}
                </span>
              </p>
            </div>

            <button
              onClick={() => {
                setEditModal({ ...item });
                setOriginalData({ ...item });
              }}
              className="mt-2 text-base bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded shadow"
            >
              Editar
            </button>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="w-full max-w-[900px] mt-4 px-2">
          <div className="flex flex-wrap justify-center items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl p-3">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              «
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, index, arr) => (
                <span key={page} className="flex items-center">
                  {index > 0 && arr[index - 1] !== page - 1 && (
                    <span className="text-white/60 px-1">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm transition ${
                      currentPage === page
                        ? "bg-primary text-white font-bold"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              »
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              »»
            </button>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-primary-dark rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">Editar Participante</h2>
            <form onSubmit={handleUpdate}>
              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Nombre</label>
              <input
                type="text"
                value={editModal.Participante}
                onChange={(e) => setEditModal({ ...editModal, Participante: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white placeholder-gray-500 text-sm sm:text-base"
              />

              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Correo</label>
              <input
                type="email"
                value={editModal.Correo}
                onChange={(e) => setEditModal({ ...editModal, Correo: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white placeholder-gray-500 text-sm sm:text-base"
              />

              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Rol</label>
              <input
                type="text"
                value={editModal.role}
                onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white placeholder-gray-500 text-sm sm:text-base"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditModal(null);
                    setOriginalData(null);
                  }}
                  className="px-3 sm:px-4 py-2 rounded bg-white/80 text-black hover:bg-white text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 rounded bg-success text-white hover:bg-success-dark text-sm sm:text-base"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
