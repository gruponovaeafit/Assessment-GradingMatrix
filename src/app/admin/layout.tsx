"use client";

import { Spinner } from "@/components/UI/Loading";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="custom" customColor="var(--color-accent)" />
        <p className="text-[color:var(--color-text)] text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  return <>{children}</>;
}
