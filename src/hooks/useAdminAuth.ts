import { useAuth } from "@/lib/auth/AuthContext";

/**
 * useAdminAuth - Consumer hook for admin-related auth state.
 * Refactored to use centralized AuthContext.
 */
export const useAdminAuth = () => {
  const { 
    isAdmin, 
    isSuperAdmin, 
    assessmentId, 
    isLoading, 
    logout 
  } = useAuth();

  return { 
    isAdmin, 
    isSuperAdmin, 
    assessmentId, 
    isLoading, 
    logout 
  };
};
