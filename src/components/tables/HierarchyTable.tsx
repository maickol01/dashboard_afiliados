import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Filter, Download, FileText } from 'lucide-react';
import { Person } from '../../types';
import { exportInteractiveExcel } from '../../utils/export';

interface HierarchyTableProps {
  data: Person[];
  onExportPDF: (selectedItems: string[]) => void;
}

const HierarchyTable: React.FC<HierarchyTableProps> = ({ data, onExportPDF }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  const getFilteredDataWithHierarchy = (): Person[] => {
    if (roleFilter === 'all') {
      // Vista jerárquica completa
      return data.filter(person => {
        const matchesSearch = person.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            person.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (person.direccion && person.direccion.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (person.colonia && person.colonia.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (person.seccion && person.seccion.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (person.numero_cel && person.numero_cel.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      });
    } else {
      // Vista filtrada por rol pero manteniendo estructura jerárquica
      const allPeople = getAllPeopleFlat(data);
      const filteredPeople = allPeople.filter(person => {
        const matchesSearch = person.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            person.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (person.direccion && person.direccion.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (person.colonia && person.colonia.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (person.seccion && person.seccion.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (person.numero_cel && person.numero_cel.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = person.role === roleFilter;
        return matchesSearch && matchesRole;
      });

      // Reconstruir la estructura jerárquica para los elementos filtrados
      if (roleFilter === 'leader') {
        return filteredPeople.map(leader => {
          const originalLeader = data.find(l => l.id === leader.id);
          return originalLeader ? { ...originalLeader } : leader;
        });
      } else if (roleFilter === 'brigadier') {
        // Crear estructura donde los brigadistas son el nivel superior
        return filteredPeople.map(brigadier => {
          // Encontrar el brigadista original con sus hijos
          let originalBrigadier: Person | undefined;
          for (const leader of data) {
            const foundBrigadier = leader.children?.find(b => b.id === brigadier.id);
            if (foundBrigadier) {
              originalBrigadier = foundBrigadier;
              break;
            }
          }
          return originalBrigadier ? { ...originalBrigadier } : brigadier;
        });
      } else if (roleFilter === 'mobilizer') {
        // Crear estructura donde los movilizadores son el nivel superior
        return filteredPeople.map(mobilizer => {
          let originalMobilizer: Person | undefined;
          for (const leader of data) {
            for (const brigadier of leader.children || []) {
              const foundMobilizer = brigadier.children?.find(m => m.id === mobilizer.id);
              if (foundMobilizer) {
                originalMobilizer = foundMobilizer;
                break;
              }
            }
            if (originalMobilizer) break;
          }
          return originalMobilizer ? { ...originalMobilizer } : mobilizer;
        });
      } else {
        // Para ciudadanos, mostrar vista plana
        return filteredPeople;
      }
    }
  };

  // Función para seleccionar todos los elementos del rol actual
  const selectAllCurrentRole = () => {
    const filteredData = getFilteredDataWithHierarchy();
    const allCurrentRoleIds: string[] = [];

    if (roleFilter === 'all') {
      // Seleccionar todos los líderes
      allCurrentRoleIds.push(...data.map(leader => leader.id));
    } else if (roleFilter === 'citizen') {
      // Para ciudadanos, obtener IDs directamente
      allCurrentRoleIds.push(...filteredData.map(person => person.id));
    } else {
      // Para otros roles, obtener IDs de la vista filtrada
      allCurrentRoleIds.push(...filteredData.map(person => person.id));
    }

    const allSelected = allCurrentRoleIds.every(id => selectedItems.has(id));
    
    const newSelected = new Set(selectedItems);
    if (allSelected) {
      allCurrentRoleIds.forEach(id => newSelected.delete(id));
    } else {
      allCurrentRoleIds.forEach(id => newSelected.add(id));
    }
    setSelectedItems(newSelected);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'lider':
      case 'leader': return 'bg-[#235B4E] text-white'; // Primary color
      case 'brigadista':
      case 'brigadier': return 'bg-[#9F2241] text-white'; // Secondary color
      case 'movilizador':
      case 'mobilizer': return 'bg-[#BC955C] text-white'; // Accent color
      case 'ciudadano':
      case 'citizen': return 'bg-[#6F7271] text-white'; // Neutral color
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'lider': 
      case 'leader': return 'Líder';
      case 'brigadista': 
      case 'brigadier': return 'Brigadista';
      case 'movilizador': 
      case 'mobilizer': return 'Movilizador';
      case 'ciudadano': 
      case 'citizen': return 'Ciudadano';
      default: return role;
    }
  };

  const getSelectAllButtonText = () => {
    const filteredData = getFilteredDataWithHierarchy();
    let allCurrentRoleIds: string[] = [];

    if (roleFilter === 'all') {
      allCurrentRoleIds = data.map(leader => leader.id);
    } else {
      allCurrentRoleIds = filteredData.map(person => person.id);
    }

    const allSelected = allCurrentRoleIds.length > 0 && allCurrentRoleIds.every(id => selectedItems.has(id));
    
    switch (roleFilter) {
      case 'all':
        return allSelected ? 'Deseleccionar Todos los Líderes' : 'Seleccionar Todos los Líderes';
      case 'leader':
        return allSelected ? 'Deseleccionar Todos los Líderes' : 'Seleccionar Todos los Líderes';
      case 'brigadier':
        return allSelected ? 'Deseleccionar Todos los Brigadistas' : 'Seleccionar Todos los Brigadistas';
      case 'mobilizer':
        return allSelected ? 'Deseleccionar Todos los Movilizadores' : 'Seleccionar Todos los Movilizadores';
      case 'citizen':
        return allSelected ? 'Deseleccionar Todos los Ciudadanos' : 'Seleccionar Todos los Ciudadanos';
      default:
        return 'Seleccionar Todos';
    }
  };

  const renderHierarchyLevel = (people: Person[], level: number = 0) => {
    return people.map((person) => (
      <React.Fragment key={person.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(person.role)}`}>
              {getRoleName(person.role)}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
              {person.children && person.children.length > 0 && (
                <button
                  onClick={() => toggleExpanded(person.id)}
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
                onChange={() => toggleItemSelection(person.id)}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded-sm"
              />
              <span className="text-sm font-medium text-gray-900">{person.nombre}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {person.direccion || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {person.colonia || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {person.seccion || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {person.numero_cel || '-'}
          </td>
        </tr>
        {expandedItems.has(person.id) && person.children && 
          renderHierarchyLevel(person.children, level + 1)
        }
      </React.Fragment>
    ));
  };

  const renderFlatData = (people: Person[]) => {
    return people.map((person) => (
      <tr key={person.id} className="hover:bg-gray-50">
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
              onChange={() => toggleItemSelection(person.id)}
              className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded-sm"
            />
            <span className="text-sm font-medium text-gray-900">{person.nombre}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {person.direccion || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {person.colonia || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {person.seccion || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {person.numero_cel || '-'}
        </td>
      </tr>
    ));
  };

  const filteredData = getFilteredDataWithHierarchy();

  // Determinar si mostrar vista jerárquica o plana
  const showHierarchicalView = roleFilter === 'all' || roleFilter === 'leader' || roleFilter === 'brigadier' || roleFilter === 'mobilizer';

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Controles */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, dirección, colonia, sección o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            
            {/* Filtro por rol */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="all">Todos los roles</option>
                <option value="leader">Líderes</option>
                <option value="brigadier">Brigadistas</option>
                <option value="mobilizer">Movilizadores</option>
                <option value="citizen">Ciudadanos</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Seleccionar todos */}
            <button
              onClick={selectAllCurrentRole}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300 text-sm"
            >
              {getSelectAllButtonText()}
            </button>
            
            {/* Exportar Excel */}
            <button
              onClick={handleExportExcel}
              disabled={selectedItems.size === 0}
              className="flex items-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel ({selectedItems.size})
            </button>

            {/* Exportar PDF */}
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

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table id="hierarchy-table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dirección
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Colonia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sección
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {showHierarchicalView 
              ? renderHierarchyLevel(filteredData)
              : renderFlatData(filteredData)
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HierarchyTable;