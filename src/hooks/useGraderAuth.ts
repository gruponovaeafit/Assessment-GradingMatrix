import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export const useGraderAuth = () => {
  const [isGrader, setIsGrader] = useState<boolean | null>(null); // null = loading
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setIsGrader(data.role === "calificador");
          }
        } else if (mounted) {
          setIsGrader(false);
        }
      } catch {
        if (mounted) setIsGrader(false);
      }
      if (mounted) setIsLoading(false);
    };

    checkAuth();
    return () => { mounted = false; };
  }, []);

  const loginAsGrader = useCallback(() => {
    setIsGrader(true);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("storedData");
    setIsGrader(false);
    router.push("/auth/login");
  }, [router]);

  return { isGrader, isLoading, loginAsGrader, logout };
};
