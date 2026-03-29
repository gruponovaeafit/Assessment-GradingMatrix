"use client";
import { useEffect, useState, useMemo } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { notify, NotificationProvider } from '@/components/UI/Notification';
import { Button } from '@/components/UI/Button';
import { Box } from '@/components/UI/Box';
import { BrandedLoading, Skeleton } from '@/components/UI/Loading';
import { useParticipantsAndGroups } from './hooks/useParticipantsAndGroups';
import { useBasesData } from '../bases/hooks/useBasesData';
import { ParticipantFiltersBar } from './components/ParticipantFiltersBar';
import { RegisterStaffForm } from './components/RegisterStaffForm';
import { EditGroupsForm } from './components/EditGroupsForm';
import { DropdownOverlay } from './components/DropdownOverlay';
import { useConfirmModal } from '@/components/UI/ConfirmModal';
import { authFetch } from '@/lib/auth/authFetch';
import { ParticipantGrid } from './components/ParticipantGrid';
import { ParticipantCard } from './components/ParticipantCard';
import { ParticipantPagination } from './components/ParticipantPagination';
import { EditParticipantModal } from './components/EditParticipantModal';

export const ConfigContainer = () => {
  const { isAdmin, assessmentId, isLoading: authLoading, logout } = useAdminAuth();
  const router = useRouter();

  const { staff, participants, groups, loading: dataLoading, loadParticipantsAndGroups } = useParticipantsAndGroups(logout);
  const { bases } = useBasesData();

  const [staffCorreo, setStaffCorreo] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRol, setStaffRol] = useState('');
  const [staffBaseId, setStaffBaseId] = useState('');
  const [creatingStaff, setCreatingStaff] = useState(false);

  const [showAutoGroupDropdown, setShowAutoGroupDropdown] = useState(false);
  const [autoGroupCount, setAutoGroupCount] = useState('');
  const [autoGrouping, setAutoGrouping] = useState(false);

  const [showEditGroupsDropdown, setShowEditGroupsDropdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("todos");
  const [sortBy, setSortBy] = useState<"nombre" | "rol">("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [editModal, setEditModal] = useState<{
    id: number;
    correo: string;
    role: string;
    active: boolean;
  } | null>(null);
  const [originalData, setOriginalData] = useState<{
    correo: string;
    role: string;
    active: boolean;
  } | null>(null);

  const { ConfirmModalComponent } = useConfirmModal();

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const loadAllData = async () => {
      await Promise.all([
        loadParticipantsAndGroups()
      ]);
    };
    loadAllData();
  }, [authLoading, isAdmin, loadParticipantsAndGroups]);

  const filteredAndSortedData = useMemo(() => {
    const results = staff.filter((s) => {
      const matchesSearch = s.Correo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRol = filterRol === "todos" || s.role === filterRol;
      return matchesSearch && matchesRol;
    });

    return results.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "nombre") comparison = a.Correo.localeCompare(b.Correo);
      else if (sortBy === "rol") comparison = a.role.localeCompare(b.role);
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [staff, searchTerm, filterRol, sortBy, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(start, start + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffCorreo || !staffPassword || !staffRol) {
      notify({
        title: 'Campos incompletos',
        titleColor: 'var(--warning)',
        subtitle: 'Por favor completa todos los campos obligatorios',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--warning)',
        duration: 3000,
      });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(staffCorreo)) {
      notify({
        title: 'Correo inválido',
        titleColor: 'var(--warning)',
        subtitle: 'El correo debe tener un formato válido (ej. usuario@dominio.com)',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--warning)',
        duration: 3000,
      });
      return;
    }

    if (staffRol === 'calificador' && !staffBaseId) {
      notify({
        title: 'Base no seleccionada',
        titleColor: 'var(--warning)',
        subtitle: 'Debes seleccionar una base para el calificador',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--warning)',
        duration: 3000,
      });
      return;
    }

    setCreatingStaff(true);
    try {
      const response = await authFetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: staffCorreo,
          password: staffPassword,
          rol: staffRol,
          idBase: staffRol === 'calificador' ? Number(staffBaseId) : null,
        }),
      }, () => logout());

      if (response.ok) {
        notify({
          title: 'Staff registrado',
          titleColor: 'var(--color-accent)',
          subtitle: 'El miembro del staff ha sido creado exitosamente',
          subtitleColor: 'var(--color-muted)',
          borderColor: 'var(--color-accent)',
          duration: 3000,
        });
        setStaffCorreo('');
        setStaffPassword('');
        setStaffRol('');
        setStaffBaseId('');
        await loadParticipantsAndGroups();
      } else {
        const error = await response.json();
        notify({
          title: 'Error al registrar',
          titleColor: 'var(--error)',
          subtitle: error.error || 'No se pudo completar el registro',
          subtitleColor: 'var(--color-muted)',
          borderColor: 'var(--error)',
          duration: 4000,
        });
      }
    } catch {
      notify({
        title: 'Error de red',
        titleColor: 'var(--error)',
        subtitle: 'No se pudo conectar con el servidor',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--error)',
        duration: 4000,
      });
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editModal) return;
    const isNoChange = 
      editModal.correo === originalData?.correo &&
      editModal.role === originalData?.role &&
      editModal.active === originalData?.active;

    if (isNoChange) {
      setEditModal(null);
      return;
    }

    try {
      const response = await authFetch('/api/staff/update-active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.id,
          correo: editModal.correo,
          role: editModal.role,
          active: editModal.active,
        }),
      }, () => logout());

      if (response.ok) {
        notify({
          title: 'Staff actualizado',
          titleColor: 'var(--color-accent)',
          subtitle: 'Los cambios se guardaron correctamente',
          subtitleColor: 'var(--color-muted)',
          borderColor: 'var(--color-accent)',
          duration: 3000,
        });
        setEditModal(null);
        setOriginalData(null);
        await loadParticipantsAndGroups();
      }
    } catch (err) {
      console.error('Error updating staff:', err);
    }
  };

  const handleAutoGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoGroupCount || autoGrouping) return;

    setAutoGrouping(true);
    try {
      const response = await authFetch('/api/assessment/auto-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numGroups: Number(autoGroupCount),
        }),
      }, () => logout());

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al sortear');
      }

      notify({
        title: 'Sorteo Exitoso',
        titleColor: 'var(--color-accent)',
        subtitle: 'Grupos creados y sorteados correctamente',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--color-accent)',
        duration: 2000,
      });
      setAutoGroupCount('');
      setShowAutoGroupDropdown(false);
      await loadParticipantsAndGroups();
    } catch (err: unknown) {
      notify({
        title: 'Error al sortear grupos',
        titleColor: 'var(--error)',
        subtitle: err instanceof Error ? err.message : 'Error al sortear grupos',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--error)',
        duration: 1500,
      });
    } finally {
      setAutoGrouping(false);
    }
  };

  if (authLoading) return <BrandedLoading message="Preparando panel..." />;

  // Los spinners internos usarán dataLoading para feedback.
  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      <div className="w-full max-w-[900px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-accent)]">
          Configuracion del Assessment
        </h1>
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

      <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
        <Box className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            {dataLoading && staff.length === 0 ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              <h2 className="text-lg font-bold text-gray-900">Ajustes de grupo</h2>
            )}
            
            <div className="flex gap-2">
              {dataLoading && staff.length === 0 ? (
                <>
                  <Skeleton className="h-10 w-32 rounded-lg" />
                  <Skeleton className="h-10 w-32 rounded-lg" />
                </>
              ) : (
                <>
                  <Button variant="accent" onClick={() => setShowAutoGroupDropdown(true)}>
                    Crear y sortear
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditGroupsDropdown(true)}>
                    Editar grupos
                  </Button>
                </>
              )}
            </div>
          </div>

          {dataLoading && staff.length === 0 ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Administra la estructura de grupos del assessment. Puedes realizar un sorteo automático repartiendo impostores o gestionar integrantes manualmente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-gray-900">{groups.length}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Grupos Creados</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-gray-900">{participants.filter(p => !p.grupoId).length}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Participantes sin grupo</span>
                </div>
              </div>
            </div>
          )}
        </Box>
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
        basesList={bases}
        creatingStaff={creatingStaff}
        onSubmit={handleCreateStaff}
      />

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
        wide
        confirmLabel="Confirmar edicion"
        onConfirm={() => {
          notify({
            title: 'Grupos actualizados',
            titleColor: 'var(--color-accent)',
            subtitle: 'Los cambios en los grupos fueron guardados',
            subtitleColor: 'var(--color-muted)',
            borderColor: 'var(--color-accent)',
            duration: 2000,
          });
          setShowEditGroupsDropdown(false);
        }}
      >
        <EditGroupsForm
          groups={groups}
          participants={participants}
          assessmentId={assessmentId || 0}
          onRefresh={async () => {
            await loadParticipantsAndGroups();
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
        </div>

        <Box className="w-full !p-0 overflow-hidden">
          {dataLoading && staff.length === 0 ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" index={i} />
                  <Skeleton className="h-4 flex-1" index={i + 1} />
                  <Skeleton className="h-8 w-20 rounded-lg" index={i + 2} />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Para prop paginatedData, pasamos staff formateado si es necesario */}
              <ParticipantGrid
                paginatedData={paginatedData.map(s => ({
                  ID: s.ID,
                  Participante: s.Correo.split('@')[0],
                  Correo: s.Correo,
                  role: s.role,
                  Grupo: '', // Staff no tiene grupo
                  Calificacion_Promedio: null,
                  Estado: '',
                  Active: s.Active
                }))}
                onEdit={(item) => {
                  const s = staff.find(x => x.ID === item.ID);
                  if (s) {
                    setEditModal({
                      id: s.ID,
                      correo: s.Correo,
                      role: s.role,
                      active: s.Active
                    });
                    setOriginalData({ correo: s.Correo, role: s.role, active: s.Active });
                  }
                }}
              />
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex justify-center">
                  <ParticipantPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </Box>
      </div>

      {editModal && (
        <EditParticipantModal
          editModal={{
            ID: editModal.id,
            Participante: editModal.correo.split('@')[0],
            Correo: editModal.correo,
            role: editModal.role,
            Active: editModal.active,
            Grupo: '',
            Calificacion_Promedio: null,
            Estado: ''
          }}
          setEditModal={(val) => {
            if (!val) setEditModal(null);
            else setEditModal({ id: val.ID, correo: val.Correo, role: val.role, active: !!val.Active });
          }}
          onCancel={() => { setEditModal(null); setOriginalData(null); }}
          onUpdate={handleUpdateStaff}
        />
      )}

      <ConfirmModalComponent />
      <NotificationProvider />
    </div>
  );
};
