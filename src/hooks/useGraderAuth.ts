import { useAuth } from "@/lib/auth/AuthContext";

/**
 * useGraderAuth - Consumer hook for grader-related auth state.
 * Refactored to use centralized AuthContext.
 */
export const useGraderAuth = () => {
  const { 
    isGrader, 
    isLoading, 
    logout: originalLogout 
  } = useAuth();

  const logout = async () => {
    localStorage.removeItem("storedData");
    await originalLogout();
  };

  return { 
    isGrader, 
    isLoading, 
    logout 
  };
};
