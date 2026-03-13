import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const ADMIN_KEY = "adminAuth";

interface AdminAuth {
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  timestamp: number;
}

const SESSION_DURATION = 8 * 60 * 60 * 1000;

/**
 * useSuperAdminAuth - Isolated hook for Super Admin authentication and authorization.
 * It specifically checks for the isSuperAdmin flag.
 */
export const useSuperAdminAuth = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null); // null = loading
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Check local state first (for superAdmin flag)
      const savedAuth = localStorage.getItem(ADMIN_KEY);

      if (savedAuth) {
        try {
          const authData: AdminAuth = JSON.parse(savedAuth);
          const now = Date.now();

          if (authData.isAdmin && authData.isSuperAdmin && (now - authData.timestamp < SESSION_DURATION)) {
            setIsSuperAdmin(true);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse adminAuth", e);
        }
      }

      // Validate session via cookie
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          // /api/auth/me returns role=admin, but we need localStorage for isSuperAdmin flag
          if (data.role === "admin" && savedAuth) {
            const authData: AdminAuth = JSON.parse(savedAuth);
            setIsSuperAdmin(Boolean(authData.isSuperAdmin));
          } else {
            setIsSuperAdmin(false);
          }
        } else {
          setIsSuperAdmin(false);
        }
      } catch {
        setIsSuperAdmin(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // No-op
    }
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem("storedData");
    localStorage.removeItem("authRole");
    setIsSuperAdmin(false);
    router.push("/auth/login");
  }, [router]);

  return {
    isSuperAdmin,
    isLoading,
    logout,
  };
};
