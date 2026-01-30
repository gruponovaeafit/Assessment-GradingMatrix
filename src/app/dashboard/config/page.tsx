"use client";
import { useEffect, useState, useMemo } from 'react';
import { useAdminAuth } from '../../Hooks/useAdminAuth';
import { useRouter } from 'next/navigation';
import { Spinner } from '../../components/UI/Loading';
import { showToast } from '../../components/UI/Toast';
import { authFetch } from '@/lib/authFetch';

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
  const { isAdmin, isLoading: authLoading, requireAdmin, logout, getAuthHeaders } = useAdminAuth();
  const router = useRouter();
  const [data, setData] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<Calificacion | null>(null);
  const [originalData, setOriginalData] = useState<Calificacion | null>(null);
  const [assessments, setAssessments] = useState<{ id: number; nombre: string; activo: boolean }[]>([]);
  const [configAssessmentId, setConfigAssessmentId] = useState<string>("");
  const [participants, setParticipants] = useState<{ id: number; nombre: string; correo: string }[]>([]);
  const [groups, setGroups] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [assigningGroup, setAssigningGroup] = useState(false);
  const [staffAssessmentId, setStaffAssessmentId] = useState<string>("");
  const [staffCorreo, setStaffCorreo] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRol, setStaffRol] = useState("calificador");
  const [staffBaseId, setStaffBaseId] = useState("");
  const [assessmentNombre, setAssessmentNombre] = useState('');
  const [assessmentDescripcion, setAssessmentDescripcion] = useState('');
  const [grupoEstudiantilId, setGrupoEstudiantilId] = useState('');
  const [creatingAssessment, setCreatingAssessment] = useState(false);

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
    if (authLoading || !isAdmin) return;
    const fetchData = async () => {
      try {
        const response = await authFetch(
          '/api/dashboard/config',
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (!response.ok) throw new Error('Error al cargar los datos');
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar los datos';
        if (message.toLowerCase().includes('no autorizado')) {
          router.push('/auth/login');
          return;
        }
        setError('Error al cargar los datos');
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const fetchAssessments = async () => {
      try {
        const response = await authFetch(
          '/api/assessment/list',
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (!response.ok) throw new Error('Error al cargar assessments');
        const result = await response.json();
        setAssessments(result || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAssessments();
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const loadParticipantsAndGroups = async () => {
      if (!configAssessmentId) {
        setParticipants([]);
        setGroups([]);
        return;
      }

      try {
        const [participantsRes, groupsRes] = await Promise.all([
          authFetch(
            `/api/participante/list?assessmentId=${configAssessmentId}`,
            { headers: { ...getAuthHeaders() } },
            () => logout()
          ),
          authFetch(
            `/api/assessment/groups?assessmentId=${configAssessmentId}`,
            { headers: { ...getAuthHeaders() } },
            () => logout()
          ),
        ]);

        if (participantsRes.status === 401 || groupsRes.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (participantsRes.ok) {
          const participantsData = await participantsRes.json();
          setParticipants(participantsData || []);
        }

        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          setGroups(groupsData || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadParticipantsAndGroups();
  }, [authLoading, isAdmin, configAssessmentId, router]);

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

    const res = await authFetch(
      '/api/update-person',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updates),
      },
      () => logout()
    );

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

  const refreshAssessments = async () => {
    try {
      const response = await authFetch(
        '/api/assessment/list',
        { headers: { ...getAuthHeaders() } },
        () => logout()
      );
      if (!response.ok) throw new Error('Error al cargar assessments');
      const result = await response.json();
      setAssessments(result || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAssessment = async (assessmentId: number, activo: boolean) => {
    try {
      const response = await authFetch(
        '/api/assessment/toggle-active',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ assessmentId, activo: !activo }),
        },
        () => logout()
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar assessment');
      }

      showToast.success(`Assessment ${!activo ? 'activado' : 'desactivado'}`);
      refreshAssessments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar assessment';
      showToast.error(message);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffAssessmentId || !staffCorreo || !staffPassword || !staffRol) {
      showToast.error('Todos los campos obligatorios deben completarse');
      return;
    }

    try {
      setCreatingStaff(true);
      const response = await authFetch(
        '/api/staff/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            assessmentId: Number(staffAssessmentId),
            correo: staffCorreo.trim(),
            password: staffPassword,
            rol: staffRol,
            idBase: staffBaseId ? Number(staffBaseId) : null,
          }),
        },
        () => logout()
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear calificador');
      }

      showToast.success(`Calificador creado (ID: ${result.ID_Staff})`);
      setStaffCorreo('');
      setStaffPassword('');
      setStaffRol('calificador');
      setStaffBaseId('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear calificador';
      showToast.error(message);
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleAssignGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!configAssessmentId || !selectedParticipant || !selectedGroup) {
      showToast.error('Selecciona assessment, participante y grupo');
      return;
    }

    try {
      setAssigningGroup(true);
      const response = await authFetch(
        '/api/participante/assign-group',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            assessmentId: Number(configAssessmentId),
            participanteId: Number(selectedParticipant),
            grupoAssessmentId: Number(selectedGroup),
          }),
        },
        () => logout()
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al asignar participante');
      }

      showToast.success('Participante asignado al grupo');
      setSelectedParticipant('');
      setSelectedGroup('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al asignar participante';
      showToast.error(message);
    } finally {
      setAssigningGroup(false);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!grupoEstudiantilId || !assessmentNombre.trim()) {
      showToast.error('GrupoEstudiantil ID y nombre son obligatorios');
      return;
    }

    try {
      setCreatingAssessment(true);
      const response = await authFetch(
        '/api/assessment/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            grupoEstudiantilId: Number(grupoEstudiantilId),
            nombre: assessmentNombre.trim(),
            descripcion: assessmentDescripcion.trim() || null,
          }),
        },
        () => logout()
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear assessment');
      }

      showToast.success(`Assessment creado (ID: ${result.ID_Assessment})`);
      setAssessmentNombre('');
      setAssessmentDescripcion('');
      setGrupoEstudiantilId('');
      refreshAssessments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear assessment';
      showToast.error(message);
    } finally {
      setCreatingAssessment(false);
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="var(--color-accent)" />
        <p className="text-gray-600 text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 bg-white">
        <div className="w-full max-w-[900px] flex justify-between items-center mb-4 px-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-accent)]">Configuración del Assessment</h1>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <Spinner size="lg" color="var(--color-accent)" />
          <span className="text-gray-500 text-lg">Cargando datos...</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 max-w-[900px] w-full">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-lg p-4 shadow w-full max-w-[320px] min-h-[240px]"
            >
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-px bg-gray-100 w-full mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p className="text-error text-xl">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg border border-gray-200 hover:bg-gray-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      {/* Header con título y botón logout */}
      <div className="w-full max-w-[900px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center sm:text-left">
          Configuración del Assessment
        </h1>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          <button
            onClick={() => (window.location.href = "/admin")}
            className="bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Admin
          </button>
          <button
            onClick={logout}
            className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Crear Assessment</h2>
          <form onSubmit={handleCreateAssessment} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="ID GrupoEstudiantil"
              value={grupoEstudiantilId}
              onChange={(e) => setGrupoEstudiantilId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            />
            <input
              type="text"
              placeholder="Nombre del Assessment"
              value={assessmentNombre}
              onChange={(e) => setAssessmentNombre(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={assessmentDescripcion}
              onChange={(e) => setAssessmentDescripcion(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            />
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={creatingAssessment}
                className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-sm font-medium transition disabled:opacity-60"
              >
                {creatingAssessment ? 'Creando...' : 'Crear Assessment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
        <div className="bg-white rounded-xl p-4 shadow border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-bold text-gray-900">Assessments</h2>
            <button
              onClick={refreshAssessments}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm hover:bg-gray-50"
            >
              Recargar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{assessment.nombre}</p>
                  <p className="text-xs text-gray-500">ID: {assessment.id}</p>
                </div>
                <button
                  onClick={() => handleToggleAssessment(assessment.id, assessment.activo)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    assessment.activo ? "bg-success text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {assessment.activo ? "Activo" : "Inactivo"}
                </button>
              </div>
            ))}
            {assessments.length === 0 && (
              <p className="text-sm text-gray-500">No hay assessments registrados.</p>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Registrar Calificador</h2>
          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={staffAssessmentId}
              onChange={(e) => setStaffAssessmentId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            >
              <option value="">Assessment</option>
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.nombre}
                </option>
              ))}
            </select>
            <input
              type="email"
              placeholder="Correo del calificador"
              value={staffCorreo}
              onChange={(e) => setStaffCorreo(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            />
            <input
              type="text"
              placeholder="Rol (ej: calificador)"
              value={staffRol}
              onChange={(e) => setStaffRol(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            />
            <input
              type="number"
              placeholder="ID Base (opcional)"
              value={staffBaseId}
              onChange={(e) => setStaffBaseId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            />
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={creatingStaff}
                className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-sm font-medium transition disabled:opacity-60"
              >
                {creatingStaff ? "Registrando..." : "Registrar Calificador"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Asignar Participante a Grupo</h2>
          <form onSubmit={handleAssignGroup} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={configAssessmentId}
              onChange={(e) => setConfigAssessmentId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            >
              <option value="">Assessment</option>
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.nombre}
                </option>
              ))}
            </select>
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            >
              <option value="">Participante</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.nombre} ({participant.correo})
                </option>
              ))}
            </select>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            >
              <option value="">Grupo</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.nombre}
                </option>
              ))}
            </select>
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={assigningGroup}
                className="px-4 py-2 rounded-lg bg-success hover:bg-success-dark text-white text-sm font-medium transition disabled:opacity-60"
              >
                {assigningGroup ? "Asignando..." : "Asignar a Grupo"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-gray-500 text-xs">
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
          <div className="flex flex-wrap justify-center items-center gap-2 bg-white rounded-xl p-3 border border-gray-100 shadow">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              «
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, index, arr) => (
                <span key={page} className="flex items-center">
                  {index > 0 && arr[index - 1] !== page - 1 && <span className="text-gray-400 px-1">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm transition ${
                      currentPage === page
                        ? "bg-[color:var(--color-accent)] text-white font-bold"
                        : "bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              »
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
