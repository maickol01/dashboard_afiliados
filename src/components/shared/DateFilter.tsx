
import React, { useState } from 'react';

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

type FilterType = 'day' | 'week' | 'month';

interface DateFilterProps {
  onFilterChange: (dateRange: DateRange | null) => void;
}

// Helper to get today's date in YYYY-MM-DD format in the local timezone
const getLocalISODate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DateFilter: React.FC<DateFilterProps> = ({ onFilterChange }) => {
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalISODate());

  const handleApplyFilter = () => {
    // The input `selectedDate` is a string "YYYY-MM-DD". 
    // Appending T00:00:00 makes new Date() parse it in the local timezone.
    const localDate = new Date(`${selectedDate}T00:00:00`);

    let startDate: Date;
    let endDate: Date;

    switch (filterType) {
      case 'day':
        startDate = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0);
        endDate = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 23, 59, 59, 999);
        break;
      case 'week':
        const firstDayOfWeek = new Date(localDate);
        firstDayOfWeek.setDate(localDate.getDate() - localDate.getDay());
        startDate = new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate(), 0, 0, 0, 0);
        
        const lastDayOfWeek = new Date(startDate);
        lastDayOfWeek.setDate(startDate.getDate() + 6);
        endDate = new Date(lastDayOfWeek.getFullYear(), lastDayOfWeek.getMonth(), lastDayOfWeek.getDate(), 23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(localDate.getFullYear(), localDate.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(localDate.getFullYear(), localDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }
    
    onFilterChange({ startDate, endDate });
  };

  const handleClearFilter = () => {
    onFilterChange(null);
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg">
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value as FilterType)}
        className="p-2 border rounded-md"
      >
        <option value="day">Día</option>
        <option value="week">Semana</option>
        <option value="month">Mes</option>
      </select>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="p-2 border rounded-md"
        data-testid="date-input"
      />
      <button
        onClick={handleApplyFilter}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Aplicar Filtro
      </button>
      <button
        onClick={handleClearFilter}
        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
      >
        Limpiar
      </button>
    </div>
  );
};

export default DateFilter;
