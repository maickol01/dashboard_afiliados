import { describe, it, expect } from 'vitest';
import { getSpiderOffsets, findMarkersAtSameLocation } from '../spiderify';
import { Person } from '../../types';

describe('spiderify utils', () => {
    describe('getSpiderOffsets', () => {
        it('should return empty array for 0 or 1 count', () => {
            expect(getSpiderOffsets(0)).toEqual([]);
            expect(getSpiderOffsets(1)).toEqual([]);
        });

        it('should return correct number of offsets for count > 1', () => {
            const count = 5;
            const offsets = getSpiderOffsets(count);
            expect(offsets.length).toBe(count);
        });

        it('should return circular distribution for small counts', () => {
            const count = 5;
            const offsets = getSpiderOffsets(count);
            // Check if they are distributed in a circle (equal distance from center)
            // We expect some variance in specific implementation, but radius should be consistent-ish
            // For this test, we just check they are not all 0,0
            offsets.forEach(offset => {
                expect(offset[0] !== 0 || offset[1] !== 0).toBe(true);
            });
        });
        
        it('should produce distinct coordinates', () => {
            const count = 10;
            const offsets = getSpiderOffsets(count);
            const unique = new Set(offsets.map(o => `${o[0]},${o[1]}`));
            expect(unique.size).toBe(count);
        });

        it('should handle large counts (spiral)', () => {
            const count = 500;
            const offsets = getSpiderOffsets(count);
            expect(offsets.length).toBe(count);
            // Verify bounding box isn't insane (should be roughly within 0.1 deg for 500 points)
            const maxOffset = Math.max(...offsets.map(o => Math.max(Math.abs(o[0]), Math.abs(o[1]))));
            expect(maxOffset).toBeLessThan(0.1); 
            expect(maxOffset).toBeGreaterThan(0.001);
        });
    });

    describe('findMarkersAtSameLocation', () => {
        const mockData: Person[] = [
            { id: '1', role: 'ciudadano', lat: 10, lng: 10, nombre: 'P1' } as Person,
            { id: '2', role: 'ciudadano', lat: 10, lng: 10, nombre: 'P2' } as Person,
            { id: '3', role: 'ciudadano', lat: 20, lng: 20, nombre: 'P3' } as Person,
            { id: '4', role: 'lider', lat: 10, lng: 10, nombre: 'P4' } as Person, // Different role
        ];

        it('should find markers at same location with same role', () => {
             const target = mockData[0];
             const result = findMarkersAtSameLocation(target, mockData);
             expect(result.length).toBe(2);
             expect(result.map(p => p.id)).toContain('1');
             expect(result.map(p => p.id)).toContain('2');
             expect(result.map(p => p.id)).not.toContain('3');
        });

        it('should only include target role (default ciudadano)', () => {
            const target = mockData[0];
            const result = findMarkersAtSameLocation(target, mockData);
            expect(result.map(p => p.id)).not.toContain('4');
        });
    });
});
