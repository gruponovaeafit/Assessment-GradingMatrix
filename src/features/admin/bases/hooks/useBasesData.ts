import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/auth/authFetch';
import { showToast } from '@/components/UI/Toast';
import { type Assessment, type Base } from '../schemas/basesSchemas';

export const useBasesData = () => {
  const { isAdmin, isLoading: authLoading, logout } = useAdminAuth();
  const router = useRouter();
  
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const fetchBases = async () => {
      setLoading(true);
      try {
        const response = await authFetch(
          `/api/base/list`,
          {},
          () => logout()
        );

        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }

        if (!response.ok) throw new Error('Error al cargar bases');
        const result = await response.json();
        setBases(result || []);
      } catch (err) {
        console.error(err);
        showToast.error('Error al cargar bases');
      } finally {
        setLoading(false);
      }
    };

    fetchBases();
  }, [authLoading, isAdmin, router, logout]);

  return {
    bases,
    setBases,
    loading
  };
};
