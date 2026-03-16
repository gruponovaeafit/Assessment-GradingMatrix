import { useState, useRef, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/auth/authFetch';
import { showToast } from '@/components/UI/Toast';
import { z } from 'zod';
import { CalificacionSchema, type Calificacion } from '../schemas/configSchemas';

export function useConfigData(logout: () => void) {
  const [data, setData] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (assessmentId: string) => {
    if (!assessmentId) {
      setError("assessmentId es obligatorio");
      showToast.error("assessmentId es obligatorio");
      return;
    }

    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const url = `/api/dashboard/config?assessmentId=${assessmentId}`;

      const response = await authFetch(
        url,
        { signal: controller.signal },
        () => logout()
      );

      if (controller.signal.aborted) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al cargar los datos');
      }

      const result = await response.json();

      // Runtime Validation
      const parsedResult = z.array(CalificacionSchema).safeParse(result);
      if (!parsedResult.success) {
        console.error('❌ Validation Error:', parsedResult.error);
        throw new Error('Formato de datos inválido desde el servidor');
      }

      setData(parsedResult.data);
      setLoading(false);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(message);
      showToast.error(message);
      setLoading(false);
    } finally {
      if (fetchAbortRef.current === controller) {
        fetchAbortRef.current = null;
      }
    }
  }, [logout]);

  useEffect(() => {
    return () => {
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
      }
    };
  }, []);

  return { data, setData, loading, error, fetchData };
}
