import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ADMIN_KEY = "adminAuth";
const TOKEN_KEY = "authToken";

interface AdminAuth {
  isAdmin: boolean;
  timestamp: number;
  token?: string;
}

// Tiempo de expiración de la sesión (8 horas en ms)
const SESSION_DURATION = 8 * 60 * 60 * 1000;

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = cargando
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem(ADMIN_KEY);
      const savedToken = localStorage.getItem(TOKEN_KEY);
      
      if (savedAuth) {
        const authData: AdminAuth = JSON.parse(savedAuth);
        const now = Date.now();
        
        // Verificar si la sesión no ha expirado
        if (authData.isAdmin && (now - authData.timestamp) < SESSION_DURATION) {
          setIsAdmin(true);
          setToken(savedToken);
        } else {
          // Sesión expirada, limpiar
          localStorage.removeItem(ADMIN_KEY);
          localStorage.removeItem(TOKEN_KEY);
          setIsAdmin(false);
          setToken(null);
        }
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Función para establecer admin auth (llamar después de login exitoso)
  const loginAsAdmin = (authToken?: string) => {
    const authData: AdminAuth = {
      isAdmin: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(ADMIN_KEY, JSON.stringify(authData));
    if (authToken) {
      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
    }
    setIsAdmin(true);
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("storedData");
    setIsAdmin(false);
    setToken(null);
    router.push("/auth/login");
  };

  // Función para proteger rutas - redirige si no es admin
  const requireAdmin = () => {
    if (!isLoading && !isAdmin) {
      router.push("/auth/login");
    }
  };

  // Función para obtener headers con token de autenticación
  const getAuthHeaders = (): HeadersInit => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return { isAdmin, isLoading, token, loginAsAdmin, logout, requireAdmin, getAuthHeaders };
};
