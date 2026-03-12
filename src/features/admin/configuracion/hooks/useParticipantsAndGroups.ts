import { useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth/authFetch';
import { z } from 'zod';
import { ParticipantSchema, GroupSchema, type Participant, type Group } from '../schemas/configSchemas';

export function useParticipantsAndGroups(logout: () => void) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const loadParticipantsAndGroups = useCallback(async (assessmentId: string) => {
    if (!assessmentId) {
      setParticipants([]);
      setGroups([]);
      return;
    }

    setLoading(true);
    try {
      const [participantsRes, groupsRes] = await Promise.all([
        authFetch(
          `/api/participante/list?assessmentId=${assessmentId}`,
          {},
          () => logout()
        ),
        authFetch(
          `/api/assessment/groups?assessmentId=${assessmentId}`,
          {},
          () => logout()
        ),
      ]);

      if (participantsRes.ok) {
        const result = await participantsRes.json();
        const parsed = z.array(ParticipantSchema).safeParse(result);
        if (parsed.success) setParticipants(parsed.data || []);
      }

      if (groupsRes.ok) {
        const result = await groupsRes.json();
        const parsed = z.array(GroupSchema).safeParse(result);
        if (parsed.success) setGroups(parsed.data || []);
      }
    } catch (err) {
      console.error('❌ Error loading participants/groups:', err);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return { participants, groups, loading, loadParticipantsAndGroups };
}
