import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const GRADER_KEY = "graderAuth";
const TOKEN_KEY = "authToken";

interface GraderAuth {
  isGrader: boolean;
  timestamp: number;
  token?: string;
}

// Session expiration time (8 hours in ms)
const SESSION_DURATION = 8 * 60 * 60 * 1000;

export const useGraderAuth = () => {
  const [isGrader, setIsGrader] = useState<boolean | null>(null); // null = loading
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem(GRADER_KEY);
      const savedToken = localStorage.getItem(TOKEN_KEY);
      
      if (savedAuth) {
        const authData: GraderAuth = JSON.parse(savedAuth);
        const now = Date.now();
        
        // Check if session hasn't expired
        if (authData.isGrader && (now - authData.timestamp) < SESSION_DURATION) {
          setIsGrader(true);
          setToken(savedToken);
        } else {
          // Session expired, clean up
          localStorage.removeItem(GRADER_KEY);
          localStorage.removeItem(TOKEN_KEY);
          setIsGrader(false);
          setToken(null);
        }
      } else {
        setIsGrader(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Function to set grader auth (call after successful login)
  const loginAsGrader = (authToken?: string) => {
    const authData: GraderAuth = {
      isGrader: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(GRADER_KEY, JSON.stringify(authData));
    if (authToken) {
      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
    }
    setIsGrader(true);
  };

  // Function to logout
  const logout = () => {
    localStorage.removeItem(GRADER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("storedData");
    localStorage.removeItem("authRole");
    setIsGrader(false);
    setToken(null);
    router.push("/auth/login");
  };

  // Function to protect routes - redirects if not grader
  const requireGrader = () => {
    if (!isLoading && !isGrader) {
      router.push("/auth/login");
    }
  };

  // Function to get headers with auth token
  const getAuthHeaders = (): HeadersInit => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      return storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
    }
    return {};
  };

  return { isGrader, isLoading, token, loginAsGrader, logout, requireGrader, getAuthHeaders };
};
