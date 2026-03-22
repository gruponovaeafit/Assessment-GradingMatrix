import React from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useBasesData } from '../hooks/useBasesData';
import { useBasesActions } from '../hooks/useBasesActions';
import { BasesHeader } from './BasesHeader';
import { BasesList } from './BasesList';
import { BaseModal } from './BaseModal';

export const BasesContainer: React.FC = () => {
  const router = useRouter();
  const { logout } = useAdminAuth();
  
  const {
    bases,
    setBases,
    loading,
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
  });

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      <BasesHeader 
        onBack={() => router.push('/admin/configuration')} 
        onLogout={logout} 
      />
      <div className="w-full max-w-[1200px] mb-6 flex justify-end">
        <button
          onClick={handleOpenCreate}
          className="bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-6 py-2 rounded-lg font-medium transition shadow-md"
        >
          Nueva Base
        </button>
      </div>
      <BasesList
        bases={bases}
        loading={loading}
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
