import { describe, it, expect, vi } from 'vitest';
import { 
  shortHash, 
  buildAdminEmail, 
  getBulkAssessmentPayloads, 
  getBulkAdminPayloads 
} from './superAdminUtils';
import { type Assessment, type AdminUser, type GrupoEstudiantil } from '../schemas/superAdminSchemas';

describe('superAdminUtils', () => {
  describe('shortHash', () => {
    it('should generate a 6-character deterministic hash', () => {
      const input = 'test-input';
      const hash1 = shortHash(input);
      const hash2 = shortHash(input);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(6);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = shortHash('input-1');
      const hash2 = shortHash('input-2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = shortHash('');
      expect(hash).toHaveLength(6);
    });
  });

  describe('buildAdminEmail', () => {
    const mockAssessment: Assessment = {
      id: 123,
      nombre: 'Test Assessment',
      descripcion: 'Desc',
      activo: true,
      grupoId: 1,
      grupoNombre: 'Grupo Nova'
    };

    it('should build a valid internal email', () => {
      const email = buildAdminEmail('123', mockAssessment);
      // Format: {hash}_123@grupo_nova.agm
      expect(email).toMatch(/^[a-z0-9]{6}_123@grupo_nova\.agm$/);
    });

    it('should handle assessments without grupoNombre', () => {
      const assessmentNoGroup = { ...mockAssessment, grupoNombre: null };
      const email = buildAdminEmail('123', assessmentNoGroup as any);
      expect(email).toContain('@test_assessment.agm');
    });

    it('should sanitize domain slugs', () => {
      const assessmentSpecial = { ...mockAssessment, grupoNombre: 'Grupo @#$% Special!!!' };
      const email = buildAdminEmail('123', assessmentSpecial as any);
      expect(email).toContain('@grupo_special.agm');
    });

    it('should handle missing assessment gracefully', () => {
      const email = buildAdminEmail('456');
      expect(email).toMatch(/^[a-z0-9]{6}_456@grupo\.agm$/);
    });
  });

  describe('getBulkAssessmentPayloads', () => {
    const mockGrupos: GrupoEstudiantil[] = [
      { id: 1, nombre: 'Alpha' },
      { id: 2, nombre: 'Beta' }
    ];

    it('should generate payloads for all groups', () => {
      const payloads = getBulkAssessmentPayloads(mockGrupos, []);
      expect(payloads).toHaveLength(2);
      expect(payloads[0].grupoEstudiantilId).toBe(1);
      expect(payloads[0].nombre).toContain('Assessment_Alpha_');
    });

    it('should mark exists as true if assessment already exists', () => {
      const now = new Date();
      const year = now.getFullYear();
      const semester = now.getMonth() < 6 ? 1 : 2;
      const existingName = `Assessment_Alpha_${year}_S${semester}`;
      
      const existing: Assessment[] = [{
        id: 10,
        nombre: existingName,
        descripcion: '',
        activo: true,
        grupoId: 1,
        grupoNombre: 'Alpha'
      }];

      const payloads = getBulkAssessmentPayloads(mockGrupos, existing);
      expect(payloads.find(p => p.grupoEstudiantilId === 1)?.exists).toBe(true);
      expect(payloads.find(p => p.grupoEstudiantilId === 2)?.exists).toBe(false);
    });

    it('should sanitize group names for assessment names', () => {
      const specialGrupos: GrupoEstudiantil[] = [{ id: 3, nombre: 'Group With Spaces & Symbols!' }];
      const payloads = getBulkAssessmentPayloads(specialGrupos, []);
      expect(payloads[0].nombre).toContain('Assessment_Group_With_Spaces_Symbols_');
    });
  });

  describe('getBulkAdminPayloads', () => {
    const mockAssessments: Assessment[] = [
      { id: 1, nombre: 'A1', descripcion: '', activo: true, grupoId: 1, grupoNombre: 'G1' },
      { id: 2, nombre: 'A2', descripcion: '', activo: true, grupoId: 2, grupoNombre: 'G2' }
    ];

    it('should generate admin emails for active assessments', () => {
      const payloads = getBulkAdminPayloads(mockAssessments, []);
      expect(payloads).toHaveLength(2);
      expect(payloads[0].correo).toContain('_1@g1.agm');
    });

    it('should mark exists as true if admin email already exists', () => {
      const payloadsPre = getBulkAdminPayloads([mockAssessments[0]], []);
      const existingEmail = payloadsPre[0].correo;

      const existingAdmins: AdminUser[] = [{
        id: 100,
        correo: existingEmail,
        assessmentId: 1,
        assessmentNombre: 'A1',
        grupoNombre: 'G1'
      }];

      const payloads = getBulkAdminPayloads(mockAssessments, existingAdmins);
      expect(payloads.find(p => p.assessment.id === 1)?.exists).toBe(true);
      expect(payloads.find(p => p.assessment.id === 2)?.exists).toBe(false);
    });
  });
});
