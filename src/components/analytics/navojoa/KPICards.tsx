import React from 'react';
import { TrendingUp, TrendingDown, Users, UserCheck, Target, Hash, Crown, Shield, Zap, User } from 'lucide-react';
import { KPICardsProps, ElectoralKPIs } from '../../../types/navojoa-electoral';
import { navojoaElectoralService } from '../../../services/navojoaElectoralService';
import { useMobileDetection } from '../../../hooks/useMobileDetection';

const KPICards: React.FC<KPICardsProps> = ({ 
  sectionData, 
  previousPeriodData, 
  loading = false 
}) => {
  const { isMobile } = useMobileDetection();
  // Calculate KPIs with trends if previous data is available
  const kpis: ElectoralKPIs = React.useMemo(() => {
    if (previousPeriodData) {
      return navojoaElectoralService.calculateElectoralKPIsWithTrends(sectionData, previousPeriodData);
    }
    return navojoaElectoralService.calculateElectoralKPIs(sectionData);
  }, [sectionData, previousPeriodData]);

  // Helper function to render trend indicator
  const renderTrendIndicator = (change?: number) => {
    if (change === undefined || change === 0) return null;
    
    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center ml-2 ${colorClass}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{change}
        </span>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className={`bg-white rounded-lg shadow-md animate-pulse ${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Main KPI cards data
  const mainKPIs = [
    {
      id: 'coverage',
      title: 'Cobertura Electoral',
      value: `${kpis.totalSectionsWithCoverage} de 78 secciones`,
      subtitle: `${kpis.coveragePercentage.toFixed(1)}%`,
      icon: Target,
      color: 'bg-primary',
      textColor: 'text-primary',
      trend: kpis.trends?.sectionsChange,
      description: 'Secciones con al menos un registro'
    },
    {
      id: 'average',
      title: 'Promedio por Sección',
      value: kpis.averageRegistrationsPerSection.toFixed(1),
      subtitle: 'registros promedio',
      icon: Hash,
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      trend: kpis.trends?.averageChange,
      description: 'Registros promedio por sección activa'
    },
    {
      id: 'total',
      title: 'Total Registros',
      value: kpis.totalRegistrations.toLocaleString(),
      subtitle: 'registros totales',
      icon: Users,
      color: 'bg-green-600',
      textColor: 'text-green-600',
      trend: kpis.trends?.registrationsChange,
      description: 'Total de personas registradas'
    },
    {
      id: 'top',
      title: 'Sección Líder',
      value: `Sección ${kpis.topSection.sectionNumber}`,
      subtitle: `${kpis.topSection.registrationCount} registros`,
      icon: Crown,
      color: 'bg-yellow-600',
      textColor: 'text-yellow-600',
      description: 'Sección con mayor número de registros'
    }
  ];

  // Role breakdown cards data
  const roleKPIs = [
    {
      id: 'lideres',
      title: 'Líderes',
      value: kpis.roleBreakdown.lideres.toLocaleString(),
      icon: Crown,
      color: 'bg-purple-600',
      textColor: 'text-purple-600',
      description: 'Total de líderes registrados'
    },
    {
      id: 'brigadistas',
      title: 'Brigadistas',
      value: kpis.roleBreakdown.brigadistas.toLocaleString(),
      icon: Shield,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      description: 'Total de brigadistas registrados'
    },
    {
      id: 'movilizadores',
      title: 'Movilizadores',
      value: kpis.roleBreakdown.movilizadores.toLocaleString(),
      icon: Zap,
      color: 'bg-orange-600',
      textColor: 'text-orange-600',
      description: 'Total de movilizadores registrados'
    },
    {
      id: 'ciudadanos',
      title: 'Ciudadanos',
      value: kpis.roleBreakdown.ciudadanos.toLocaleString(),
      icon: User,
      color: 'bg-teal-600',
      textColor: 'text-teal-600',
      description: 'Total de ciudadanos registrados'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Coverage Highlight Card */}
      <div className={`bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-lg text-white ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col text-center' : 'justify-between'}`}>
          <div className={isMobile ? 'mb-4' : ''}>
            <h2 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {kpis.totalSectionsWithCoverage} de 78 secciones - {kpis.coveragePercentage.toFixed(1)}%
            </h2>
            <p className={`text-primary-white ${isMobile ? 'text-sm' : ''}`}>Cobertura Electoral de Navojoa</p>
            {kpis.trends?.sectionsChange && (
              <div className={`flex items-center mt-2 ${isMobile ? 'justify-center' : ''}`}>
                {renderTrendIndicator(kpis.trends.sectionsChange)}
                <span className="ml-2 text-sm">vs período anterior</span>
              </div>
            )}
          </div>
          <Target className={`text-primary-light ${isMobile ? 'h-12 w-12' : 'h-16 w-16'}`} />
        </div>
        <div className="mt-4 bg-white bg-opacity-20 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(kpis.coveragePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Main KPIs Grid */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {mainKPIs.slice(1).map((kpi) => (
          <div key={kpi.id} className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`rounded-full ${kpi.color} ${isMobile ? 'p-2' : 'p-3'}`}>
                <kpi.icon className={`text-white ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
              </div>
              {kpi.trend !== undefined && renderTrendIndicator(kpi.trend)}
            </div>
            <div className="space-y-2">
              <h3 className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>{kpi.title}</h3>
              <div className={`font-bold ${kpi.textColor} ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                {kpi.value}
              </div>
              <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>{kpi.subtitle}</p>
              <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>{kpi.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role Breakdown Section */}
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <h3 className={`font-semibold text-gray-900 mb-6 flex items-center ${isMobile ? 'text-base' : 'text-lg'}`}>
          <UserCheck className={`text-primary mr-2 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          Desglose por Roles Organizacionales
        </h3>
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
          {roleKPIs.map((role) => (
            <div key={role.id} className={`text-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${isMobile ? 'p-3' : 'p-4'}`}>
              <div className={`inline-flex rounded-full ${role.color} mb-3 ${isMobile ? 'p-2' : 'p-3'}`}>
                <role.icon className={`text-white ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
              </div>
              <div className={`font-bold ${role.textColor} mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {role.value}
              </div>
              <div className={`font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {role.title}
              </div>
              <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {isMobile ? role.title : role.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <h3 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>Resumen Estadístico</h3>
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          <div className="text-center">
            <div className={`font-bold text-primary mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
              {((kpis.totalSectionsWithCoverage / kpis.TOTAL_SECTIONS_NAVOJOA) * 100).toFixed(1)}%
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Cobertura Territorial</div>
            <div className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {kpis.TOTAL_SECTIONS_NAVOJOA - kpis.totalSectionsWithCoverage} secciones sin cobertura
            </div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-green-600 mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
              {kpis.averageRegistrationsPerSection.toFixed(1)}
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Registros por Sección</div>
            <div className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              Promedio en secciones activas
            </div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-blue-600 mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
              {kpis.totalRegistrations.toLocaleString()}
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Registrados</div>
            <div className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              En {kpis.totalSectionsWithCoverage} secciones
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPICards;