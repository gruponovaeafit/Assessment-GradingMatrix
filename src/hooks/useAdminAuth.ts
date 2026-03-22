import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
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
            setAssessmentId(data.assessmentId || null);
          } else if (mounted) {
            setIsAdmin(false);
            setIsSuperAdmin(false);
            setAssessmentId(null);
          }
        } else if (mounted) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAssessmentId(null);
        }
      } catch {
        if (mounted) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAssessmentId(null);
        }
      }
      if (mounted) setIsLoading(false);
    };

    checkAuth();
    return () => { mounted = false; };
  }, []);

  const loginAsAdmin = useCallback((superAdmin = false, assId: number | null = null) => {
    setIsAdmin(true);
    setIsSuperAdmin(superAdmin);
    setAssessmentId(assId);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setAssessmentId(null);
    router.push("/auth/login");
  }, [router]);

  return { isAdmin, isSuperAdmin, assessmentId, isLoading, loginAsAdmin, logout };
};
