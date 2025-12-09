import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ADMIN_KEY = "adminAuth";

interface AdminAuth {
  isAdmin: boolean;
  timestamp: number;
}

// Tiempo de expiración de la sesión (8 horas en ms)
const SESSION_DURATION = 8 * 60 * 60 * 1000;

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = cargando
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem(ADMIN_KEY);
      
      if (savedAuth) {
        const authData: AdminAuth = JSON.parse(savedAuth);
        const now = Date.now();
        
        // Verificar si la sesión no ha expirado
        if (authData.isAdmin && (now - authData.timestamp) < SESSION_DURATION) {
          setIsAdmin(true);
        } else {
          // Sesión expirada, limpiar
          localStorage.removeItem(ADMIN_KEY);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Función para establecer admin auth (llamar después de login exitoso)
  const loginAsAdmin = () => {
    const authData: AdminAuth = {
      isAdmin: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(ADMIN_KEY, JSON.stringify(authData));
    setIsAdmin(true);
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem(ADMIN_KEY);
    setIsAdmin(false);
    router.push("/auth/login");
  };

  // Función para proteger rutas - redirige si no es admin
  const requireAdmin = () => {
    if (!isLoading && !isAdmin) {
      router.push("/auth/login");
    }
  };

  return { isAdmin, isLoading, loginAsAdmin, logout, requireAdmin };
};
