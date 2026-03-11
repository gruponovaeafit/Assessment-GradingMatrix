import { useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth/authFetch';
import { z } from 'zod';
import { BaseSchema, type Base } from '../schemas/configSchemas';

export function useBases(getAuthHeaders: () => any, logout: () => void) {
  const [basesList, setBasesList] = useState<Base[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBases = useCallback(async (assessmentId: string) => {
    if (!assessmentId) {
      setBasesList([]);
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(
        `/api/base/list?assessmentId=${assessmentId}`,
        { headers: { ...getAuthHeaders() } },
        () => logout()
      );

      if (!res.ok) throw new Error('Error al cargar bases');
      const result = await res.json();
      
      const parsed = z.array(BaseSchema).safeParse(result);
      if (parsed.success) {
        setBasesList(parsed.data || []);
      }
    } catch (err) {
      console.error('❌ Error loading bases:', err);
      setBasesList([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, logout]);

  return { basesList, loading, loadBases };
}
