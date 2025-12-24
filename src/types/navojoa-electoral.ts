/**
 * Core interfaces and data models for Navojoa electoral sections analysis
 * Focused on the 78 electoral sections of Navojoa, Sonora
 */

// Core data model for Navojoa electoral sections
export interface NavojoaElectoralSection {
  // Identification
  sectionNumber: string;
  colonia?: string;
  
  // Counts by organizational role
  lideres: number;
  brigadistas: number;
  movilizadores: number;
  ciudadanos: number;
  totalRegistrations: number;
  
  // Metadata
  lastUpdated: Date;
  hasMinimumData: boolean; // true if >= 3 registrations
}

// KPIs specific to electoral coverage in Navojoa
export interface ElectoralKPIs {
  // Main KPIs
  totalSectionsWithCoverage: number; // out of 78 total
  coveragePercentage: number; // (totalSectionsWithCoverage / 78) * 100
  averageRegistrationsPerSection: number;
  totalRegistrations: number;
  topSection: {
    sectionNumber: string;
    registrationCount: number;
  };
  
  // Role breakdown
  roleBreakdown: {
    lideres: number;
    brigadistas: number;
    movilizadores: number;
    ciudadanos: number;
  };
  
  // Change indicators (optional)
  trends?: {
    sectionsChange: number; // +/- from previous period
    registrationsChange: number;
    averageChange: number;
  };
  
  // Constant for Navojoa
  readonly TOTAL_SECTIONS_NAVOJOA: 78;
}

// Component prop interfaces

export interface KPICardsProps {
  sectionData: NavojoaElectoralSection[];
  previousPeriodData?: NavojoaElectoralSection[];
  loading?: boolean;
}

export interface SectionStackedBarChartProps {
  sectionData: NavojoaElectoralSection[];
  onSectionClick?: (sectionNumber: string) => void;
  loading?: boolean;
}

export interface SectionHeatMapProps {
  sectionData: NavojoaElectoralSection[];
  colorScale?: 'green' | 'blue' | 'purple';
  loading?: boolean;
}

// Heat map cell data structure
export interface HeatMapCell {
  sectionNumber: string;
  intensity: number; // 0-100 based on relative registration count
  registrationCount: number;
}

// Data transformation interfaces
export interface SectionDataTransformer {
  transformToSectionData(analytics: any): NavojoaElectoralSection[];
  calculateElectoralKPIs(sectionData: NavojoaElectoralSection[]): ElectoralKPIs;
  generateHeatMapData(sectionData: NavojoaElectoralSection[]): HeatMapCell[];
}

// Integration with existing DataService
export interface NavojoaElectoralAnalytics {
  sectionData: NavojoaElectoralSection[];
  kpis: ElectoralKPIs;
  heatMapData: HeatMapCell[];
  lastUpdated: Date;
}

// Error handling for electoral data
export interface ElectoralDataError {
  type: 'missing_section' | 'invalid_data' | 'calculation_error';
  sectionNumber?: string;
  message: string;
  timestamp: Date;
}

// Constants for Navojoa electoral analysis
export const NAVOJOA_CONSTANTS = {
  TOTAL_SECTIONS: 78,
  MINIMUM_REGISTRATIONS_THRESHOLD: 3,
  // Real electoral sections of Navojoa, Sonora
  REAL_SECTIONS: [
    '1230', '1231', '1232', '1233', '1234', '1235', '1236', '1237', '1238', '1239',
    '1240', '1241', '1242', '1243', '1244', '1245', '1246', '1247', '1248', '1249',
    '1250', '1251', '1252', '1253', '1254', '1255', '1256', '1257', '1258', '1259',
    '1260', '1261', '1262', '1263', '1264', '1265', '1266', '1267', '1268', '1269',
    '1270', '1271', '1272', '1273', '1274', '1275', '1276', '1277', '1278', '1279',
    '1280', '1281', '1282', '1283', '1284', '1285', '1286', '1287', '1288', '1289',
    '1290', '1291', '1292', '1293', '1294', '1295', '1296', '1297', '1298', '1299',
    '1300', '1301', '1302', '1304', '1305', '1625', '1626', '1627'
  ] as const,
  ROLE_COLORS: {
    lideres: '#1f77b4',
    brigadistas: '#ff7f0e', 
    movilizadores: '#2ca02c',
    ciudadanos: '#d62728'
  },
  HEAT_MAP_COLORS: {
    green: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    blue: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    purple: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d']
  }
} as const;