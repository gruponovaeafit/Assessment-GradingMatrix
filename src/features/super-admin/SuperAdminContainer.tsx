"use client";
import React, { useEffect, useState } from "react";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { Spinner } from "@/components/UI/Loading";
import { Button } from "@/components/UI/Button";
import { LogOut, LayoutDashboard, AlertCircle, RefreshCw, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { notify, NotificationProvider } from "@/components/UI/Notification";

// Feature Hooks
import { useSuperAdminData } from "./hooks/useSuperAdminData";
import { useSuperAdminFilters } from "./hooks/useSuperAdminFilters";
import { useSuperAdminActions } from "./hooks/useSuperAdminActions";
import { SuperAdminToolbar } from "./components/SuperAdminToolbar";
import { AssessmentList } from "./components/AssessmentList";
import { MassActionModal } from "./components/MassActionModal";
import { AssessmentModal } from "./components/AssessmentModal";
import { Pagination } from "@/features/admin/management/components/Pagination";

// Utilities
import { type Assessment } from "./schemas/superAdminSchemas";

export const SuperAdminContainer = () => {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading, logout } = useSuperAdminAuth();
  
  // Data Hook
  const {
    gruposEstudiantiles,
    assessments,
    setAssessments,
    admins,
    setAdmins,
    assessmentEdits,
    setAssessmentEdits,
    loading: dataLoading,
    error: dataError,
    fetchData
  } = useSuperAdminData(logout);

  // Filters Hook
  const {
    assessmentFilter, setAssessmentFilter,
    assessmentSearch, setAssessmentSearch,
    assessmentGroupFilter, setAssessmentGroupFilter,
    assessmentYearFilter, setAssessmentYearFilter,
    assessmentPage, setAssessmentPage,
    
    uniqueGroups,
    uniqueYears,
    paginatedAssessments,
    totalAssessmentPages,
  } = useSuperAdminFilters(assessments, admins);

  // Actions Hook
  const {
    loading: actionLoading,
    massAction,
    setMassAction,
    openBulkAssessmentPreview,
    handleUpdateAssessment,
  } = useSuperAdminActions(
    logout, 
    gruposEstudiantiles, 
    assessments, 
    setAssessments, 
    admins, 
    setAdmins, 
    {}, // adminEdits removed
    assessmentEdits
  );

  const [assessmentActivo, setAssessmentActivo] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);

  // Compute active assessments per group for the warning logic
  const activeAssessmentsByGroup = React.useMemo(() => {
    const map: Record<number, number> = {};
    assessments.forEach(a => {
      if (a.activo && a.grupoId) {
        map[a.grupoId] = a.id;
      }
    });
    return map;
  }, [assessments]);

  const handleSaveModal = async (data: any) => {
    try {
        const isUpdate = !!data.id;
        let response;
        if (isUpdate) {
            response = await fetch('/api/assessment/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId: data.id,
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    grupoEstudiantilId: data.grupoId,
                    activo: data.activo
                })
            });
            // Update admin if necessary... Note: changing admin via update is complex if there's no endpoint.
            // If the user meant to update the admin during Edit, we'd need another call to staff/update.
            // Assuming for now the update handles basic fields, and create handles full initialization.
        } else {
            response = await fetch('/api/assessment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    grupoEstudiantilId: data.grupoId,
                    activo: data.activo,
                    admin: data.admin // Send admin credentials if present
                })
            });
            // Atomic creation handles the admin creation internally now.
        }
        
        if (response.ok) {
            notify({
                title: isUpdate ? 'Assessment actualizado' : 'Assessment creado',
                titleColor: 'var(--color-accent)',
                subtitle: isUpdate 
                    ? 'El assessment se ha actualizado correctamente' 
                    : 'El assessment se ha creado correctamente',
                subtitleColor: 'var(--color-muted)',
                borderColor: 'var(--color-accent)',
                duration: 3000,
            });
            fetchData();
        } else {
            const err = await response.json();
            notify({
                title: 'Error',
                titleColor: 'var(--error)',
                subtitle: err.error || 'Error al guardar assessment',
                subtitleColor: 'var(--color-muted)',
                borderColor: 'var(--error)',
                duration: 4000,
            });
        }
    } catch (e) {
        notify({
            title: 'Error de red',
            titleColor: 'var(--error)',
            subtitle: 'No se pudo conectar con el servidor',
            subtitleColor: 'var(--color-muted)',
            borderColor: 'var(--error)',
            duration: 4000,
        });
    }
  };

  const handleDeleteModal = async (id: number, password?: string) => {
    try {
      const resp = await fetch('/api/assessment/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });

      const result = await resp.json();
      if (resp.ok) {
        notify({
            title: 'Assessment eliminado',
            titleColor: 'var(--color-accent)',
            subtitle: 'El assessment ha sido eliminado permanentemente',
            subtitleColor: 'var(--color-muted)',
            borderColor: 'var(--color-accent)',
            duration: 3000,
        });
        fetchData();
      } else {
        notify({
            title: 'Error al eliminar',
            titleColor: 'var(--error)',
            subtitle: result.error || 'No se pudo eliminar el assessment',
            subtitleColor: 'var(--color-muted)',
            borderColor: 'var(--error)',
            duration: 4000,
        });
        throw new Error(result.error); // Re-throw to keep the modal open if failed
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      if (err.message) throw err; // Propagate to stop modal close
    }
  };



  useEffect(() => {
    if (authLoading || !isSuperAdmin) return;
    fetchData();
  }, [authLoading, isSuperAdmin, fetchData]);

  if (authLoading || isSuperAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="custom" customColor="var(--color-accent)" />
        <p className="text-[color:var(--color-text)] text-xl mt-4 font-medium">Validando credenciales...</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error de Carga</h2>
        <p className="text-gray-500 max-w-md mb-6">{dataError}</p>
        <button
          onClick={() => fetchData()}
          className="px-6 py-2 bg-[color:var(--color-accent)] text-white rounded-xl font-bold hover:bg-[#5B21B6] transition shadow-lg shadow-purple-100"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      {/* Premium Header */}
      <header className="w-full max-w-[900px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-accent)]">
          Panel Admin de Assessment
        </h1>
        <Button
          onClick={logout}
          variant="error"
          className="group"
        >
          <span className="text-base">Cerrar Sesión</span>
          <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </header>

      <main className="w-full max-w-[900px] px-1 sm:px-2">
        {dataLoading && assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" color="custom" customColor="var(--color-accent)" />
            <p className="text-gray-400 mt-4 font-medium">Sincronizando base de datos...</p>
          </div>
        ) : (
          <div className="space-y-12 pb-20">
            <SuperAdminToolbar
              onBulkAssessments={() => openBulkAssessmentPreview(assessmentActivo)}
              loadingBulkAssessments={actionLoading}
              assessmentSearch={assessmentSearch}
              setAssessmentSearch={setAssessmentSearch}
              assessmentFilter={assessmentFilter}
              setAssessmentFilter={setAssessmentFilter}
              assessmentGroupFilter={assessmentGroupFilter}
              setAssessmentGroupFilter={setAssessmentGroupFilter}
              assessmentYearFilter={assessmentYearFilter}
              setAssessmentYearFilter={setAssessmentYearFilter}
              uniqueGroups={uniqueGroups}
              uniqueYears={uniqueYears}
              gruposEstudiantiles={gruposEstudiantiles}
            />

            {/* Assessments Section */}
            <section
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ring-1 ring-gray-100"
            >
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Gestión de Assessments</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Crea, actualiza o elimina assessments y sus administradores.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                        setEditingAssessment(null);
                        setIsModalOpen(true);
                    }}
                    variant="accent"
                    className="h-[42px]"
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Crear Assessment
                  </Button>
                  <Button
                    onClick={() => fetchData()}
                    variant="secondary"
                    className="h-[42px] min-w-[42px] px-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <AssessmentList
                assessments={paginatedAssessments}
                gruposEstudiantiles={gruposEstudiantiles}
                admins={admins}
                assessmentEdits={assessmentEdits}
                setAssessmentEdits={setAssessmentEdits}
                onUpdate={handleUpdateAssessment}
                openEditModal={(assessment) => {
                   setEditingAssessment(assessment);
                   setIsModalOpen(true);
                }}
                loading={actionLoading}
                handleSwitchAssessment={async (id) => {
                  try {
                    const response = await fetch('/api/auth/switch-assessment', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assessmentId: id }),
                    });
                    if (response.ok) router.push('/admin');
                    notify({
                        title: 'Error',
                        titleColor: 'var(--error)',
                        subtitle: 'Error al cambiar de assessment',
                        subtitleColor: 'var(--color-muted)',
                        borderColor: 'var(--error)',
                        duration: 3000,
                    });
                }
              } catch {
                notify({
                    title: 'Error',
                    titleColor: 'var(--error)',
                    subtitle: 'Error al cambiar de assessment',
                    subtitleColor: 'var(--color-muted)',
                    borderColor: 'var(--error)',
                    duration: 3000,
                });
              }
                }}
              />
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={assessmentPage}
                  totalPages={totalAssessmentPages}
                  setCurrentPage={setAssessmentPage}
                />
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Modals */}
      {massAction && (
        <MassActionModal 
          title={massAction.title}
          description={massAction.description}
          items={massAction.items}
          onConfirm={massAction.onConfirm}
          onCancel={() => setMassAction(null)}
        />
      )}

      <AssessmentModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         title={editingAssessment ? "Editar Assessment" : "Crear Assessment"}
         isEdit={!!editingAssessment}
         gruposEstudiantiles={gruposEstudiantiles}
         allAdmins={admins}
         activeAssessmentsByGroup={activeAssessmentsByGroup}
         initialAssessment={editingAssessment}
         onSave={handleSaveModal}
         onDelete={handleDeleteModal}
      />
      <NotificationProvider />
    </div>
  );
};

