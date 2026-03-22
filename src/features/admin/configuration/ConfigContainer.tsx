"use client";
import { useEffect, useState, useMemo } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/UI/Loading';
import { showToast } from '@/components/UI/Toast';
import { authFetch } from '@/lib/auth/authFetch';

// Hooks de dominio
import { useConfigData } from './hooks/useConfigData';
import { useParticipantsAndGroups } from './hooks/useParticipantsAndGroups';
import { useBases } from './hooks/useBases';
import { type Calificacion } from './schemas/configSchemas';

// Componentes de Feature
import { RegisterStaffForm } from './components/RegisterStaffForm';
import { AssignGroupForm } from './components/AssignGroupForm';
import { AutoGroupForm } from './components/AutoGroupForm';
import { ParticipantFiltersBar } from './components/ParticipantFiltersBar';
import { ParticipantGrid } from './components/ParticipantGrid';
import { ParticipantPagination } from './components/ParticipantPagination';
import { EditParticipantModal } from './components/EditParticipantModal';

export const ConfigContainer = () => {
  const {
    isAdmin,
    isLoading: authLoading,
    logout,
  } = useAdminAuth();
  const router = useRouter();

  // Domain Hooks
  const { data, setData, loading: dataLoading, error: dataError, fetchData } = useConfigData(logout);
  const { participants, groups, loadParticipantsAndGroups } = useParticipantsAndGroups(logout);
  const { basesList, loadBases } = useBases(logout);

  // UI State
  const [editModal, setEditModal] = useState<Calificacion | null>(null);
  const [originalData, setOriginalData] = useState<Calificacion | null>(null);
  
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [assigningGroup, setAssigningGroup] = useState(false);
  const [autoGroupCount, setAutoGroupCount] = useState("");
  const [autoGrouping, setAutoGrouping] = useState(false);
  const [staffCorreo, setStaffCorreo] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRol, setStaffRol] = useState("");
  const [staffBaseId, setStaffBaseId] = useState("");

  // Estados para búsqueda, filtros, orden y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrupo, setFilterGrupo] = useState<string>("todos");
  const [filterRol, setFilterRol] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<"nombre" | "promedio" | "grupo">("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    fetchData();
  }, [authLoading, isAdmin, fetchData]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    loadParticipantsAndGroups();
    loadBases();
  }, [authLoading, isAdmin, loadParticipantsAndGroups, loadBases]);

  const grupos = useMemo(() => {
    const uniqueGrupos = [...new Set(data.map((item) => item.Grupo))];
    return uniqueGrupos.sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter((item) => {
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

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / itemsPerPage));
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

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
        headers: { 'Content-Type': 'application/json' },
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

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffCorreo || !staffPassword || !staffRol) {
      showToast.error('Todos los campos obligatorios deben completarse');
      return;
    }
    if (staffRol === 'calificador' && !staffBaseId) {
      showToast.error('Los calificadores deben tener una base asignada');
      return;
    }

    try {
      setCreatingStaff(true);
      const response = await authFetch(
        '/api/staff/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correo: staffCorreo.trim(),
            password: staffPassword,
            rol: staffRol,
            idBase: staffRol === 'calificador' && staffBaseId ? Number(staffBaseId) : null,
          }),
        },
        () => logout()
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al crear staff');

      showToast.success(`${staffRol === 'calificador' ? 'Calificador' : 'Registrador'} creado`);
      setStaffCorreo('');
      setStaffPassword('');
      setStaffRol('');
      setStaffBaseId('');
    } catch (err: unknown) {
      showToast.error(err instanceof Error ? err.message : 'Error al crear staff');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleAssignGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !selectedGroup) {
      showToast.error('Selecciona participante y grupo');
      return;
    }

    try {
      setAssigningGroup(true);
      const response = await authFetch(
        '/api/participante/assign-group',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participanteId: Number(selectedParticipant),
            grupoAssessmentId: Number(selectedGroup),
          }),
        },
        () => logout()
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al asignar participante');

      showToast.success('Participante asignado al grupo');
      setSelectedParticipant('');
      setSelectedGroup('');
    } catch (err: unknown) {
      showToast.error(err instanceof Error ? err.message : 'Error al asignar participante');
    } finally {
      setAssigningGroup(false);
    }
  };

  const handleAutoGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const numGroups = Number(autoGroupCount);
    if (!autoGroupCount || Number.isNaN(numGroups) || numGroups <= 0) {
      showToast.error('Ingresa una cantidad válida de grupos');
      return;
    }

    try {
      setAutoGrouping(true);
      const response = await authFetch(
        '/api/assessment/auto-groups',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numGroups,
          }),
        },
        () => logout()
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al sortear grupos');

      showToast.success('Grupos creados y sorteados correctamente');
      setAutoGroupCount('');
      await fetchData();
      await loadParticipantsAndGroups();
    } catch (err: unknown) {
      showToast.error(err instanceof Error ? err.message : 'Error al sortear grupos');
    } finally {
      setAutoGrouping(false);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="custom" customColor="var(--color-accent)" />
        <p className="text-gray-600 text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 bg-white">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-accent)] mb-6">Configuración del Assessment</h1>
        <Spinner size="lg" color="custom" customColor="var(--color-accent)" />
      </div>
    );
  }
  
  if (dataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p className="text-error text-xl">{dataError}</p>
        <button 
          onClick={() => router.refresh()}
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg border border-gray-200 hover:bg-gray-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      <div className="w-full max-w-[900px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center sm:text-left">Configuración del Assessment</h1>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          <button onClick={() => router.push("/admin")} className="bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-medium transition">Admin</button>
          <button onClick={logout} className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition">Cerrar Sesión</button>
        </div>
      </div>

      <RegisterStaffForm
        staffCorreo={staffCorreo}
        setStaffCorreo={setStaffCorreo}
        staffPassword={staffPassword}
        setStaffPassword={setStaffPassword}
        staffRol={staffRol}
        setStaffRol={setStaffRol}
        staffBaseId={staffBaseId}
        setStaffBaseId={setStaffBaseId}
        basesList={basesList}
        creatingStaff={creatingStaff}
        onSubmit={handleCreateStaff}
      />

      <AssignGroupForm
        selectedParticipant={selectedParticipant}
        setSelectedParticipant={setSelectedParticipant}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        participants={participants}
        groups={groups}
        assigningGroup={assigningGroup}
        onSubmit={handleAssignGroup}
      />

      <AutoGroupForm
        autoGroupCount={autoGroupCount}
        setAutoGroupCount={setAutoGroupCount}
        autoGrouping={autoGrouping}
        onSubmit={handleAutoGroup}
      />

      <ParticipantFiltersBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterGrupo={filterGrupo}
        setFilterGrupo={setFilterGrupo}
        filterRol={filterRol}
        setFilterRol={setFilterRol}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        grupos={grupos}
        setCurrentPage={setCurrentPage}
      />

      <div className="w-full max-w-[900px] flex flex-col items-center">
        <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-gray-500 text-xs mb-2 px-4">
          <span>Mostrando {paginatedData.length} de {filteredAndSortedData.length} resultados</span>
          {(searchTerm || filterGrupo !== "todos" || filterRol !== "todos") && (
            <button onClick={() => { setSearchTerm(""); setFilterGrupo("todos"); setFilterRol("todos"); }} className="text-[color:var(--color-accent)] hover:text-gray-500 underline">Limpiar filtros</button>
          )}
        </div>
        
        <ParticipantGrid
          paginatedData={paginatedData}
          onEdit={(p) => { setEditModal({ ...p }); setOriginalData({ ...p }); }}
        />

        <ParticipantPagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {editModal && (
        <EditParticipantModal
          editModal={editModal}
          setEditModal={setEditModal}
          onCancel={() => { setEditModal(null); setOriginalData(null); }}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};
