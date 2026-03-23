import React from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useBasesData } from '../hooks/useBasesData';
import { useBasesActions } from '../hooks/useBasesActions';
import { BasesHeader } from './BasesHeader';
import { BasesList } from './BasesList';
import { BaseModal } from './BaseModal';
import { Button } from '@/components/UI/Button';
import { notify, NotificationProvider } from '@/components/UI/Notification';

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
    ConfirmModalComponent,
    isSubmitting,
  } = useBasesActions({
    bases,
    setBases,
  });

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      <BasesHeader
        onAdmin={() => router.push('/admin')}
        onLogout={() => {
          notify({
            title: 'Sesión Cerrada',
            titleColor: 'var(--error)',
            subtitle: 'Has cerrado sesión correctamente',
            subtitleColor: 'var(--color-muted)',
            borderColor: 'var(--error)',
            duration: 2500,
          });
          setTimeout(() => logout(), 800);
        }}
      />

      <div className="w-full max-w-[1200px] mb-6 flex justify-start">
        <Button variant="accent" onClick={handleOpenCreate}>
          + Crear Nueva Base
        </Button>
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
        isSubmitting={isSubmitting}
      />

      <ConfirmModalComponent />
      <NotificationProvider />
      </div>
      );
      };