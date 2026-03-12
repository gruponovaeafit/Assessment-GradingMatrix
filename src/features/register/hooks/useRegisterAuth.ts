import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Auth guard for the register page.
 * Checks localStorage for token + role (registrador | admin).
 * Redirects to /auth/login if not authorized.
 */
export const useRegisterAuth = () => {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('authRole');

    if (!token || (role !== 'registrador' && role !== 'admin')) {
      router.push('/auth/login');
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  return { checkingAuth };
};
