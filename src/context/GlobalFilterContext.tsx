import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DateFilterOption = 'day' | 'week' | 'month' | 'total' | 'custom';

export interface GlobalFilterState {
  selectedOption: DateFilterOption;
  customDate: Date | null;
  setFilter: (option: DateFilterOption, date?: Date | null) => void;
}

const GlobalFilterContext = createContext<GlobalFilterState | undefined>(undefined);

export const GlobalFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedOption, setSelectedOption] = useState<DateFilterOption>('total');
  const [customDate, setCustomDate] = useState<Date | null>(null);

  const setFilter = (option: DateFilterOption, date: Date | null = null) => {
    setSelectedOption(option);
    if (option === 'custom') {
      setCustomDate(date);
    } else {
      setCustomDate(null);
    }
  };

  return (
    <GlobalFilterContext.Provider value={{ selectedOption, customDate, setFilter }}>
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
