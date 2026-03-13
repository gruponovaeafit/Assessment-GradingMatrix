'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Spinner } from '@/components/UI/Loading';
import { BasesContainer } from '@/features/admin/bases/components/BasesContainer';

export default function BasesPage() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="custom" customColor="var(--color-accent)" />
        <p className="text-gray-600 text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  return <BasesContainer />;
}

