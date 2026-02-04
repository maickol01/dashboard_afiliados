import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DateFilterOption = 'day' | 'week' | 'month' | 'total' | 'custom';
export type PageType = 'analytics' | 'brigadistas' | 'movilizadores' | 'geographic' | 'quality' | 'hierarchy';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface GlobalFilterState {
  // Navigation
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  
  // Date Filtering
  selectedOption: DateFilterOption;
  customRange: DateRange;
  setFilter: (option: DateFilterOption, range?: DateRange) => void;
  
  // Hierarchical Filtering
  selectedLeaderId: string | null;
  selectedBrigadistaId: string | null;
  setLeader: (id: string | null) => void;
  setBrigadista: (id: string | null) => void;
}

const GlobalFilterContext = createContext<GlobalFilterState | undefined>(undefined);

export const GlobalFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageType>('analytics');
  const [selectedOption, setSelectedOption] = useState<DateFilterOption>('total');
  const [customRange, setCustomRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [selectedBrigadistaId, setSelectedBrigadistaId] = useState<string | null>(null);

  const setFilter = (option: DateFilterOption, range: DateRange = { startDate: null, endDate: null }) => {
    setSelectedOption(option);
    if (option === 'custom') {
      setCustomRange(range);
    } else {
      setCustomRange({ startDate: null, endDate: null });
    }
  };

  const setLeader = (id: string | null) => {
    setSelectedLeaderId(id);
    // Reset brigadista if leader changes
    setSelectedBrigadistaId(null);
  };

  const setBrigadista = (id: string | null) => {
    setSelectedBrigadistaId(id);
  };

  return (
    <GlobalFilterContext.Provider value={{ 
      currentPage, 
      setCurrentPage,
      selectedOption, 
      customRange, 
      setFilter,
      selectedLeaderId,
      selectedBrigadistaId,
      setLeader,
      setBrigadista
    }}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = () => {
  const context = useContext(GlobalFilterContext);
  if (context === undefined) {
    throw new Error('useGlobalFilter must be used within a GlobalFilterProvider');
  }
  return context;
};
