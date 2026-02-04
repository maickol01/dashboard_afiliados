import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useGlobalFilter, DateFilterOption } from '../../context/GlobalFilterContext';

export const DateFilterDropdown: React.FC = () => {
  const { selectedOption, customDate, setFilter } = useGlobalFilter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { id: DateFilterOption; label: string }[] = [
    { id: 'day', label: 'Día' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'total', label: 'Total' },
  ];

  const handleSelect = (option: DateFilterOption) => {
    setFilter(option);
    setIsOpen(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
          // Adjust for timezone issues by creating date from parts
          const [year, month, day] = e.target.value.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          setFilter('custom', date);
          setIsOpen(false);
      }
  };

  const currentLabel = selectedOption === 'custom' && customDate
    ? customDate.toLocaleDateString('es-ES')
    : options.find(o => o.id === selectedOption)?.label || 'Total';

  return (
    <div className="relative" ref={dropdownRef} data-testid="date-filter-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium text-gray-700"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span>{currentLabel}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 ${
                  selectedOption === option.id ? 'text-primary font-medium bg-blue-50' : 'text-gray-700'
                }`}
              >
                {option.label}
                {selectedOption === option.id && <Check className="h-4 w-4" />}
              </button>
            ))}
            
            <div className="border-t border-gray-100 my-1"></div>
            
            <div className="px-4 py-2 text-sm text-gray-700">
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Específica</label>
                <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    onChange={handleDateChange}
                    value={selectedOption === 'custom' && customDate ? customDate.toISOString().split('T')[0] : ''}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
