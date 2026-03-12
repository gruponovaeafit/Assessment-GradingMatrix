import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const ADMIN_KEY = "adminAuth";
const TOKEN_KEY = "authToken";

interface AdminAuth {
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  timestamp: number;
  token?: string;
}

const SESSION_DURATION = 8 * 60 * 60 * 1000;

/**
 * useSuperAdminAuth - Isolated hook for Super Admin authentication and authorization.
 * It specifically checks for the isSuperAdmin flag.
 */
export const useSuperAdminAuth = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null); // null = loading
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem(ADMIN_KEY);
      const savedToken = localStorage.getItem(TOKEN_KEY);

      if (savedAuth) {
        try {
          const authData: AdminAuth = JSON.parse(savedAuth);
          const now = Date.now();

          // Only valid if isAdmin is true AND isSuperAdmin is true AND not expired
          if (authData.isAdmin && authData.isSuperAdmin && (now - authData.timestamp < SESSION_DURATION)) {
            setIsSuperAdmin(true);
            setToken(savedToken);
          } else {
            setIsSuperAdmin(false);
            setToken(null);
          }
        } catch (e) {
          console.error("Failed to parse adminAuth", e);
          setIsSuperAdmin(false);
        }
      } else {
        setIsSuperAdmin(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = useCallback(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${storedToken}` },
      }).catch(() => {});
    }
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("storedData");
    localStorage.removeItem("authRole");
    setIsSuperAdmin(false);
    setToken(null);
    router.push("/auth/login");
  }, [router]);

  const requireSuperAdmin = useCallback(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push("/auth/login");
    }
  }, [isLoading, isSuperAdmin, router]);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
    return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
  }, [token]);

  return {
    isSuperAdmin,
    isLoading,
    token,
    logout,
    requireSuperAdmin,
    getAuthHeaders,
  };
};
