import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useGlobalFilter, DateFilterOption } from '../../context/GlobalFilterContext';

export const DateFilterDropdown: React.FC = () => {
  const { selectedOption, customRange, setFilter } = useGlobalFilter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local state for range editing
  const [tempRange, setTempRange] = useState({ 
    startDate: customRange.startDate ? customRange.startDate.toISOString().split('T')[0] : '',
    endDate: customRange.endDate ? customRange.endDate.toISOString().split('T')[0] : ''
  });

  // Sync tempRange when customRange changes externally or when opening
  useEffect(() => {
    if (isOpen) {
        setTempRange({
            startDate: customRange.startDate ? customRange.startDate.toISOString().split('T')[0] : '',
            endDate: customRange.endDate ? customRange.endDate.toISOString().split('T')[0] : ''
        });
    }
  }, [isOpen, customRange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside the dropdown
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }

      // Special check for native date pickers:
      // In many browsers, the picker is not a child of the input in the DOM.
      // We can check if the click target is the input or if it's likely a picker part.
      // But a better way is to check if the focus is still on our inputs.
      setTimeout(() => {
          const activeEl = document.activeElement;
          const isOurInput = activeEl && dropdownRef.current?.contains(activeEl);
          
          if (!isOurInput && dropdownRef.current && !dropdownRef.current.contains(document.activeElement)) {
            // Only close if we are not interacting with our inputs
            // We use a small timeout to allow focus to shift
            setIsOpen(false);
          }
      }, 100);
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
    if (option !== 'custom') {
        setFilter(option);
        setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
      if (tempRange.startDate) {
          const [y1, m1, d1] = tempRange.startDate.split('-').map(Number);
          const start = new Date(y1, m1 - 1, d1);
          
          let end = null;
          if (tempRange.endDate) {
              const [y2, m2, d2] = tempRange.endDate.split('-').map(Number);
              end = new Date(y2, m2 - 1, d2);
          }
          
          setFilter('custom', { startDate: start, endDate: end });
          setIsOpen(false);
      }
  };

  const currentLabel = selectedOption === 'custom' && (customRange.startDate || customRange.endDate)
    ? `${customRange.startDate?.toLocaleDateString('es-ES') || ''}${customRange.endDate ? ` - ${customRange.endDate.toLocaleDateString('es-ES')}` : ''}`
    : options.find(o => o.id === selectedOption)?.label || 'Total';

  return (
    <div className="relative" ref={dropdownRef} data-testid="date-filter-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium text-gray-700"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="max-w-[150px] truncate">{currentLabel}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
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
            
            <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50">
                <p className="font-semibold mb-2 text-xs uppercase tracking-wider text-gray-500">Rango Personalizado</p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={tempRange.startDate}
                            onChange={(e) => setTempRange({ ...tempRange, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hasta (Opcional)</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={tempRange.endDate}
                            onChange={(e) => setTempRange({ ...tempRange, endDate: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={handleApplyCustom}
                        disabled={!tempRange.startDate}
                        className="w-full mt-2 bg-primary text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Aplicar Filtro
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
