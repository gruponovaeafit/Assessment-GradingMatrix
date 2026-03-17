import React from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useBasesData } from '../hooks/useBasesData';
import { useBasesActions } from '../hooks/useBasesActions';
import { BasesHeader } from './BasesHeader';
import { AssessmentSelector } from './AssessmentSelector';
import { BasesList } from './BasesList';
import { BaseModal } from './BaseModal';

export const BasesContainer: React.FC = () => {
  const router = useRouter();
  const { logout } = useAdminAuth();
  
  const {
    assessments,
    bases,
    setBases,
    loading,
    selectedAssessment,
    setSelectedAssessment,
  } = useBasesData();

  const {
    showModal,
    editingBase,
    formData,
    setFormData,
    resetForm,
    handleOpenCreate,
    handleOpenEdit,
    handleSubmit,
    handleDelete,
    setShowModal,
  } = useBasesActions({
    bases,
    setBases,
    selectedAssessment,
  });

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      <BasesHeader 
        onBack={() => router.push('/admin/configuration')} 
        onLogout={logout} 
      />
      <AssessmentSelector
        assessments={assessments}
        selectedAssessment={selectedAssessment}
        onAssessmentChange={setSelectedAssessment}
        onOpenCreate={handleOpenCreate}
      />
      <BasesList
        bases={bases}
        loading={loading}
        selectedAssessment={selectedAssessment}
        onOpenEdit={handleOpenEdit}
        onDelete={handleDelete}
      />
      <BaseModal
        showModal={showModal}
        editingBase={editingBase}
        formData={formData}
        setFormData={setFormData}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
