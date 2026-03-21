import { useState, useEffect, useCallback } from 'react';
import { type ClassificationRanges } from '../schemas/gestionSchemas';

const DEFAULT_RANGES: ClassificationRanges = {
  group: 4.7,
  interview: 4.0,
  discussion: 3.6,
};

function storageKey(assessmentId: string) {
  return `ghClassificationRanges_${assessmentId}`;
}

function loadRanges(assessmentId: string, normalize: (r: ClassificationRanges) => ClassificationRanges): ClassificationRanges {
  try {
    const stored = localStorage.getItem(storageKey(assessmentId));
    if (!stored) return DEFAULT_RANGES;
    const parsed = JSON.parse(stored) as Partial<ClassificationRanges>;
    if (
      typeof parsed.group === "number" &&
      typeof parsed.interview === "number" &&
      typeof parsed.discussion === "number"
    ) {
      return normalize(parsed as ClassificationRanges);
    }
  } catch {
    localStorage.removeItem(storageKey(assessmentId));
  }
  return DEFAULT_RANGES;
}

export function useClassificationRanges(assessmentId: string) {
  const normalizeRanges = useCallback((next: ClassificationRanges): ClassificationRanges => {
    const group = Math.max(0, Math.min(5, next.group));
    const interview = Math.max(0, Math.min(5, Math.min(next.interview, group)));
    const discussion = Math.max(3.6, Math.min(5, Math.min(next.discussion, interview)));
    return { group, interview, discussion };
  }, []);

  const [classificationRanges, setClassificationRanges] = useState<ClassificationRanges>(
    () => loadRanges(assessmentId, (r) => {
      const group = Math.max(0, Math.min(5, r.group));
      const interview = Math.max(0, Math.min(5, Math.min(r.interview, group)));
      const discussion = Math.max(3.6, Math.min(5, Math.min(r.discussion, interview)));
      return { group, interview, discussion };
    })
  );

  // Cuando cambia el assessment, carga sus rangos
  useEffect(() => {
    setClassificationRanges(loadRanges(assessmentId, normalizeRanges));
  }, [assessmentId, normalizeRanges]);

  // Persiste cuando cambian los rangos
  useEffect(() => {
    if (!assessmentId) return;
    localStorage.setItem(storageKey(assessmentId), JSON.stringify(classificationRanges));
  }, [classificationRanges, assessmentId]);

  const updateRanges = useCallback((next: ClassificationRanges) => {
    setClassificationRanges(normalizeRanges(next));
  }, [normalizeRanges]);

  return { classificationRanges, updateRanges };
}