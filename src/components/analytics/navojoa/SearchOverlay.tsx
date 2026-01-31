import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Person } from '../../../types';

interface SearchOverlayProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    allPeople: Person[];
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ searchTerm, onSearchChange, allPeople }) => {
    const [localTerm, setLocalTerm] = useState(searchTerm);
    const [suggestions, setSuggestions] = useState<Person[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync local term with prop if it changes externally
    useEffect(() => {
        setLocalTerm(searchTerm);
    }, [searchTerm]);

    // Filter suggestions when localTerm changes
    useEffect(() => {
        if (!localTerm || localTerm.length < 2) {
            setSuggestions([]);
            return;
        }

        const term = localTerm.toLowerCase();
        const matches = allPeople
            .filter(p => p.nombre.toLowerCase().includes(term) || (p.clave_electoral && p.clave_electoral.toLowerCase().includes(term)))
            .slice(0, 8);

        setSuggestions(matches);
        setShowSuggestions(true);
    }, [localTerm, allPeople]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (person: Person) => {
        setLocalTerm(person.nombre);
        onSearchChange(person.nombre);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (suggestions.length > 0) {
                handleSelect(suggestions[0]);
            } else {
                onSearchChange(localTerm);
                setShowSuggestions(false);
            }
        }
    };

    return (
        <div ref={wrapperRef} className="absolute top-4 left-14 z-[1000] w-72">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar afiliado..."
                    value={localTerm}
                    onChange={(e) => {
                        setLocalTerm(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white/95 backdrop-blur-sm border border-gray-300 text-gray-700 text-sm rounded-lg shadow-md focus:ring-primary focus:border-primary block p-2 pl-9"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                {localTerm && (
                    <button
                        onClick={() => {
                            setLocalTerm('');
                            onSearchChange('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-[1001] w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                    {suggestions.map(person => (
                        <li
                            key={person.id}
                            onClick={() => handleSelect(person)}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                        >
                            <div className="font-medium text-gray-800">{person.nombre}</div>
                            <div className="text-xs text-gray-500 flex justify-between">
                                <span>{person.role}</span>
                                {person.clave_electoral && <span>{person.clave_electoral}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
