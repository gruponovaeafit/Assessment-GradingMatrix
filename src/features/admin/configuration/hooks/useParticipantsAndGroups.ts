import { useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth/authFetch';
import { z } from 'zod';
import { StaffSchema, GroupSchema, type Staff, type Group, type Participant, ParticipantSchema } from '../schemas/configSchemas';

export function useParticipantsAndGroups(logout: () => void) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParticipantsAndGroups = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [staffRes, groupsRes, participantsRes] = await Promise.all([
        authFetch('/api/staff/list', {}, () => logout()),
        authFetch('/api/assessment/groups', {}, () => logout()),
        authFetch('/api/participante/list', {}, () => logout()),
      ]);

      if (staffRes.ok) {
        const result = await staffRes.json();
        const parsed = z.array(StaffSchema).safeParse(result);
        if (parsed.success) setStaff(parsed.data || []);
        else console.error('❌ Validation error (Staff):', parsed.error);
      }

      if (groupsRes.ok) {
        const result = await groupsRes.json();
        const parsed = z.array(GroupSchema).safeParse(result);
        if (parsed.success) setGroups(parsed.data || []);
      }

      if (participantsRes.ok) {
        const result = await participantsRes.json();
        const parsed = z.array(ParticipantSchema).safeParse(result);
        if (parsed.success) setParticipants(parsed.data || []);
      }
    } catch (err) {
      console.error('❌ Error loading participants/groups:', err);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return { staff, participants, groups, loading, loadParticipantsAndGroups };
}
