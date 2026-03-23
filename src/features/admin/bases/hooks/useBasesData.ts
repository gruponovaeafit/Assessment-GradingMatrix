import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/auth/authFetch';
import { notify } from '@/components/UI/Notification';
import { type Base } from '../schemas/basesSchemas';

export const useBasesData = () => {
  const { isAdmin, isLoading: authLoading, logout } = useAdminAuth();
  const router = useRouter();
  
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if authenticated and we have an assessmentId
    if (authLoading || !isAdmin) return;

    let isMounted = true;

    const fetchBases = async () => {
      setLoading(true);
      try {
        const response = await authFetch(
          `/api/base/list`,
          {},
          () => logout()
        );

        if (!isMounted) return;

        if (response.status === 401) {
          // logout() is already called by authFetch callback
          return;
        }

        if (!response.ok) throw new Error('Error al cargar bases');
        const result = await response.json();
        setBases(result || []);
      } catch (err) {
        if (isMounted) {
          console.error(err);
          notify({
            title: 'Error',
            titleColor: 'var(--error)',
            subtitle: 'Error al cargar bases',
            subtitleColor: 'var(--color-muted)',
            borderColor: 'var(--error)',
            duration: 4000,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBases();

    return () => {
      isMounted = false;
    };
  }, [authLoading, isAdmin, logout]);

  return {
    bases,
    setBases,
    loading
  };
};
