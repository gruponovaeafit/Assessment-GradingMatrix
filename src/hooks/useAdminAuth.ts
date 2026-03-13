import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AdminAuth {
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  timestamp: number;
}

const ADMIN_KEY = "adminAuth";

// Session duration (8 hours in ms) — only for local state expiry
const SESSION_DURATION = 8 * 60 * 60 * 1000;

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check local state first (for role/superAdmin info)
        const savedAuth = localStorage.getItem(ADMIN_KEY);
        if (savedAuth) {
          const authData: AdminAuth = JSON.parse(savedAuth);
          const now = Date.now();
          if (authData.isAdmin && now - authData.timestamp < SESSION_DURATION) {
            setIsAdmin(true);
            setIsSuperAdmin(Boolean(authData.isSuperAdmin));
            setIsLoading(false);
            return;
          }
          // Expired local state, clear it
          localStorage.removeItem(ADMIN_KEY);
        }

        // Validate session via cookie-based endpoint
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.role === "admin") {
            setIsAdmin(true);
            // Note: superAdmin info isn't in JWT, so we check localStorage
            setIsSuperAdmin(Boolean(savedAuth && JSON.parse(savedAuth).isSuperAdmin));
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } catch {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Set admin auth after login — only stores role info locally, NOT the token
  const loginAsAdmin = useCallback((superAdmin = false) => {
    const authData: AdminAuth = {
      isAdmin: true,
      isSuperAdmin: superAdmin,
      timestamp: Date.now(),
    };
    localStorage.setItem(ADMIN_KEY, JSON.stringify(authData));
    setIsAdmin(true);
    setIsSuperAdmin(superAdmin);
  }, []);

  // Logout — server clears cookies
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // No-op: local logout continues even if request fails
    }
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem("storedData");
    localStorage.removeItem("authRole");
    setIsAdmin(false);
    setIsSuperAdmin(false);
    router.push("/auth/login");
  }, [router]);

  return {
    isAdmin,
    isSuperAdmin,
    isLoading,
    loginAsAdmin,
    logout,
  };
};
