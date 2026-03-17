import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.role === "admin") {
            setIsAdmin(true);
            setIsSuperAdmin(Boolean(data.isSuperAdmin));
          } else if (mounted) {
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
        } else if (mounted) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } catch {
        if (mounted) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      }
      if (mounted) setIsLoading(false);
    };

    checkAuth();
    return () => { mounted = false; };
  }, []);

  const loginAsAdmin = useCallback((superAdmin = false) => {
    setIsAdmin(true);
    setIsSuperAdmin(superAdmin);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsAdmin(false);
    setIsSuperAdmin(false);
    router.push("/auth/login");
  }, [router]);

  return { isAdmin, isSuperAdmin, isLoading, loginAsAdmin, logout };
};
