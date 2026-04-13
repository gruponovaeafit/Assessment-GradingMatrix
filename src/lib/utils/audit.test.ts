import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAudit, AuditActions } from './audit';
import { supabase } from '@/lib/supabase/server';

// Mock de Supabase para evitar llamadas reales a la DB durante los tests
const mockInsert = vi.fn().mockReturnValue({ error: null });
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

vi.mock('@/lib/supabase/server', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

describe('logAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ error: null });
  });

  it('debe llamar a supabase.insert con los datos correctos incluyendo JSONB', async () => {
    const mockLog = {
      accion: AuditActions.STAFF_CREATED,
      usuario_id: 1,
      usuario_email: 'admin@test.com',
      detalles: { target: 'new@staff.com', role: 'calificador' },
      ip: '127.0.0.1',
      user_agent: 'Vitest',
    };

    await logAudit(mockLog);

    expect(mockFrom).toHaveBeenCalledWith('AuditLogs');
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      Accion: mockLog.accion,
      UsuarioID: mockLog.usuario_id,
      UsuarioEmail: mockLog.usuario_email,
      Detalles: mockLog.detalles,
      IP: mockLog.ip,
      UserAgent: mockLog.user_agent,
    }));
  });

  it('no debe lanzar excepciones si la base de datos falla (graceful failure)', async () => {
    mockInsert.mockReturnValueOnce({
      error: { message: 'Database unreachable', code: 'P0001' } as any,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(logAudit({
      accion: 'TEST',
      usuario_id: 0,
      usuario_email: 'sys@test.com',
      detalles: {}
    })).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
