import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/auth/authFetch';
import { showToast } from '@/components/UI/Toast';
import { type Assessment, type Base } from '../schemas/basesSchemas';

export const useBasesData = () => {
  const { isAdmin, isLoading: authLoading, logout, getAuthHeaders } = useAdminAuth();
  const router = useRouter();
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');

  // Load assessments initially
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const fetchAssessments = async () => {
      try {
        const response = await authFetch(
          '/api/assessment/list',
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );

        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }

        if (!response.ok) throw new Error('Error al cargar assessments');
        const result = await response.json();
        setAssessments(result || []);
      } catch (err) {
        console.error(err);
        showToast.error('Error al cargar assessments');
      }
    };

    fetchAssessments();
  }, [authLoading, isAdmin, router, getAuthHeaders, logout]);

  // Load bases when selected assessment changes
  useEffect(() => {
    if (!selectedAssessment) {
      setBases([]);
      setLoading(false);
      return;
    }

    const fetchBases = async () => {
      setLoading(true);
      try {
        const response = await authFetch(
          `/api/base/list?assessmentId=${selectedAssessment}`,
          { headers: { ...getAuthHeaders() } },
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
  }, [selectedAssessment, authLoading, isAdmin, router, getAuthHeaders, logout]);

  return {
    assessments,
    bases,
    setBases,
    loading,
    selectedAssessment,
    setSelectedAssessment
  };
};
