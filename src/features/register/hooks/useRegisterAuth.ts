import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Auth guard for the register page.
 * Validates session via /api/auth/me cookie-based endpoint.
 * Redirects to /auth/login if not authorized.
 */
export const useRegisterAuth = () => {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.role === 'registrador' || data.role === 'admin') {
            setCheckingAuth(false);
            return;
          }
        }
      } catch {
        // Auth check failed
      }
      router.push('/auth/login');
    };

    checkAuth();
  }, [router]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  }, [router]);

  return { checkingAuth, logout };
};