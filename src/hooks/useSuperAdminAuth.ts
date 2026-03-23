import { useAuth } from "@/lib/auth/AuthContext";

/**
 * useSuperAdminAuth - Consumer hook for super-admin-related auth state.
 * Refactored to use centralized AuthContext.
 */
export const useSuperAdminAuth = () => {
  const { 
    isSuperAdmin, 
    isLoading, 
    logout 
  } = useAuth();

  return { 
    isSuperAdmin, 
    isLoading, 
    logout 
  };
};
