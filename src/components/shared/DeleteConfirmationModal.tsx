import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Person } from '../../types';

export type DeletionAction = 'reassign' | 'delete-all';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: DeletionAction, newParentId?: string) => void;
  person: Person | null;
  descendantCount: number;
  parentList: { id: string; nombre: string }[];
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, person, descendantCount, parentList }) => {
  const [action, setAction] = useState<DeletionAction>('reassign');
  const [newParentId, setNewParentId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAction(descendantCount > 0 ? 'reassign' : 'delete-all');
      setNewParentId('');
    }
  }, [isOpen, descendantCount]);

  if (!isOpen || !person) {
    return null;
  }

  const handleConfirm = () => {
    if (descendantCount > 0 && action === 'reassign' && !newParentId) {
      alert('Por favor, selecciona un nuevo padre para reasignar los descendientes.');
      return;
    }
    onConfirm(action, newParentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-60" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        <div className="flex items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Eliminar Registro</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que quieres eliminar a <strong className="font-semibold">{person.nombre}</strong>?
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>

        {descendantCount > 0 && (
          <div className="mt-6 border-t pt-4">
            <p className="text-sm font-medium text-gray-800">
              Este usuario tiene <strong className="font-semibold">{descendantCount}</strong> miembros debajo en la jerarquía.
              Por favor, elige qué hacer con ellos:
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center">
                <input
                  id="reassign-action"
                  name="deletion-action"
                  type="radio"
                  checked={action === 'reassign'}
                  onChange={() => setAction('reassign')}
                  className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                />
                <label htmlFor="reassign-action" className="ml-3 block text-sm font-medium text-gray-700">
                  Reasignar descendientes a un nuevo padre
                </label>
              </div>
              {action === 'reassign' && (
                <div className="ml-7">
                  <select
                    value={newParentId}
                    onChange={(e) => setNewParentId(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="" disabled>Selecciona un nuevo {person.role === 'lider' ? 'líder' : 'brigadista'}...</option>
                    {parentList.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center">
                <input
                  id="delete-all-action"
                  name="deletion-action"
                  type="radio"
                  checked={action === 'delete-all'}
                  onChange={() => setAction('delete-all')}
                  className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"
                />
                <label htmlFor="delete-all-action" className="ml-3 block text-sm font-medium text-gray-700">
                  Eliminar permanentemente a todos los descendientes
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Confirmar Eliminación
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
