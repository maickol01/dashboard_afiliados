import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface KPICard {
  name: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

interface KPICardsSectionProps {
  title?: string;
  cards: KPICard[];
  loading?: boolean;
  gridCols?: 'auto' | 2 | 3 | 4;
}

const KPICardsSection: React.FC<KPICardsSectionProps> = ({ 
  title, 
  cards, 
  loading = false,
  gridCols = 'auto'
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {title && (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
        )}
        <div className={`grid grid-cols-1 gap-6 ${
          gridCols === 'auto' ? 'sm:grid-cols-2 lg:grid-cols-4' :
          gridCols === 2 ? 'sm:grid-cols-2' :
          gridCols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' :
          'sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {Array.from({ length: gridCols === 'auto' ? 4 : gridCols }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="bg-gray-200 p-3 rounded-md w-12 h-12"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getGridClass = () => {
    switch (gridCols) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  };

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}
      <div className={`grid gap-6 ${getGridClass()}`}>
        {cards.map((card, index) => (
          <div key={index} className="bg-white overflow-hidden shadow-md rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className={`${card.color} p-3 rounded-md`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                    <dd className="flex items-center">
                      <span className="text-lg font-semibold text-gray-900">{card.value}</span>
                      {card.change && (
                        <span className={`ml-2 text-sm font-medium ${
                          card.trend === 'up' ? 'text-green-600' : 
                          card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {card.change}
                        </span>
                      )}
                    </dd>
                    {card.description && (
                      <dd className="text-xs text-gray-500 mt-1">{card.description}</dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KPICardsSection;