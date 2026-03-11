import { describe, it, expect } from 'vitest';
import { getInitials } from './graderUtils';

describe('graderUtils', () => {
    describe('getInitials', () => {
        it('should compute correct initials for a standard two-word name', () => {
            expect(getInitials('John Doe')).toBe('JD');
        });

        it('should compute correct initial for a single-word name', () => {
            expect(getInitials('John')).toBe('J');
        });

        it('should handle extra spaces and trim correctly', () => {
            expect(getInitials('  John   Doe  ')).toBe('JD');
        });

        it('should take only the first two words if there are more than two', () => {
            expect(getInitials('John Doe Middle Last')).toBe('JD');
        });

        it('should return NA for empty strings or strings with only whitespace', () => {
            expect(getInitials('')).toBe('NA');
            expect(getInitials('   ')).toBe('NA');
        });

        it('should return NA for non-string inputs', () => {
            expect(getInitials(null)).toBe('NA');
            expect(getInitials(undefined)).toBe('NA');
            expect(getInitials(123 as any)).toBe('NA');
        });
    });
});
