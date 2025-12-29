/**
 * Navojoa Electoral Analysis Components
 * 
 * Components specifically designed for analyzing electoral sections in Navojoa, Sonora
 */

export { default as KPICards } from './KPICards';
export { default as SectionStackedBarChart } from './SectionStackedBarChart';
export { default as NavojoaElectoralDemo } from './NavojoaElectoralDemo';
export { default as NavojoaMap } from './NavojoaMap';

// Re-export types for convenience
export type {
  KPICardsProps,
  SectionStackedBarChartProps,
  NavojoaElectoralSection,
  ElectoralKPIs,
  HeatMapCell,
  NavojoaElectoralAnalytics
} from '../../../types/navojoa-electoral';