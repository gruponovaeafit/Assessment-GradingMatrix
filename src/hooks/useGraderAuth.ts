import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const GRADER_KEY = "graderAuth";

interface GraderAuth {
  isGrader: boolean;
  timestamp: number;
}

// Session duration (8 hours in ms) — only for local state expiry
const SESSION_DURATION = 8 * 60 * 60 * 1000;

export const useGraderAuth = () => {
  const [isGrader, setIsGrader] = useState<boolean | null>(null); // null = loading
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check local state first
        const savedAuth = localStorage.getItem(GRADER_KEY);
        if (savedAuth) {
          const authData: GraderAuth = JSON.parse(savedAuth);
          const now = Date.now();
          if (authData.isGrader && now - authData.timestamp < SESSION_DURATION) {
            setIsGrader(true);
            setIsLoading(false);
            return;
          }
          localStorage.removeItem(GRADER_KEY);
        }

        // Validate session via cookie
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setIsGrader(data.role === "calificador");
        } else {
          setIsGrader(false);
        }
      } catch {
        setIsGrader(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Set grader auth after login — only stores role info locally, NOT the token
  const loginAsGrader = () => {
    const authData: GraderAuth = {
      isGrader: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(GRADER_KEY, JSON.stringify(authData));
    setIsGrader(true);
  };

  // Logout — server clears cookies
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // No-op
    }
    localStorage.removeItem(GRADER_KEY);
    localStorage.removeItem("storedData");
    localStorage.removeItem("authRole");
    setIsGrader(false);
    router.push("/auth/login");
  };

  return { isGrader, isLoading, loginAsGrader, logout };
};
