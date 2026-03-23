"use client";

import { BrandedLoading } from "@/components/UI/Loading";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  if (authLoading) {
    return <BrandedLoading message="Preparando panel de administración..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
