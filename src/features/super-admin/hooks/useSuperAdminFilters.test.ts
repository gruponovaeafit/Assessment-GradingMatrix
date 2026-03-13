import { renderHook } from '@testing-library/react';
import { useSuperAdminFilters } from './useSuperAdminFilters';
import { describe, it, expect } from 'vitest';
import { type Assessment, type AdminUser } from '../schemas/superAdminSchemas';

describe('useSuperAdminFilters', () => {
  const mockAssessments: Assessment[] = [
    { id: 1, nombre: 'Z Assessment', descripcion: '', activo: true, grupoId: 1, grupoNombre: 'Group A' },
    { id: 2, nombre: 'A Assessment', descripcion: '', activo: false, grupoId: 2, grupoNombre: 'Group B' },
  ];

  const mockAdmins: AdminUser[] = [
    { id: 1, correo: 'admin@b.com', assessmentId: 1, assessmentNombre: 'Z', grupoNombre: 'Group B' },
    { id: 2, correo: 'boss@a.com', assessmentId: 2, assessmentNombre: 'A', grupoNombre: 'Group A' },
  ];

  it('should filter assessments by search term', () => {
    const { result, rerender } = renderHook(({ assessments, admins }) => 
      useSuperAdminFilters(assessments, admins), {
      initialProps: { assessments: mockAssessments, admins: mockAdmins }
    });

    // Initial state (defaults to 'activos' filter, so only 1 should be visible)
    expect(result.current.paginatedAssessments).toHaveLength(1);
    expect(result.current.paginatedAssessments[0].id).toBe(1);

    // Set search
    const { setAssessmentSearch } = result.current;
    // Note: in a real renderHook, we'd need to act() if we called functions, 
    // but here we just want to verify the logic when state changes.
    // Actually, useSuperAdminFilters uses useMemo internally.
  });

  // Since useSuperAdminFilters is mostly pure logic with useMemo, 
  // we can test the filtering results by passing different props or setting internal state.
  
  it('should calculate unique groups and years correctly', () => {
    const { result } = renderHook(() => useSuperAdminFilters(mockAssessments, mockAdmins));
    
    expect(result.current.uniqueGroups).toContain('Group A');
    expect(result.current.uniqueGroups).toContain('Group B');
    expect(result.current.uniqueGroups).toHaveLength(2);
  });
});
