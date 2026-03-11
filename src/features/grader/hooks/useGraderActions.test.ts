import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGraderActions } from './useGraderActions';
import { showToast } from '@/components/UI/Toast';

vi.mock('@/components/UI/Toast', () => ({
    showToast: {
        error: vi.fn(),
        success: vi.fn(),
    }
}));

describe('useGraderActions', () => {
    const mockConfirm = vi.fn();
    const mockSetIsLoading = vi.fn();
    const mockSetAlreadyGraded = vi.fn();
    const mockSetGroups = vi.fn();
    const mockSetSelectedGroupId = vi.fn();
    const mockSetUsuarios = vi.fn();

    const defaultGroups = [{ id: 100, nombre: 'Group A', status: 'Incompleto', numEvaluadores: 2, participantesCount: 2 }];
    const defaultParticipants = [
        { ID: 1, Nombre: 'A', ID_Persona: 101, role: 'Participante', Identificacion: '123' },
        { ID: 2, Nombre: 'B', ID_Persona: 102, role: 'Participante', Identificacion: '124' }
    ] as any[];

    const setupHook = (
        usuarios = defaultParticipants,
        selectedGroupId = '100',
        alreadyGraded = false,
        groups = defaultGroups
    ) => {
        return renderHook(() => useGraderActions(
            usuarios,
            selectedGroupId,
            alreadyGraded,
            mockSetAlreadyGraded,
            groups,
            mockSetGroups,
            mockSetSelectedGroupId,
            mockSetUsuarios,
            mockConfirm,
            mockSetIsLoading
        ));
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn());
        const store: Record<string, string> = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        });
        localStorage.setItem('storedData', JSON.stringify({ id_Calificador: 1, id_base: 10 }));
    });

    describe('Navigation', () => {
        it('should correctly increment carouselIndex and wrap around', () => {
            const { result } = setupHook();
            
            expect(result.current.carouselIndex).toBe(0);
            act(() => result.current.goNext());
            expect(result.current.carouselIndex).toBe(1);
            act(() => result.current.goNext());
            expect(result.current.carouselIndex).toBe(0); // wraps
        });

        it('should correctly decrement carouselIndex and wrap around', () => {
            const { result } = setupHook();
            
            expect(result.current.carouselIndex).toBe(0);
            act(() => result.current.goPrev());
            expect(result.current.carouselIndex).toBe(1); // wraps to 2nd element
        });
    });

    describe('Grade Input Handling', () => {
        it('should update grades correctly', () => {
            const { result } = setupHook();
            
            act(() => {
                result.current.handleInputChange(1, 1, '4');
            });
            
            expect(result.current.calificaciones[1].Calificacion_1).toBe(4);
        });

        it('should ignore non-integer grade values like decimals or commas', () => {
            const { result } = setupHook();
            
            act(() => {
                result.current.handleInputChange(1, 1, '4'); // Object initialized
                result.current.handleInputChange(1, 2, '3,5');
                result.current.handleInputChange(1, 3, '3.5');
            });
            
            expect(result.current.calificaciones[1].Calificacion_2).toBeUndefined();
            expect(result.current.calificaciones[1].Calificacion_3).toBeUndefined();
        });

        it('should ignore invalid grade values outside 1-5', () => {
            const { result } = setupHook();
            
            act(() => {
                result.current.handleInputChange(1, 1, '6');
                result.current.handleInputChange(1, 2, '0');
            });
            
            expect(result.current.calificaciones[1]?.Calificacion_1).toBeUndefined();
            expect(result.current.calificaciones[1]?.Calificacion_2).toBeUndefined();
        });
    });

    describe('Submission', () => {
        it('should show error if not all participants have all 3 grades', async () => {
            const { result } = setupHook();
            
            // Missing all grades
            await act(async () => {
                await result.current.handleSubmit();
            });
            
            expect(showToast.error).toHaveBeenCalledWith('Todos los participantes deben tener las 3 calificaciones asignadas');
            expect(result.current.errores).toContain(1);
            expect(result.current.errores).toContain(2);
            expect(mockConfirm).not.toHaveBeenCalled();
        });

        it('should abort if already graded', async () => {
            const { result } = setupHook(defaultParticipants, '100', true);
            
            act(() => {
                result.current.handleInputChange(1, 1, '5');
                result.current.handleInputChange(1, 2, '5');
                result.current.handleInputChange(1, 3, '5');
                result.current.handleInputChange(2, 1, '5');
                result.current.handleInputChange(2, 2, '5');
                result.current.handleInputChange(2, 3, '5');
            });

            await act(async () => {
                await result.current.handleSubmit();
            });

            expect(mockConfirm).not.toHaveBeenCalled();
        });

        it('should abort if user cancels confirmation modal', async () => {
            const { result } = setupHook();
            mockConfirm.mockResolvedValueOnce(false);
            
            act(() => {
                result.current.handleInputChange(1, 1, '4');
                result.current.handleInputChange(1, 2, '4');
                result.current.handleInputChange(1, 3, '4');
                result.current.handleInputChange(2, 1, '4');
                result.current.handleInputChange(2, 2, '4');
                result.current.handleInputChange(2, 3, '4');
            });

            await act(async () => {
                await result.current.handleSubmit();
            });

            expect(mockConfirm).toHaveBeenCalled();
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should submit successfully if confirmed and payload is valid', async () => {
            const { result } = setupHook();
            mockConfirm.mockResolvedValueOnce(true);
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });
            
            act(() => {
                result.current.handleInputChange(1, 1, '5');
                result.current.handleInputChange(1, 2, '5');
                result.current.handleInputChange(1, 3, '5');
                result.current.handleInputChange(2, 1, '5');
                result.current.handleInputChange(2, 2, '5');
                result.current.handleInputChange(2, 3, '5');
            });

            await act(async () => {
                await result.current.handleSubmit();
            });

            expect(mockSetIsLoading).toHaveBeenCalledWith(true);
            expect(global.fetch).toHaveBeenCalledWith('/api/add-calificaciones', expect.any(Object));
            expect(showToast.success).toHaveBeenCalled();
            expect(mockSetGroups).toHaveBeenCalled(); // Should update groups list
        });

        it('should handle submission API errors gracefully', async () => {
            const { result } = setupHook();
            mockConfirm.mockResolvedValueOnce(true);
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Error del servidor' })
            });
            
            act(() => {
                result.current.handleInputChange(1, 1, '5');
                result.current.handleInputChange(1, 2, '5');
                result.current.handleInputChange(1, 3, '5');
                result.current.handleInputChange(2, 1, '5');
                result.current.handleInputChange(2, 2, '5');
                result.current.handleInputChange(2, 3, '5');
            });

            await act(async () => {
                await result.current.handleSubmit();
            });

            expect(showToast.error).toHaveBeenCalledWith('Error del servidor');
            expect(mockSetIsLoading).toHaveBeenCalledWith(false);
        });
    });
});
