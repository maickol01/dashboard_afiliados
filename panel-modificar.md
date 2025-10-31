### Plan de Implementación: Modificación y Eliminación

Este plan se divide en dos funcionalidades principales: **Modificación (Editar)** y **Eliminación**. Ambas se basan en el `DetailsPanel` ya existente.

---

### **1. Funcionalidad de Modificación (Editar)**

**Objetivo:** Permitir a los usuarios editar los detalles de un miembro de la jerarquía (Líder, Brigadista, etc.) de forma segura y atómica.

**Fase 1: Interfaz de Usuario (Frontend)**

1.  **Habilitar "Modo Edición" en `DetailsPanel.tsx`:**
    *   Se introducirá un estado de "edición" en el panel. Al hacer clic en "Editar", los campos de texto se convertirán en campos de formulario editables.
    *   Los botones cambiarán a "Guardar" y "Cancelar" para gestionar la acción.

2.  **Crear un Formulario de Edición:**
    *   Dentro del `DetailsPanel`, se renderizará un formulario que permitirá modificar campos como nombre, CURP, dirección, sección, etc.
    *   Se añadirán validaciones para asegurar la integridad de los datos (ej. formato de CURP).

3.  **Actualizar `HierarchyPage.tsx`:**
    *   Se creará una función `handleUpdatePerson` que recibirá los datos actualizados del formulario.
    *   Esta función llamará a un nuevo método en `dataService.ts` para persistir los cambios y luego refrescará los datos de la UI.

**Fase 2: Lógica de Servicio y Backend**

1.  **Crear Método `updatePerson` en `dataService.ts`:**
    *   Este método recibirá el ID de la persona, su rol y un objeto con los campos a actualizar.
    *   Será responsable de llamar a una nueva función RPC en Supabase para garantizar que las actualizaciones sean atómicas.

2.  **Crear Función RPC `update_person_details` en Supabase:**
    *   Para garantizar la consistencia, especialmente si se cambia el nombre, esta función actualizará tanto la tabla principal (`lideres`, `brigadistas`, etc.) como la tabla `profiles`.
    *   La función aceptará el ID, el rol y los nuevos datos, y ejecutará las actualizaciones dentro de una transacción segura.

---

### **2. Funcionalidad de Eliminación**

**Objetivo:** Permitir la eliminación segura de miembros de la jerarquía, gestionando adecuadamente a sus descendientes y previniendo la pérdida de datos no intencionada.

**Fase 1: Interfaz de Usuario (Frontend)**

1.  **Implementar Modal de Confirmación:**
    *   Al hacer clic en el botón "Eliminar" en `DetailsPanel.tsx`, se abrirá un modal de confirmación.
    *   Este modal mostrará claramente a quién se va a eliminar y advertirá de las consecuencias.

2.  **Añadir Opciones para Descendientes:**
    *   Si el miembro a eliminar tiene descendientes (ej. un líder con brigadistas), el modal ofrecerá dos opciones:
        1.  **Reasignar descendientes:** Mostrará un selector para elegir un nuevo padre (ej. otro líder).
        2.  **Eliminar descendientes:** Advertirá que se eliminará toda la rama jerárquica bajo esa persona.
    *   Esta es la medida de seguridad más importante para mantener la integridad de la estructura.

3.  **Actualizar `HierarchyPage.tsx`:**
    *   Se creará una función `handleDeletePerson` que se activará desde el modal.
    *   Esta función llamará al `dataService` con el ID de la persona y la acción a tomar con sus descendientes.

**Fase 2: Lógica de Servicio y Backend**

1.  **Crear Método `deletePerson` en `dataService.ts`:**
    *   Este método orquestará la llamada a una función RPC de Supabase, pasando los parámetros necesarios para la eliminación segura.

2.  **Crear Función RPC `delete_person_and_handle_children` en Supabase:**
    *   Esta será una función transaccional robusta que realizará lo siguiente:
        1.  **Identificar** a la persona y a todos sus descendientes.
        2.  **Ejecutar la acción sobre los hijos:** Reasignarlos a un nuevo padre o eliminarlos en cascada, según la opción elegida.
        3.  **Eliminar el registro** de la tabla `profiles`.
        4.  **Eliminar el registro** de su tabla principal (`lideres`, `brigadistas`, etc.).
        5.  **Eliminar el usuario de `auth.users`** para revocar su acceso al sistema. Este paso es crítico y requiere privilegios elevados.

Este plan asegura que las funcionalidades de modificación y eliminación sean robustas, seguras y mantengan la integridad de los datos en todo momento.