import { useState, useEffect, useCallback } from 'react';
import { type ClassificationRanges } from '../schemas/gestionSchemas';

const RANGES_STORAGE_KEY = "ghClassificationRanges";

const DEFAULT_RANGES: ClassificationRanges = {
  group: 4.7,
  interview: 4.0,
  discussion: 3.6,
};

export function useClassificationRanges() {
  const [classificationRanges, setClassificationRanges] = useState<ClassificationRanges>(DEFAULT_RANGES);

  const normalizeRanges = useCallback((next: ClassificationRanges): ClassificationRanges => {
    const group = Math.max(0, Math.min(5, next.group));
    const interview = Math.max(0, Math.min(5, Math.min(next.interview, group)));
    const discussion = Math.max(3.6, Math.min(5, Math.min(next.discussion, interview)));
    return { group, interview, discussion };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(RANGES_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<ClassificationRanges>;
      if (
        typeof parsed.group === "number" &&
        typeof parsed.interview === "number" &&
        typeof parsed.discussion === "number"
      ) {
        setClassificationRanges(normalizeRanges(parsed as ClassificationRanges));
      }
    } catch {
      localStorage.removeItem(RANGES_STORAGE_KEY);
    }
  }, [normalizeRanges]);

  useEffect(() => {
    localStorage.setItem(RANGES_STORAGE_KEY, JSON.stringify(classificationRanges));
  }, [classificationRanges]);

  const updateRanges = (next: ClassificationRanges) => {
    setClassificationRanges(normalizeRanges(next));
  };

  return { classificationRanges, updateRanges };
}
