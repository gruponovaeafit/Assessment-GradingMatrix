import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export const useSuperAdminAuth = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null); // null = loading
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
            setIsSuperAdmin(Boolean(data.isSuperAdmin));
          } else if (mounted) {
            setIsSuperAdmin(false);
          }
        } else if (mounted) {
          setIsSuperAdmin(false);
        }
      } catch {
        if (mounted) setIsSuperAdmin(false);
      }
      if (mounted) setIsLoading(false);
    };

    checkAuth();
    return () => { mounted = false; };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsSuperAdmin(false);
    router.push("/auth/login");
  }, [router]);

  return { isSuperAdmin, isLoading, logout };
};
