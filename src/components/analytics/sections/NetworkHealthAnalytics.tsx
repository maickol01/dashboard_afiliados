import React, { useState } from 'react';
import { 
  Network, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Activity,
  BarChart3,
  Target,
  Zap,
  Shield,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Analytics } from '../../../types';
import LineChart from '../../charts/LineChart';

interface NetworkHealthAnalyticsProps {
  analytics: Analytics;
}

const NetworkHealthAnalytics: React.FC<NetworkHealthAnalyticsProps> = ({ analytics }) => {
  const [activeTab, setActiveTab] = useState<'balance' | 'growth' | 'structure' | 'expansion'>('balance');
  
  if (!analytics.networkHealth) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Salud de Red</h3>
        <p className="text-gray-500 text-center py-8">No hay datos de salud de red disponibles</p>
      </div>
    );
  }

  const { networkHealth } = analytics;
  const { summary, hierarchicalBalance, growthPatterns, structuralHealth, expansionRate } = networkHealth;

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBalanceStatusColor = (status: string) => {
    switch (status) {
      case 'balanced': return 'text-green-600 bg-green-100';
      case 'overloaded': return 'text-red-600 bg-red-100';
      case 'underutilized': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'accelerating': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'balance', name: 'Balance Jerárquico', icon: Network },
    { id: 'growth', name: 'Patrones de Crecimiento', icon: TrendingUp },
    { id: 'structure', name: 'Salud Estructural', icon: Shield },
    { id: 'expansion', name: 'Tasa de Expansión', icon: Zap }
  ];

  const renderBalanceTab = () => (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Redes Balanceadas</span>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {hierarchicalBalance.filter(b => b.balanceStatus === 'balanced').length}
          </div>
          <div className="text-xs text-gray-500">
            de {hierarchicalBalance.length} líderes
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Sobrecargadas</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {hierarchicalBalance.filter(b => b.balanceStatus === 'overloaded').length}
          </div>
          <div className="text-xs text-gray-500">Necesitan redistribución</div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Subutilizadas</span>
            <Target className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {hierarchicalBalance.filter(b => b.balanceStatus === 'underutilized').length}
          </div>
          <div className="text-xs text-gray-500">Potencial de crecimiento</div>
        </div>
      </div>

      {/* Detailed Balance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Balance por Líder</h4>
        <div className="space-y-4">
          {hierarchicalBalance.map((balance) => (
            <div key={balance.leaderId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-medium text-gray-900">{balance.leaderName}</h5>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBalanceStatusColor(balance.balanceStatus)}`}>
                    {balance.balanceStatus === 'balanced' ? 'Balanceado' : 
                     balance.balanceStatus === 'overloaded' ? 'Sobrecargado' : 'Subutilizado'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{balance.balanceScore}</div>
                  <div className="text-xs text-gray-500">Puntuación</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{balance.brigadierCount}</div>
                  <div className="text-xs text-gray-500">Brigadistas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{balance.mobilizerCount}</div>
                  <div className="text-xs text-gray-500">Movilizadores</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{balance.citizenCount}</div>
                  <div className="text-xs text-gray-500">Ciudadanos</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div>Promedio Movilizadores/Brigadista: {balance.avgMobilizersPerBrigadier.toFixed(1)}</div>
                <div>Promedio Ciudadanos/Movilizador: {balance.avgCitizensPerMobilizer.toFixed(1)}</div>
              </div>

              {balance.recommendations.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <h6 className="text-sm font-medium text-blue-900 mb-2">Recomendaciones:</h6>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {balance.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGrowthTab = () => {
    const growthChartData = growthPatterns.map(pattern => ({
      date: pattern.period,
      count: pattern.totalNetworkSize
    }));

    return (
      <div className="space-y-6">
        {/* Growth Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <LineChart
            data={growthChartData}
            title="Crecimiento de la Red por Mes"
          />
        </div>

        {/* Growth Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {growthPatterns.slice(-4).map((pattern, index) => (
            <div key={pattern.period} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{pattern.period}</span>
                {getTrendIcon(pattern.growthTrend)}
              </div>
              <div className="text-2xl font-bold text-primary">{pattern.totalNetworkSize}</div>
              <div className="text-sm text-gray-600">
                {pattern.growthRate > 0 ? '+' : ''}{pattern.growthRate.toFixed(1)}% crecimiento
              </div>
              <div className="mt-2 text-xs text-gray-500">
                L:{pattern.newLeaders} B:{pattern.newBrigadiers} M:{pattern.newMobilizers} C:{pattern.newCitizens}
              </div>
            </div>
          ))}
        </div>

        {/* Growth Trends */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Tendencias de Crecimiento</h4>
          <div className="space-y-3">
            {growthPatterns.slice(-6).map((pattern) => (
              <div key={pattern.period} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getTrendIcon(pattern.growthTrend)}
                  <span className="ml-3 font-medium text-gray-900">{pattern.period}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{pattern.totalNetworkSize} nuevos</div>
                  <div className="text-sm text-gray-600">
                    {pattern.growthRate > 0 ? '+' : ''}{pattern.growthRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStructureTab = () => (
    <div className="space-y-6">
      {/* Structure Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {structuralHealth.map((metric) => (
          <div key={metric.metricType} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {metric.metricType === 'orphaned_workers' ? 'Trabajadores Huérfanos' :
                 metric.metricType === 'broken_chains' ? 'Cadenas Rotas' :
                 metric.metricType === 'inactive_nodes' ? 'Nodos Inactivos' :
                 'Nodos Sobrecargados'}
              </span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{metric.count}</div>
            <div className="text-sm text-gray-600">{metric.percentage.toFixed(1)}% del total</div>
          </div>
        ))}
      </div>

      {/* Detailed Issues */}
      {structuralHealth.map((metric) => (
        <div key={metric.metricType} className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {metric.metricType === 'orphaned_workers' ? 'Trabajadores Huérfanos' :
             metric.metricType === 'broken_chains' ? 'Cadenas Jerárquicas Rotas' :
             metric.metricType === 'inactive_nodes' ? 'Trabajadores Inactivos' :
             'Trabajadores Sobrecargados'}
          </h4>
          
          {metric.affectedWorkers.length > 0 ? (
            <div className="space-y-3">
              {metric.affectedWorkers.slice(0, 10).map((worker) => (
                <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{worker.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{worker.role}</div>
                    <div className="text-sm text-gray-600">{worker.issue}</div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(worker.severity)}`}>
                    {worker.severity === 'high' ? 'Alta' : worker.severity === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
              ))}
              {metric.affectedWorkers.length > 10 && (
                <div className="text-center text-sm text-gray-500">
                  ... y {metric.affectedWorkers.length - 10} más
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No se encontraron problemas de este tipo</p>
            </div>
          )}

          {metric.recommendations.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h6 className="text-sm font-medium text-blue-900 mb-2">Recomendaciones:</h6>
              <ul className="text-sm text-blue-800 space-y-1">
                {metric.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderExpansionTab = () => {
    const expansionChartData = expansionRate.map(rate => ({
      date: rate.period,
      count: rate.newConnections
    }));

    return (
      <div className="space-y-6">
        {/* Expansion Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <LineChart
            data={expansionChartData}
            title="Nuevas Conexiones por Semana"
          />
        </div>

        {/* Expansion Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {expansionRate.slice(-4).map((rate) => (
            <div key={rate.period} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{rate.period}</span>
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{rate.newConnections}</div>
              <div className="text-sm text-gray-600">
                {rate.expansionRate.toFixed(1)}% expansión
              </div>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  rate.expansionQuality === 'high' ? 'text-green-600 bg-green-100' :
                  rate.expansionQuality === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                  'text-red-600 bg-red-100'
                }`}>
                  {rate.expansionQuality === 'high' ? 'Alta calidad' :
                   rate.expansionQuality === 'medium' ? 'Calidad media' : 'Baja calidad'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Expansion Details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Detalles de Expansión</h4>
          <div className="space-y-4">
            {expansionRate.slice(-8).map((rate) => (
              <div key={rate.period} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{rate.period}</div>
                  <div className="text-sm text-gray-600">
                    Densidad: {rate.networkDensity.toFixed(3)} | 
                    Cobertura: +{rate.coverageIncrease.toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{rate.newConnections} conexiones</div>
                  <div className="text-sm text-gray-600">
                    Eficiencia: {rate.efficiencyScore.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Health Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Network className="h-5 w-5 text-primary mr-2" />
          Resumen de Salud de Red
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{summary.overallHealthScore}</div>
            <div className="text-sm text-gray-600">Puntuación General</div>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mt-2 ${getHealthStatusColor(summary.healthStatus)}`}>
              {summary.healthStatus === 'excellent' ? 'Excelente' :
               summary.healthStatus === 'good' ? 'Buena' :
               summary.healthStatus === 'fair' ? 'Regular' : 'Deficiente'}
            </span>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">{summary.criticalIssues}</div>
            <div className="text-sm text-gray-600">Problemas Críticos</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-2">{summary.warnings}</div>
            <div className="text-sm text-gray-600">Advertencias</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">{summary.strengths.length}</div>
            <div className="text-sm text-gray-600">Fortalezas</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div>
            <h4 className="font-medium text-green-900 mb-3 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Fortalezas
            </h4>
            <ul className="space-y-2">
              {summary.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-green-800 flex items-start">
                  <span className="mr-2">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div>
            <h4 className="font-medium text-red-900 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Áreas de Mejora
            </h4>
            <ul className="space-y-2">
              {summary.weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm text-red-800 flex items-start">
                  <span className="mr-2">!</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Items */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Plan de Acción</h4>
          <div className="space-y-3">
            {summary.actionItems.map((item, index) => (
              <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mr-3 mt-0.5 ${
                  item.priority === 'high' ? 'text-red-600 bg-red-100' :
                  item.priority === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                  'text-blue-600 bg-blue-100'
                }`}>
                  {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
                <div>
                  <div className="font-medium text-gray-900">{item.action}</div>
                  <div className="text-sm text-gray-600">{item.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'balance' && renderBalanceTab()}
      {activeTab === 'growth' && renderGrowthTab()}
      {activeTab === 'structure' && renderStructureTab()}
      {activeTab === 'expansion' && renderExpansionTab()}
    </div>
  );
};

export default NetworkHealthAnalytics;