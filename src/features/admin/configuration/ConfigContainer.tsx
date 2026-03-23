"use client";
import { useEffect, useState, useMemo } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { showToast } from '@/components/UI/Toast';
import { authFetch } from '@/lib/auth/authFetch';

// Hooks de dominio
import { useConfigData } from './hooks/useConfigData';
import { useParticipantsAndGroups } from './hooks/useParticipantsAndGroups';
import { useBases } from './hooks/useBases';
import { type Calificacion } from './schemas/configSchemas';

// Componentes de Feature
import { RegisterStaffForm } from './components/RegisterStaffForm';
import { ParticipantFiltersBar } from './components/ParticipantFiltersBar';
import { ParticipantGrid } from './components/ParticipantGrid';
import { ParticipantPagination } from './components/ParticipantPagination';
import { EditParticipantModal } from './components/EditParticipantModal';
import { DropdownOverlay } from './components/DropdownOverlay';
import { EditGroupsForm } from './components/EditGroupsForm';

// UI Components
import { Box } from '@/components/UI/Box';
import { Button } from '@/components/UI/Button';
import { Spinner, BrandedLoading } from '@/components/UI/Loading';

export const ConfigContainer = () => {
  const {
    isAdmin,
    assessmentId,
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
  
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [autoGroupCount, setAutoGroupCount] = useState("");
  const [autoGrouping, setAutoGrouping] = useState(false);
  const [staffCorreo, setStaffCorreo] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRol, setStaffRol] = useState("");
  const [staffBaseId, setStaffBaseId] = useState("");

  const [showAutoGroupDropdown, setShowAutoGroupDropdown] = useState(false);
  const [showEditGroupsDropdown, setShowEditGroupsDropdown] = useState(false);

  // Estados para búsqueda, filtros, orden y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<"nombre" | "rol">("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/auth/login");
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    
    const loadAllData = async () => {
      await Promise.all([
        fetchData(),
        loadParticipantsAndGroups(),
        loadBases()
      ]);
    };

    loadAllData();
  }, [authLoading, isAdmin, fetchData, loadParticipantsAndGroups, loadBases]);

  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchSearch =
        item.Correo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRol = filterRol === "todos" || item.role === filterRol;
      return matchSearch && matchRol;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "nombre":
          comparison = a.Correo.localeCompare(b.Correo);
          break;
        case "rol":
          comparison = a.role.localeCompare(b.role);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, filterRol, sortBy, sortOrder]);

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
  }, [searchTerm, filterRol]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !originalData) return;

    const updates: Record<string, any> = { id: editModal.ID };
    if (editModal.Correo !== originalData.Correo) updates.correo = editModal.Correo;
    if (editModal.role !== originalData.role) updates.role = editModal.role;
    if (editModal.Active !== originalData.Active) updates.active = editModal.Active;

    if (Object.keys(updates).length === 1) {
      showToast.error("Debe modificarse al menos un campo");
      return;
    }

    const res = await authFetch(
      '/api/staff/update-active',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      },
      () => logout()
    );

    const result = await res.json();
    if (res.ok) {
      showToast.success("Staff actualizado correctamente");
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
      setShowAutoGroupDropdown(false);
      await fetchData();
      await loadParticipantsAndGroups();
    } catch (err: unknown) {
      showToast.error(err instanceof Error ? err.message : 'Error al sortear grupos');
    } finally {
      setAutoGrouping(false);
    }
  };

  if (authLoading || dataLoading) {
    return <BrandedLoading message="Preparando configuración del panel..." />;
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
          <Button variant="accent" onClick={() => router.push("/admin")}>
            <Image src="/HomeIcon.svg" alt="" width={18} height={18} className="mr-2" />
            Menú principal
          </Button>
          <Button variant="error" onClick={logout}>
            <Image src="/LogoutIcon.svg" alt="" width={18} height={18} className="mr-2" />
            Cerrar Sesión
          </Button>
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

      {/* Ajustes de grupo Section */}
      <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
        <Box className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center sm:text-left">Ajustes de grupo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => setShowEditGroupsDropdown(true)}
              className="w-full py-3 h-auto text-base font-bold"
              variant="accent"
            >
              Editar grupos
            </Button>
            <Button
              onClick={() => setShowAutoGroupDropdown(true)}
              className="w-full py-3 h-auto text-base font-bold"
              variant="accent"
            >
              Crear y sortear grupos
            </Button>
          </div>
        </Box>
      </div>

      <DropdownOverlay
        isOpen={showAutoGroupDropdown}
        onClose={() => setShowAutoGroupDropdown(false)}
        title="Crear y Sortear Grupos"
        confirmLabel={autoGrouping ? "Sorteando..." : "Crear y sortear"}
        confirmDisabled={autoGrouping}
        onConfirm={() => {
          const form = document.getElementById('auto-group-form') as HTMLFormElement;
          form?.requestSubmit();
        }}
      >
        <form id="auto-group-form" onSubmit={handleAutoGroup}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Distribuye participantes de forma equitativa. Si hay impostores (rol=1), se reparte 1 por grupo hasta que se acaben.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Cantidad de grupos</label>
              <input
                type="number"
                min={1}
                placeholder="Ej. 5"
                value={autoGroupCount}
                onChange={(e) => setAutoGroupCount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none transition"
              />
            </div>
          </div>
        </form>
      </DropdownOverlay>

      <DropdownOverlay
        isOpen={showEditGroupsDropdown}
        onClose={() => setShowEditGroupsDropdown(false)}
        title="Editar Grupos"
      >
        <EditGroupsForm
          groups={groups}
          participants={participants}
          assessmentId={assessmentId || 0}
          onRefresh={async () => {
            await fetchData(true); // Silent refresh
            await loadParticipantsAndGroups(true); // Silent refresh
          }}
          logout={logout}
        />
      </DropdownOverlay>

      <ParticipantFiltersBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterRol={filterRol}
        setFilterRol={setFilterRol}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        setCurrentPage={setCurrentPage}
      />

      <div className="w-full max-w-[900px] flex flex-col items-center">
        <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-gray-500 text-xs mb-2 px-4">
          <span>Mostrando {paginatedData.length} de {filteredAndSortedData.length} resultados</span>
          {(searchTerm || filterRol !== "todos") && (
            <button onClick={() => { setSearchTerm(""); setFilterRol("todos"); }} className="text-[color:var(--color-accent)] hover:text-gray-500 underline">Limpiar filtros</button>
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
