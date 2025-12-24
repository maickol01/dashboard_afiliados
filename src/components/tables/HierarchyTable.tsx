import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Search, Filter, Download, FileText } from 'lucide-react';
import { Person } from '../../types';
import { exportInteractiveExcel } from '../../utils/export';

interface HierarchyTableProps {
  data: Person[];
  onExportPDF: (selectedItems: string[]) => void;
  onRowClick: (person: Person) => void;
}

const INITIAL_LOAD_COUNT = 50;
const LOAD_MORE_COUNT = 20;

const HierarchyTable: React.FC<HierarchyTableProps> = ({ data, onExportPDF, onRowClick }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [displayLimit, setDisplayLimit] = useState(INITIAL_LOAD_COUNT);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayLimit(INITIAL_LOAD_COUNT);
  }, [searchTerm, roleFilter, data]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayLimit((prevLimit) => prevLimit + LOAD_MORE_COUNT);
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreRef, displayLimit]);

  const handleExportExcel = () => {
    exportInteractiveExcel(data, Array.from(selectedItems));
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const getAllPeopleFlat = (people: Person[]): Person[] => {
    const result: Person[] = [];
    const flatten = (persons: Person[]) => {
      persons.forEach(person => {
        result.push(person);
        if (person.children && person.children.length > 0) {
          flatten(person.children);
        }
      });
    };
    flatten(people);
    return result;
  };

  const getFilteredData = (): Person[] => {
    const allPeople = getAllPeopleFlat(data);

    return allPeople.filter(person => {
      const matchesRole = roleFilter === 'all' || person.role === roleFilter;
      if (!matchesRole) return false;

      if (searchTerm.trim() === '') return true;
      const lowerSearchTerm = searchTerm.toLowerCase();

      return (
        person.nombre.toLowerCase().includes(lowerSearchTerm) ||
        person.id.toLowerCase().includes(lowerSearchTerm) ||
        (person.direccion && person.direccion.toLowerCase().includes(lowerSearchTerm)) ||
        (person.colonia && person.colonia.toLowerCase().includes(lowerSearchTerm)) ||
        (person.seccion && person.seccion.toLowerCase().includes(lowerSearchTerm)) ||
        (person.numero_cel && person.numero_cel.toLowerCase().includes(lowerSearchTerm))
      );
    });
  };

  const filteredData = getFilteredData();
  const showHierarchicalView = roleFilter === 'all' && searchTerm.trim() === '';

  const selectAllCurrentRole = () => {
    const idsToSelect = filteredData.map(p => p.id);
    const allSelected = idsToSelect.length > 0 && idsToSelect.every(id => selectedItems.has(id));

    const newSelected = new Set(selectedItems);
    if (allSelected) {
      idsToSelect.forEach(id => newSelected.delete(id));
    } else {
      idsToSelect.forEach(id => newSelected.add(id));
    }
    setSelectedItems(newSelected);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'lider': return 'bg-[#235B4E] text-white';
      case 'brigadista': return 'bg-[#9F2241] text-white';
      case 'movilizador': return 'bg-[#BC955C] text-white';
      case 'ciudadano': return 'bg-[#6F7271] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'lider': return 'Líder';
      case 'brigadista': return 'Brigadista';
      case 'movilizador': return 'Movilizador';
      case 'ciudadano': return 'Ciudadano';
      default: return role;
    }
  };

  const renderHierarchyLevel = (people: Person[], level: number = 0): React.ReactNode[] => {
    return people.slice(0, displayLimit).map((person) => (
      <React.Fragment key={person.id}>
        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick(person)}>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(person.role)}`}>
              {getRoleName(person.role)}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
              {person.children && person.children.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExpanded(person.id); }}
                  className="mr-2 p-1 rounded-sm hover:bg-gray-200"
                >
                  {expandedItems.has(person.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              <input
                type="checkbox"
                checked={selectedItems.has(person.id)}
                onChange={(e) => { e.stopPropagation(); toggleItemSelection(person.id); }}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded-sm"
              />
              <span className="text-sm font-medium text-gray-900">{person.nombre}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.direccion || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.colonia || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.seccion || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.numero_cel || '-'}</td>
        </tr>
        {expandedItems.has(person.id) && person.children &&
          renderHierarchyLevel(person.children, level + 1)
        }
      </React.Fragment>
    ));
  };

  const renderFlatData = (people: Person[]) => {
    return people.slice(0, displayLimit).map((person) => (
      <tr key={person.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick(person)}>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(person.role)}`}>
            {getRoleName(person.role)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedItems.has(person.id)}
              onChange={(e) => { e.stopPropagation(); toggleItemSelection(person.id); }}
              className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded-sm"
            />
            <span className="text-sm font-medium text-gray-900">{person.nombre}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.direccion || '-'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.colonia || '-'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.seccion || '-'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.numero_cel || '-'}</td>
      </tr>
    ));
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, dirección, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="all">Todos los roles</option>
                <option value="lider">Líderes</option>
                <option value="brigadista">Brigadistas</option>
                <option value="movilizador">Movilizadores</option>
                <option value="ciudadano">Ciudadanos</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={selectAllCurrentRole}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300 text-sm"
            >
              Seleccionar Visibles
            </button>
            <button
              onClick={handleExportExcel}
              disabled={selectedItems.size === 0}
              className="flex items-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel ({selectedItems.size})
            </button>
            <button
              onClick={() => onExportPDF(Array.from(selectedItems))}
              disabled={selectedItems.size === 0}
              className="flex items-center px-3 py-2 bg-secondary text-white rounded-md hover:bg-secondary-light disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF ({selectedItems.size})
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table id="hierarchy-table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colonia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sección</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {showHierarchicalView
              ? renderHierarchyLevel(data)
              : renderFlatData(filteredData)
            }
          </tbody>
        </table>
        {filteredData.length > displayLimit && (
          <div
            ref={loadMoreRef}
            className="h-10 flex items-center justify-center text-gray-500"
          >
            Cargando más elementos...
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchyTable;