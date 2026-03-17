import { useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth/authFetch';
import { z } from 'zod';
import { AssessmentSchema, type Assessment } from '../schemas/configSchemas';

export function useAssessments(logout: () => void) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(
        '/api/assessment/list?activo=true',
        {},
        () => logout()
      );
      if (!response.ok) throw new Error('Error al cargar assessments');
      const result = await response.json();
      
      const parsedResult = z.array(AssessmentSchema).safeParse(result);
      if (!parsedResult.success) {
        console.error('❌ Validation Error:', parsedResult.error);
        throw new Error('Formato de assessments inválido');
      }

      setAssessments(parsedResult.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return { assessments, loading, refreshAssessments };
}
