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
import { Skeleton } from '@/components/UI/Loading';

export const BasesContainer: React.FC = () => {
  const router = useRouter();
  const { logout } = useAdminAuth();


  const {
    bases,
    setBases,
    loading: dataLoading,
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
        {dataLoading && bases.length === 0 ? (
          <Skeleton className="h-10 w-44 rounded-lg" />
        ) : (
          <Button variant="accent" onClick={handleOpenCreate}>
            + Crear Nueva Base
          </Button>
        )}
      </div>

      {dataLoading && bases.length === 0 ? (
        <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-12 w-12 rounded-xl" index={i} />
                <Skeleton className="h-8 w-20 rounded-lg" index={i + 1} />
              </div>
              <Skeleton className="h-6 w-3/4" index={i + 2} />
              <Skeleton className="h-4 w-full" index={i + 3} />
              <Skeleton className="h-4 w-5/6" index={i + 4} />
              <div className="pt-4 border-t border-gray-50 flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-xl" index={i + 5} />
                <Skeleton className="h-10 flex-1 rounded-xl" index={i + 6} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <BasesList
          bases={bases}
          loading={dataLoading}
          onOpenEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

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