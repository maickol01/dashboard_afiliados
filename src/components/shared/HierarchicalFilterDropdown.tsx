import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Check, UserPlus } from 'lucide-react';

interface HierarchicalFilterDropdownProps {
  label: string;
  options: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  icon?: 'lider' | 'brigadista';
  placeholder?: string;
}

const HierarchicalFilterDropdown: React.FC<HierarchicalFilterDropdownProps> = ({
  label,
  options,
  selectedId,
  onSelect,
  icon = 'lider',
  placeholder = 'Todos'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string | null) => {
    onSelect(id);
    setIsOpen(false);
  };

  const selectedOption = options.find(o => o.id === selectedId);
  const displayLabel = selectedOption ? selectedOption.name : placeholder;

  const IconComponent = icon === 'lider' ? Users : UserPlus;

  return (
    <div className="relative" ref={dropdownRef} data-testid="hierarchical-filter-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium text-gray-700"
      >
        <IconComponent className="h-4 w-4 text-gray-500" />
        <span className="max-w-[120px] truncate">{displayLabel}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 max-h-60 overflow-y-auto" role="menu">
            <button
              onClick={() => handleSelect(null)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 ${
                selectedId === null ? 'text-primary font-medium bg-blue-50' : 'text-gray-700'
              }`}
            >
              {placeholder}
              {selectedId === null && <Check className="h-4 w-4" />}
            </button>
            
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 ${
                  selectedId === option.id ? 'text-primary font-medium bg-blue-50' : 'text-gray-700'
                }`}
              >
                <span className="truncate">{option.name}</span>
                {selectedId === option.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalFilterDropdown;
