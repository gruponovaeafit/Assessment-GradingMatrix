import { useState, useRef, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/auth/authFetch';
import { z } from 'zod';
import { ParticipantDashboardRowSchema, type ParticipantDashboardRow } from '../schemas/gestionSchemas';

export function useGestionData(logout: () => void) {
  const [data, setData] = useState<ParticipantDashboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (assessmentId?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const url = assessmentId
        ? `/api/dashboard/gh?assessmentId=${assessmentId}`
        : '/api/dashboard/gh';

      const response = await authFetch(
        url,
        { signal: controller.signal },
        () => logout()
      );

      if (controller.signal.aborted) return;

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Error al cargar los datos");
      }

      const parsed = z.array(ParticipantDashboardRowSchema).safeParse(result);
      if (!parsed.success) {
        console.error('❌ Validation Error:', parsed.error);
        throw new Error('Formato de datos inválido desde el servidor');
      }

      setData(parsed.data || []);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : "Error al cargar los datos";
      setError(message);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [logout]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { data, setData, loading, error, fetchData };
}