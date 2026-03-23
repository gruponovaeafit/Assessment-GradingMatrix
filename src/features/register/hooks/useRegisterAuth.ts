import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Auth guard for the register page.
 * Refactored to use centralized AuthContext.
 */
export const useRegisterAuth = () => {
  const router = useRouter();
  const { isRegistrar, isAdmin, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isRegistrar && !isAdmin) {
      router.push('/auth/login');
    }
  }, [isLoading, isRegistrar, isAdmin, router]);

  return { checkingAuth: isLoading, logout };
};
