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
        if (Array.isArray(result)) {
          const parsed = result.map(i => StaffSchema.safeParse(i));
          const valid = parsed.filter(p => p.success).map(p => (p as any).data as Staff);
          setStaff(valid);
          if (valid.length < result.length) {
            console.error('❌ Some Staff items failed validation:', parsed.filter(p => !p.success));
          }
        }
      }

      if (groupsRes.ok) {
        const result = await groupsRes.json();
        if (Array.isArray(result)) {
          const parsed = result.map(i => GroupSchema.safeParse(i));
          const valid = parsed.filter(p => p.success).map(p => (p as any).data as Group);
          setGroups(valid);
        }
      }

      if (participantsRes.ok) {
        const result = await participantsRes.json();
        if (Array.isArray(result)) {
          const parsed = result.map(i => ParticipantSchema.safeParse(i));
          const valid = parsed.filter(p => p.success).map(p => (p as any).data as Participant);
          setParticipants(valid);
        }
      }
    } catch (err) {
      console.error('❌ Error loading participants/groups:', err);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return { staff, participants, groups, loading, loadParticipantsAndGroups };
}
