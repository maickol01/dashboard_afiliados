import { Person } from '../types';

/**
 * Calculates offsets for a spiderify/starbust effect.
 * Returns an array of [lngOffset, latOffset] pairs.
 * 
 * @param count Number of points to distribute
 * @param baseRadius Radius in degrees (approx). Default 0.000375 (~37.5m, increased from 30m)
 */
export const getSpiderOffsets = (count: number, baseRadius: number = 0.000375): number[][] => {
    if (count <= 1) return [];

    const offsets: number[][] = [];
    
    // Use Circle for small counts (<= 9)
    if (count <= 9) {
        const twoPi = Math.PI * 2;
        const startAngle = Math.PI / 2;

        for (let i = 0; i < count; i++) {
            const angle = (i * twoPi) / count + startAngle;
            offsets.push([
                Math.cos(angle) * baseRadius,
                Math.sin(angle) * baseRadius
            ]);
        }
    } else {
        // Use Golden Angle Spiral (Sunflower) for large counts
        // This packs points efficiently in a disc shape
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 radians
        
        // Spacing factor. 
        // We want points to be roughly 'baseRadius' apart.
        const c = baseRadius * 0.9;

        for (let i = 0; i < count; i++) {
            const angle = i * goldenAngle;
            // Radius grows with sqrt(i) to maintain constant density
            const radius = c * Math.sqrt(i + 5) + baseRadius; 
            
            offsets.push([
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            ]);
        }
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