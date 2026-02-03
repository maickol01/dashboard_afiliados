import { Person } from '../types';

/**
 * Calculates offsets for a spiderify/starbust effect.
 * Returns an array of [lngOffset, latOffset] pairs.
 * 
 * @param count Number of points to distribute
 * @param baseRadius Radius in degrees (approx). Default 0.0003 (~30m)
 */
export const getSpiderOffsets = (count: number, baseRadius: number = 0.0003): number[][] => {
    if (count <= 1) return [];

    const offsets: number[][] = [];
    const twoPi = Math.PI * 2;
    // Start at top
    const startAngle = Math.PI / 2;

    for (let i = 0; i < count; i++) {
        const angle = (i * twoPi) / count + startAngle;
        const x = Math.cos(angle) * baseRadius;
        const y = Math.sin(angle) * baseRadius;
        offsets.push([x, y]);
    }
    
    return offsets;
};

/**
 * Finds all markers that share the same location as the target.
 * Matches role as well.
 */
export const findMarkersAtSameLocation = (
    target: Person, 
    allData: Person[],
    precision: number = 0.000001
): Person[] => {
    if (target.lat == null || target.lng == null) return [];

    return allData.filter(p => {
        // Strict role matching - only group same types
        if (p.role !== target.role) return false;
        
        if (p.lat == null || p.lng == null) return false;
        
        const latDiff = Math.abs(p.lat - target.lat);
        const lngDiff = Math.abs(p.lng - target.lng);
        
        return latDiff < precision && lngDiff < precision;
    });
};
