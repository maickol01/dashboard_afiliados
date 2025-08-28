/**
 * Service for transforming existing DataService analytics to Navojoa electoral section format
 * Integrates with existing DataService.generateAnalyticsFromData() method
 */

import { Person, Analytics } from '../types';
import {
    NavojoaElectoralSection,
    ElectoralKPIs,
    HeatMapCell,
    NavojoaElectoralAnalytics,
    SectionDataTransformer,
    NAVOJOA_CONSTANTS
} from '../types/navojoa-electoral';

export class NavojoaElectoralService implements SectionDataTransformer {



    /**
     * Transform existing analytics data to NavojoaElectoralSection format
     * Uses the seccionDistribution from geographic analytics
     */
    transformToSectionData(analytics: Analytics): NavojoaElectoralSection[] {
        if (!analytics.geographic?.seccionDistribution) {
            console.warn('No seccionDistribution found in analytics data');
            return [];
        }

        const sectionData: NavojoaElectoralSection[] = [];
        const now = new Date();

        // Transform each section from the existing seccionDistribution
        analytics.geographic.seccionDistribution.forEach(section => {
            const sectionNumber = section.region; // region contains section number
            const totalRegistrations = section.count;

            // For now, we'll distribute the total count across roles based on typical patterns
            // This can be enhanced later with actual role-specific data from the database
            const roleDistribution = this.estimateRoleDistribution(totalRegistrations);

            const sectionEntry: NavojoaElectoralSection = {
                sectionNumber,
                totalRegistrations,
                lideres: roleDistribution.lideres,
                brigadistas: roleDistribution.brigadistas,
                movilizadores: roleDistribution.movilizadores,
                ciudadanos: roleDistribution.ciudadanos,
                lastUpdated: now,
                hasMinimumData: totalRegistrations >= NAVOJOA_CONSTANTS.MINIMUM_REGISTRATIONS_THRESHOLD
            };

            sectionData.push(sectionEntry);
        });

        // Sort by total registrations descending for ranking
        return sectionData.sort((a, b) => b.totalRegistrations - a.totalRegistrations);
    }

    /**
     * Transform hierarchical data directly to section data
     * This provides more accurate role distribution
     */
    transformHierarchicalDataToSections(hierarchicalData: Person[]): NavojoaElectoralSection[] {
        const sectionMap = new Map<string, {
            lideres: number;
            brigadistas: number;
            movilizadores: number;
            ciudadanos: number;
        }>();

        // Flatten all people and group by section
        const allPeople = this.getAllPeopleFlat(hierarchicalData);

        // Debug: Log section data processing
        console.log('🔍 Procesando datos de secciones...');
        console.log('🔍 Total personas en datos jerárquicos:', allPeople.length);

        // Debug: Check how many people have section data
        const peopleWithSections = allPeople.filter(p => p.seccion && p.seccion !== 'Sin sección' && p.seccion.trim() !== '');
        console.log('🔍 Personas con sección válida:', peopleWithSections.length);

        if (peopleWithSections.length > 0) {
            const uniqueSections = [...new Set(peopleWithSections.map(p => p.seccion))];
            console.log('🔍 Secciones encontradas:', uniqueSections);
        }

        allPeople.forEach(person => {
            const section = person.seccion || 'Sin sección';

            if (!sectionMap.has(section)) {
                sectionMap.set(section, {
                    lideres: 0,
                    brigadistas: 0,
                    movilizadores: 0,
                    ciudadanos: 0
                });
            }

            const sectionData = sectionMap.get(section)!;

            switch (person.role) {
                case 'lider':
                    sectionData.lideres++;
                    break;
                case 'brigadista':
                    sectionData.brigadistas++;
                    break;
                case 'movilizador':
                    sectionData.movilizadores++;
                    break;
                case 'ciudadano':
                    sectionData.ciudadanos++;
                    break;
            }
        });

        console.log('🔍 Mapa de secciones procesado:', Array.from(sectionMap.entries()));

        // Convert map to NavojoaElectoralSection array
        const sectionData: NavojoaElectoralSection[] = [];
        const now = new Date();

        sectionMap.forEach((counts, sectionNumber) => {
            const totalRegistrations = counts.lideres + counts.brigadistas + counts.movilizadores + counts.ciudadanos;

            if (totalRegistrations > 0) {
                sectionData.push({
                    sectionNumber,
                    colonia: this.getColoniaForSection(sectionNumber, allPeople),
                    totalRegistrations,
                    lideres: counts.lideres,
                    brigadistas: counts.brigadistas,
                    movilizadores: counts.movilizadores,
                    ciudadanos: counts.ciudadanos,
                    lastUpdated: now,
                    hasMinimumData: totalRegistrations >= NAVOJOA_CONSTANTS.MINIMUM_REGISTRATIONS_THRESHOLD
                });
            }
        });

        console.log('🔍 Datos finales de secciones:', sectionData.map(s => ({
            seccion: s.sectionNumber,
            total: s.totalRegistrations,
            lideres: s.lideres,
            brigadistas: s.brigadistas,
            movilizadores: s.movilizadores,
            ciudadanos: s.ciudadanos
        })));

        // Sort by total registrations descending
        return sectionData.sort((a, b) => b.totalRegistrations - a.totalRegistrations);
    }

    /**
     * Calculate electoral KPIs from section data
     */
    calculateElectoralKPIs(sectionData: NavojoaElectoralSection[]): ElectoralKPIs {
        const totalSectionsWithCoverage = sectionData.length;
        const coveragePercentage = (totalSectionsWithCoverage / NAVOJOA_CONSTANTS.TOTAL_SECTIONS) * 100;

        const totalRegistrations = sectionData.reduce((sum, section) => sum + section.totalRegistrations, 0);
        const averageRegistrationsPerSection = totalSectionsWithCoverage > 0
            ? totalRegistrations / totalSectionsWithCoverage
            : 0;

        // Find top section
        const topSection = sectionData.length > 0
            ? sectionData[0] // Already sorted by totalRegistrations descending
            : { sectionNumber: 'N/A', registrationCount: 0 };

        // Calculate role breakdown
        const roleBreakdown = sectionData.reduce(
            (totals, section) => ({
                lideres: totals.lideres + section.lideres,
                brigadistas: totals.brigadistas + section.brigadistas,
                movilizadores: totals.movilizadores + section.movilizadores,
                ciudadanos: totals.ciudadanos + section.ciudadanos
            }),
            { lideres: 0, brigadistas: 0, movilizadores: 0, ciudadanos: 0 }
        );

        return {
            totalSectionsWithCoverage,
            coveragePercentage,
            averageRegistrationsPerSection,
            totalRegistrations,
            topSection: {
                sectionNumber: topSection.sectionNumber,
                registrationCount: topSection.totalRegistrations || topSection.registrationCount
            },
            roleBreakdown,
            TOTAL_SECTIONS_NAVOJOA: NAVOJOA_CONSTANTS.TOTAL_SECTIONS
        };
    }

    /**
     * Generate heat map data from section data
     */
    generateHeatMapData(sectionData: NavojoaElectoralSection[]): HeatMapCell[] {
        if (sectionData.length === 0) {
            return [];
        }

        // Find max registrations for intensity calculation
        const maxRegistrations = Math.max(...sectionData.map(s => s.totalRegistrations));

        return sectionData.map(section => ({
            sectionNumber: section.sectionNumber,
            registrationCount: section.totalRegistrations,
            intensity: maxRegistrations > 0 ? (section.totalRegistrations / maxRegistrations) * 100 : 0
        }));
    }

    /**
     * Generate complete Navojoa electoral analytics
     */
    async generateNavojoaElectoralAnalytics(
        hierarchicalData: Person[],
        analytics?: Analytics
    ): Promise<NavojoaElectoralAnalytics> {
        // Use hierarchical data for more accurate section transformation
        const sectionData = this.transformHierarchicalDataToSections(hierarchicalData);

        // Calculate KPIs
        const kpis = this.calculateElectoralKPIs(sectionData);

        // Generate heat map data
        const heatMapData = this.generateHeatMapData(sectionData);

        return {
            sectionData,
            kpis,
            heatMapData,
            lastUpdated: new Date()
        };
    }

    /**
     * Calculate KPIs with trend comparison
     */
    calculateElectoralKPIsWithTrends(
        currentData: NavojoaElectoralSection[],
        previousData?: NavojoaElectoralSection[]
    ): ElectoralKPIs {
        const currentKPIs = this.calculateElectoralKPIs(currentData);

        if (!previousData || previousData.length === 0) {
            return currentKPIs;
        }

        const previousKPIs = this.calculateElectoralKPIs(previousData);

        // Calculate trends
        const trends = {
            sectionsChange: currentKPIs.totalSectionsWithCoverage - previousKPIs.totalSectionsWithCoverage,
            registrationsChange: currentKPIs.totalRegistrations - previousKPIs.totalRegistrations,
            averageChange: currentKPIs.averageRegistrationsPerSection - previousKPIs.averageRegistrationsPerSection
        };

        return {
            ...currentKPIs,
            trends
        };
    }

    // Private helper methods

    private estimateRoleDistribution(totalRegistrations: number): {
        lideres: number;
        brigadistas: number;
        movilizadores: number;
        ciudadanos: number;
    } {
        // Typical distribution pattern based on organizational structure
        // These percentages can be adjusted based on real data analysis
        const lideresPercent = 0.05; // 5%
        const brigadistasPercent = 0.15; // 15%
        const movilizadoresPercent = 0.25; // 25%
        const ciudadanosPercent = 0.55; // 55%

        return {
            lideres: Math.round(totalRegistrations * lideresPercent),
            brigadistas: Math.round(totalRegistrations * brigadistasPercent),
            movilizadores: Math.round(totalRegistrations * movilizadoresPercent),
            ciudadanos: Math.round(totalRegistrations * ciudadanosPercent)
        };
    }

    private getAllPeopleFlat(hierarchicalData: Person[]): Person[] {
        const result: Person[] = [];

        const flatten = (people: Person[]) => {
            people.forEach(person => {
                result.push(person);
                if (person.children && person.children.length > 0) {
                    flatten(person.children);
                }
            });
        };

        flatten(hierarchicalData);
        return result;
    }

    private getColoniaForSection(sectionNumber: string, allPeople: Person[]): string | undefined {
        // Find the most common colonia for this section
        const colonias = allPeople
            .filter(p => p.seccion === sectionNumber && p.colonia)
            .map(p => p.colonia!);

        if (colonias.length === 0) return undefined;

        // Return the most frequent colonia
        const coloniaCount = colonias.reduce((acc, colonia) => {
            acc[colonia] = (acc[colonia] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(coloniaCount)
            .sort(([, a], [, b]) => b - a)[0][0];
    }
}

// Export singleton instance
export const navojoaElectoralService = new NavojoaElectoralService();