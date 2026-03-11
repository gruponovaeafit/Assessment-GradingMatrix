"use client";

import React, { useEffect, useState } from "react";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { Spinner } from "@/components/UI/Loading";
import { LogOut, LayoutDashboard, AlertCircle } from "lucide-react";

// Feature Hooks
import { useSuperAdminData } from "./hooks/useSuperAdminData";
import { useSuperAdminFilters } from "./hooks/useSuperAdminFilters";
import { useSuperAdminActions } from "./hooks/useSuperAdminActions";

// Feature Components
import { SuperAdminToolbar } from "./components/SuperAdminToolbar";
import { AssessmentList } from "./components/AssessmentList";
import { AdminUserList } from "./components/AdminUserList";
import { MassActionModal } from "./components/MassActionModal";
import { Pagination } from "@/features/admin/gestion/components/Pagination"; // Reusing the pagination component

// Utilities
import { handleExportAdminsCSV } from "./utils/superAdminUtils";

export const SuperAdminContainer = () => {
  const { isSuperAdmin, isLoading: authLoading, logout, getAuthHeaders, requireSuperAdmin } = useSuperAdminAuth();
  
  // Data Hook
  const {
    gruposEstudiantiles,
    assessments,
    setAssessments,
    admins,
    setAdmins,
    adminEdits,
    setAdminEdits,
    assessmentEdits,
    setAssessmentEdits,
    loading: dataLoading,
    error: dataError,
    fetchData
  } = useSuperAdminData(getAuthHeaders, logout);

  // Filters Hook
  const {
    assessmentFilter, setAssessmentFilter,
    assessmentSearch, setAssessmentSearch,
    assessmentGroupFilter, setAssessmentGroupFilter,
    assessmentYearFilter, setAssessmentYearFilter,
    assessmentPage, setAssessmentPage,
    
    adminFilter, setAdminFilter,
    adminSearch, setAdminSearch,
    adminGroupFilter, setAdminGroupFilter,
    adminYearFilter, setAdminYearFilter,
    adminPage, setAdminPage,

    uniqueGroups,
    uniqueYears,
    paginatedAssessments,
    paginatedAdmins,
    totalAssessmentPages,
    totalAdminPages
  } = useSuperAdminFilters(assessments, admins);

  // Actions Hook
  const {
    loading: actionLoading,
    massAction,
    setMassAction,
    openBulkAssessmentPreview,
    openBulkAdminPreview,
    handleUpdateAssessment,
    handleUpdateAdmin
  } = useSuperAdminActions(
    getAuthHeaders, 
    logout, 
    gruposEstudiantiles, 
    assessments, 
    setAssessments, 
    admins, 
    setAdmins, 
    adminEdits, 
    assessmentEdits
  );

  const [assessmentActivo, setAssessmentActivo] = useState(true);

  useEffect(() => {
    requireSuperAdmin();
  }, [requireSuperAdmin]);

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
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[color:var(--color-accent)] rounded-lg flex items-center justify-center shadow-lg shadow-purple-200">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Super Admin Panel</h1>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error hover:bg-error hover:text-white rounded-xl text-sm font-bold transition-all group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {dataLoading && assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" color="custom" customColor="var(--color-accent)" />
            <p className="text-gray-400 mt-4 font-medium">Sincronizando base de datos...</p>
          </div>
        ) : (
          <>
            <SuperAdminToolbar 
              onBulkAssessments={() => openBulkAssessmentPreview(assessmentActivo)}
              onBulkAdmins={openBulkAdminPreview}
              onExportAdmins={() => handleExportAdminsCSV(admins)}
              loadingBulkAssessments={actionLoading}
              loadingBulkAdmins={actionLoading}
              assessmentSearch={assessmentSearch}
              setAssessmentSearch={setAssessmentSearch}
              assessmentFilter={assessmentFilter}
              setAssessmentFilter={setAssessmentFilter}
              assessmentGroupFilter={assessmentGroupFilter}
              setAssessmentGroupFilter={setAssessmentGroupFilter}
              assessmentYearFilter={assessmentYearFilter}
              setAssessmentYearFilter={setAssessmentYearFilter}
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              adminFilter={adminFilter}
              setAdminFilter={setAdminFilter}
              adminGroupFilter={adminGroupFilter}
              setAdminGroupFilter={setAdminGroupFilter}
              adminYearFilter={adminYearFilter}
              setAdminYearFilter={setAdminYearFilter}
              uniqueGroups={uniqueGroups}
              uniqueYears={uniqueYears}
              gruposEstudiantiles={gruposEstudiantiles}
            />

            {/* Assessments Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  Assessments
                  <span className="text-sm font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{paginatedAssessments.length}</span>
                </h2>
              </div>
              <AssessmentList 
                assessments={paginatedAssessments}
                gruposEstudiantiles={gruposEstudiantiles}
                assessmentEdits={assessmentEdits}
                setAssessmentEdits={setAssessmentEdits}
                onUpdate={handleUpdateAssessment}
                loading={actionLoading}
              />
              <div className="mt-6 flex justify-center">
                <Pagination 
                  currentPage={assessmentPage}
                  totalPages={totalAssessmentPages}
                  setCurrentPage={setAssessmentPage}
                />
              </div>
            </section>

            {/* Admins Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  Administradores
                  <span className="text-sm font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{paginatedAdmins.length}</span>
                </h2>
              </div>
              <AdminUserList 
                admins={paginatedAdmins}
                adminEdits={adminEdits}
                setAdminEdits={setAdminEdits}
                onUpdate={handleUpdateAdmin}
                loading={actionLoading}
              />
              <div className="mt-6 flex justify-center">
                <Pagination 
                  currentPage={adminPage}
                  totalPages={totalAdminPages}
                  setCurrentPage={setAdminPage}
                />
              </div>
            </section>
          </>
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
    </div>
  );
};
