import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DateFilterOption = 'day' | 'week' | 'month' | 'total' | 'custom';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface GlobalFilterState {
  selectedOption: DateFilterOption;
  customRange: DateRange;
  setFilter: (option: DateFilterOption, range?: DateRange) => void;
}

const GlobalFilterContext = createContext<GlobalFilterState | undefined>(undefined);

export const GlobalFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedOption, setSelectedOption] = useState<DateFilterOption>('total');
  const [customRange, setCustomRange] = useState<DateRange>({ startDate: null, endDate: null });

  const setFilter = (option: DateFilterOption, range: DateRange = { startDate: null, endDate: null }) => {
    setSelectedOption(option);
    if (option === 'custom') {
      setCustomRange(range);
    } else {
      setCustomRange({ startDate: null, endDate: null });
    }
  };

  return (
    <GlobalFilterContext.Provider value={{ selectedOption, customRange, setFilter }}>
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
