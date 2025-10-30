import React, { useState, useEffect } from 'react';
import { X, ChevronsUpDown } from 'lucide-react';
import { Person } from '../../types';

interface DetailsPanelProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  lideres: { id: string; nombre: string }[];
  brigadistas: { id: string; nombre: string }[];
  onReassign: (personId: string, newParentId: string, role: 'brigadista' | 'movilizador') => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ person, isOpen, onClose, lideres, brigadistas, onReassign }) => {
  const [newParentId, setNewParentId] = useState('');

  useEffect(() => {
    // Reset selection when panel opens for a new person
    if (person) {
      setNewParentId('');
    }
  }, [person]);

  if (!isOpen || !person) {
    return null;
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'lider': return 'Líder';
      case 'brigadista': return 'Brigadista';
      case 'movilizador': return 'Movilizador';
      case 'ciudadano': return 'Ciudadano';
      default: return role;
    }
  };

  const detailItems = [
    { label: 'ID', value: person.id },
    { label: 'Rol', value: getRoleName(person.role) },
    { label: 'Clave Electoral', value: person.clave_electoral },
    { label: 'CURP', value: person.curp },
    { label: 'Dirección', value: person.direccion },
    { label: 'Colonia', value: person.colonia },
    { label: 'Sección', value: person.seccion },
    { label: 'Municipio', value: person.municipio },
    { label: 'Entidad', value: person.entidad },
    { label: 'Teléfono', value: person.numero_cel },
    { label: 'Teléfono Verificado', value: person.num_verificado ? 'Sí' : 'No' },
    { label: 'Fecha de Registro', value: new Date(person.created_at).toLocaleDateString('es-ES') },
  ];

  const canBeReassigned = person.role === 'brigadista' || person.role === 'movilizador';
  const parentList = person.role === 'brigadista' ? lideres : brigadistas;
  const currentParentId = person.role === 'brigadista' ? person.lider_id : person.brigadista_id;

  const handleConfirmReassignment = () => {
    if (!newParentId || newParentId === currentParentId) {
      alert('Por favor, selecciona un nuevo padre diferente al actual.');
      return;
    }
    onReassign(person!.id, newParentId, person!.role as 'brigadista' | 'movilizador');
  };

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full bg-white w-full max-w-md shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Detalles del Registro</h2>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Person Header */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-primary">{person.nombre}</h3>
                <p className="text-sm text-gray-500">{getRoleName(person.role)}</p>
              </div>

              {/* Details List */}
              <div className="border-t border-gray-200 pt-4">
                <dl className="space-y-2">
                  {detailItems.map(item => (
                    item.value ? (
                      <div key={item.label} className="flex justify-between text-sm py-1 border-b border-gray-100">
                        <dt className="font-medium text-gray-600">{item.label}:</dt>
                        <dd className="text-gray-800 text-right truncate">{String(item.value)}</dd>
                      </div>
                    ) : null
                  ))}
                </dl>
              </div>

              {/* Reassignment Section */}
              {canBeReassigned && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Reasignar</h4>
                  <div className="space-y-2">
                    <label htmlFor="new-parent" className="block text-sm font-medium text-gray-700">
                      {person.role === 'brigadista' ? 'Reasignar a nuevo Líder:' : 'Reasignar a nuevo Brigadista:'}
                    </label>
                    <div className="relative">
                      <select
                        id="new-parent"
                        value={newParentId}
                        onChange={(e) => setNewParentId(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                      >
                        <option value="" disabled>Selecciona una opción...</option>
                        {parentList.filter(p => p.id !== currentParentId).map(parent => (
                          <option key={parent.id} value={parent.id}>{parent.nombre}</option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronsUpDown className="h-5 w-5 text-gray-400" />
                      </span>
                    </div>
                    <button
                      onClick={handleConfirmReassignment}
                      disabled={!newParentId}
                      className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar Reasignación
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-4">
              <button 
                onClick={() => console.log('Edit:', person.id)}
                className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light transition-colors"
              >
                Editar
              </button>
              <button 
                onClick={() => console.log('Delete:', person.id)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPanel;
