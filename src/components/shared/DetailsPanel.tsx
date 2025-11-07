import React, { useState, useEffect } from 'react';
import { X, ChevronsUpDown, Users, Edit, Save, Ban } from 'lucide-react';
import { Person } from '../../types';
import DeleteConfirmationModal, { DeletionAction } from './DeleteConfirmationModal';

interface DetailsPanelProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  lideres: { id: string; nombre: string }[];
  brigadistas: { id: string; nombre: string }[];
  onReassign: (personId: string, newParentId: string, role: 'brigadista' | 'movilizador') => void;
  onUpdate: (personId: string, role: string, updatedData: Partial<Person>) => void;
  onDelete: (personId: string, role: string, action: DeletionAction, newParentId?: string) => void;
  hierarchicalData: Person[];
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ person, isOpen, onClose, lideres, brigadistas, onReassign, onUpdate, onDelete, hierarchicalData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editablePerson, setEditablePerson] = useState<Person | null>(person);
  const [newParentId, setNewParentId] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (person) {
      setEditablePerson(person);
      setNewParentId('');
      setIsEditing(false);
    }
  }, [person]);

  const findParents = (person: Person | null, allData: Person[]): { liderName?: string, brigadistaName?: string, movilizadorName?: string } => {
    if (!person) return {};

    for (const lider of allData) {
      if (person.role === 'brigadista' && lider.id === person.lider_id) {
        return { liderName: lider.name };
      }
      if (lider.children) {
        for (const brigadista of lider.children) {
          if (person.role === 'movilizador' && brigadista.id === person.brigadista_id) {
            return { liderName: lider.name, brigadistaName: brigadista.name };
          }
          if (brigadista.children) {
            for (const movilizador of brigadista.children) {
              if (person.role === 'ciudadano' && movilizador.id === person.movilizador_id) {
                return {
                  liderName: lider.name,
                  brigadistaName: brigadista.name,
                  movilizadorName: movilizador.name
                };
              }
            }
          }
        }
      }
    }
    return {};
  };

  const getDescendantCount = (person: Person | null): number => {
    if (!person || !person.children) return 0;
    let count = person.children.length;
    person.children.forEach(child => {
      count += getDescendantCount(child);
    });
    return count;
  };

  const parentNames = findParents(person, hierarchicalData);

  const getRoleName = (role: string) => {
    switch (role) {
      case 'lider': return 'Líder';
      case 'brigadista': return 'Brigadista';
      case 'movilizador': return 'Movilizador';
      case 'ciudadano': return 'Ciudadano';
      default: return role;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editablePerson) {
      setEditablePerson({ ...editablePerson, [e.target.name]: e.target.value });
    }
  };

  const handleSave = () => {
    if (person && editablePerson) {
      onUpdate(person.id, person.role, editablePerson);
    }
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = (action: DeletionAction, newParentId?: string) => {
    if (person) {
      onDelete(person.id, person.role, action, newParentId);
    }
    setIsDeleteModalOpen(false);
    onClose();
  };

  const detailItems = [
    { label: 'ID', value: person?.id, name: 'id', editable: false },
    { label: 'Rol', value: getRoleName(person?.role || ''), name: 'role', editable: false },
    { label: 'Nombre', value: person?.nombre, name: 'nombre', editable: true },
    { label: 'Clave Electoral', value: person?.clave_electoral, name: 'clave_electoral', editable: true },
    { label: 'CURP', value: person?.curp, name: 'curp', editable: true },
    { label: 'Dirección', value: person?.direccion, name: 'direccion', editable: true },
    { label: 'Colonia', value: person?.colonia, name: 'colonia', editable: true },
    { label: 'Sección', value: person?.seccion, name: 'seccion', editable: true },
    { label: 'Municipio', value: person?.municipio, name: 'municipio', editable: true },
    { label: 'Entidad', value: person?.entidad, name: 'entidad', editable: true },
    { label: 'Teléfono', value: person?.numero_cel, name: 'numero_cel', editable: false },
    { label: 'Teléfono Verificado', value: person?.num_verificado ? 'Sí' : 'No', name: 'num_verificado', editable: false },
    { label: 'Fecha de Registro', value: person ? new Date(person.created_at).toLocaleDateString('es-ES') : '', name: 'created_at', editable: false },
  ];

  const canBeReassigned = person?.role === 'brigadista' || person?.role === 'movilizador';
  const parentListForReassignment = person?.role === 'brigadista' ? lideres : brigadistas;
  const currentParentId = person?.role === 'brigadista' ? person.lider_id : person?.brigadista_id;

  const parentListForDeletion = person ? (person.role === 'lider' ? lideres.filter(l => l.id !== person.id) : brigadistas.filter(b => b.id !== person.id)) : [];

  const handleConfirmReassignment = () => {
    if (!person || !newParentId || newParentId === currentParentId) {
      alert('Por favor, selecciona un nuevo padre diferente al actual.');
      return;
    }
    onReassign(person.id, newParentId, person.role as 'brigadista' | 'movilizador');
  };

  return (
    <>
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black opacity-50"
          onClick={onClose}
        ></div>
      </div>

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full bg-white w-full max-w-md shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {person && (
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

                {/* Hierarchy Section */}
                {person.role !== 'lider' && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-gray-500" />
                      Jerarquía
                    </h4>
                    <dl className="space-y-2">
                      {parentNames.liderName && (
                        <div className="flex justify-between text-sm py-1">
                          <dt className="font-medium text-gray-600">Líder:</dt>
                          <dd className="text-gray-800 text-right">{parentNames.liderName}</dd>
                        </div>
                      )}
                      {parentNames.brigadistaName && (
                        <div className="flex justify-between text-sm py-1">
                          <dt className="font-medium text-gray-600">Brigadista:</dt>
                          <dd className="text-gray-800 text-right">{parentNames.brigadistaName}</dd>
                        </div>
                      )}
                      {parentNames.movilizadorName && (
                        <div className="flex justify-between text-sm py-1">
                          <dt className="font-medium text-gray-600">Movilizador:</dt>
                          <dd className="text-gray-800 text-right">{parentNames.movilizadorName}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Details List or Form */}
                <div className="border-t border-gray-200 pt-4">
                  <dl className="space-y-2">
                    {detailItems.map(item => (
                      item.value ? (
                        <div key={item.label} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                          <dt className="font-medium text-gray-600">{item.label}:</dt>
                          {isEditing && item.editable ? (
                            <input
                              type="text"
                              name={item.name}
                              value={editablePerson?.[item.name as keyof Person] as string || ''}
                              onChange={handleInputChange}
                              className="w-3/5 p-1 text-right border-2 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            />
                          ) : (
                            <dd className="text-gray-800 text-right truncate">{String(item.value)}</dd>
                          )}
                        </div>
                      ) : null
                    ))}
                  </dl>
                </div>

                {/* Reassignment Section */}
                {canBeReassigned && !isEditing && (
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
                          {parentListForReassignment.filter(p => p.id !== currentParentId).map(parent => (
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
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSave}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </button>
                    <button 
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        person={person}
        descendantCount={getDescendantCount(person)}
        parentList={parentListForDeletion}
      />
    </>
  );
};

export default DetailsPanel;