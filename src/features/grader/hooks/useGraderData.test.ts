import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGraderData } from './useGraderData';

describe('useGraderData', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        // Mock localStorage
        const store: Record<string, string> = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value;
            }),
            clear: vi.fn(() => {
                Object.keys(store).forEach(key => delete store[key]);
            })
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should handle missing id_Calificador gracefully on mount', async () => {
        const { result } = renderHook(() => useGraderData());
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch initial data successfully on mount', async () => {
        localStorage.setItem('storedData', JSON.stringify({ id_Calificador: 1, id_base: 10 }));
        localStorage.setItem('authToken', 'fake_token');

        const mockGroups = [{ id: 100, nombre: 'Group A' }];
        const mockBase = { id: 10, nombre: 'Base 1' };
        const mockCalificador = { Correo: 'test@nova.edu' };

        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true, json: async () => mockGroups })
            .mockResolvedValueOnce({ ok: true, json: async () => mockBase })
            .mockResolvedValueOnce({ ok: true, json: async () => mockCalificador });

        const { result } = renderHook(() => useGraderData());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.groups).toEqual(mockGroups);
        expect(result.current.baseData).toEqual(mockBase);
        expect(result.current.nombreCalificador).toBe('test@nova.edu');
        expect(result.current.selectedGroupId).toBe('100'); // Auto-select first group
    });

    it('should handle API initial loading failures gracefully', async () => {
        localStorage.setItem('storedData', JSON.stringify({ id_Calificador: 1, id_base: 10 }));
        
        // Mock a failure response or rejection
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useGraderData());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.groups).toEqual([]);
        expect(result.current.baseData).toBeNull();
    });

    it('should fetch participants when group changes', async () => {
        localStorage.setItem('storedData', JSON.stringify({ id_Calificador: 1, id_base: 10 }));
        
        // Initial setup mock
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 100, nombre: 'Group A' }] }) // Groups
            .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 10, nombre: 'Base 1' }) }) // Base
            .mockResolvedValueOnce({ ok: true, json: async () => ({ Correo: 'test' }) }); // Calificador

        const { result } = renderHook(() => useGraderData());

        // Wait for initial load
        await waitFor(() => { expect(result.current.loading).toBe(false); });

        // Set up the next batch of mocks for the second useEffect (participants fetch)
        const mockParticipants = [{ ID: 1, Nombre: 'Student A', ID_Persona: 101 }];
        
        // We use mockImplementationOnce twice here so that when the effect for selectedGroupId
        // fires, it gets the right responses instead of whatever was left over.
        (global.fetch as any).mockImplementationOnce(async () => ({ ok: true, json: async () => mockParticipants }));
        (global.fetch as any).mockImplementationOnce(async () => ({ ok: true, json: async () => ({ alreadyGraded: true }) }));

        // Trigger the effect explicitly by simulating a user changing the group id
        act(() => result.current.setSelectedGroupId('200'));

        await waitFor(() => {
            expect(result.current.loadingParticipants).toBe(false);
            // Wait for it to be actually loaded
            expect(result.current.usuarios.length).toBeGreaterThan(0);
        });

        expect(result.current.usuarios).toEqual(mockParticipants);
        expect(result.current.alreadyGraded).toBe(true);
    });
});
