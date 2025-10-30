### **Plan de Implementación**

**Fase 1: Implementación de la Interfaz de Usuario (Solo Visualización)**

1.  **Crear Componente de Panel Lateral (`DetailsPanel.tsx`):**
    *   Crearé un nuevo componente reutilizable que funcionará como un panel lateral (o "drawer") que se deslizará desde la derecha.
    *   Este panel recibirá la información de la persona seleccionada y una función para cerrarse.
    *   Mostrará todos los campos del registro (nombre, CURP, dirección, etc.) en un formato de solo lectura.
    *   Incluirá botones de "Editar" y "Eliminar", aunque inicialmente solo imprimirán un mensaje en la consola para simular la acción.

2.  **Actualizar la Página de Jerarquía (`HierarchyPage.tsx`):**
    *   Añadiré un estado para manejar qué registro está seleccionado y si el panel debe estar visible.
    *   Integraré el nuevo componente `DetailsPanel` en esta página y controlaré su visibilidad.

3.  **Habilitar Clic en Filas (`HierarchyTable.tsx`):**
    *   Modificaré la tabla para que cada fila sea clickeable.
    *   Al hacer clic en una fila, se actualizará el estado en `HierarchyPage` para mostrar los detalles de la persona correspondiente en el panel lateral.

**Fase 2: Implementación de Funcionalidad (Editar y Eliminar)**

Esta fase es más compleja y la abordaremos después de que la interfaz de usuario esté en su lugar.

1.  **Formulario de Edición:**
    *   Al hacer clic en "Editar", el panel mostrará un formulario con los datos actuales del registro.
    *   Se creará una función en `dataService.ts` para actualizar el registro en la tabla correspondiente (`lideres`, `brigadistas`, etc.) y en la tabla `profiles` si es necesario.

2.  **Lógica de Eliminación:**
    *   El botón "Eliminar" mostrará un diálogo de confirmación para evitar borrados accidentales.
    *   La eliminación es una operación delicada y requerirá:
        *   **Borrado en Cascada:** Eliminar un registro (ej. un `lider`) debe gestionar correctamente a todos sus descendientes (brigadistas, movilizadores, etc.).
        *   **Borrado de Usuario:** Se deberá eliminar el usuario correspondiente de la tabla `auth.users` de Supabase (lo que requiere privilegios de administrador) y de la tabla `profiles`.

### **Próximos Pasos**

Comenzaré con la **Fase 1**. Primero, crearé la estructura básica del componente del panel lateral y luego lo integraré con la página y la tabla existentes para que puedas ver la información al hacer clic.
