## Resumen de Cambios: Panel de Detalles y Reasignación en Tabla Jerárquica

Este documento resume la implementación de una nueva funcionalidad en la tabla jerárquica, que permite ver los detalles de un registro en un panel lateral y reasignar miembros de la jerarquía (brigadistas y movilizadores).

### 1. Creación del Panel de Detalles (`DetailsPanel.tsx`)

- Se creó un nuevo componente en `src/components/shared/DetailsPanel.tsx`.
- Este componente es un panel lateral que se desliza desde la derecha.
- Muestra todos los detalles de la persona seleccionada (nombre, rol, CURP, dirección, etc.).
- Incluye una sección para la reasignación, que solo es visible si la persona seleccionada es un `brigadista` o `movilizador`.
- Contiene botones para "Editar" y "Eliminar" (funcionalidad futura).

### 2. Integración en la Página de Jerarquía (`HierarchyPage.tsx`)

- Se añadió estado a la página para manejar la visibilidad del panel y la persona seleccionada.
- Se implementó la función `handleRowClick` que se activa al hacer clic en una fila de la tabla, mostrando el panel con los datos correspondientes.
- Se añadió la función `handleReassign` que llama al `dataService` para ejecutar la reasignación y luego refresca los datos de la aplicación para mostrar los cambios.
- Se añadieron funciones para obtener las listas de líderes y brigadistas y pasarlas como `props` al `DetailsPanel`.

### 3. Modificación de la Tabla (`HierarchyTable.tsx`)

- Se añadió la propiedad `onRowClick` a la interfaz del componente.
- Se hizo que cada fila (`<tr>`) de la tabla sea clickeable, llamando a la función `onRowClick` y pasando el objeto de la persona de esa fila.

### 4. Lógica de Reasignación en el Backend (Funciones de Supabase)

Tras un proceso de depuración, se determinó que la causa de los fallos era la inconsistencia de datos entre las tablas principales (`lideres`, `brigadistas`) y la tabla `profiles`, específicamente por nombres duplicados con diferentes roles.

La solución final fue crear funciones de base de datos (RPC) que usan una combinación del **nombre** y el **rol** para encontrar de forma única el perfil a actualizar. Esto asegura que la operación sea atómica y robusta.

- **Archivo de Referencia:** Se creó el archivo `funcion-reasignar.md` que contiene el script SQL definitivo.
- **Funciones Creadas:**
    - `reasignar_brigadista(brigadista_id_in TEXT, nuevo_lider_id_in TEXT)`
    - `reasignar_movilizador(movilizador_id_in TEXT, nuevo_brigadista_id_in TEXT)`
- **Lógica de las Funciones:**
    1.  Obtienen el nombre de la persona a mover y del nuevo padre.
    2.  Buscan en la tabla `profiles` el `id` (uuid) que coincida con el `full_name` **Y** el `role` correspondiente.
    3.  Verifican que ambos perfiles existan. Si no, lanzan un error claro.
    4.  Si todo es correcto, ejecutan las dos sentencias `UPDATE`: una en la tabla principal (`brigadistas` o `movilizadores`) y otra en la tabla `profiles`.

### 5. Actualización del Servicio de Datos (`dataService.ts`)

- Se crearon dos nuevas funciones para poblar los menús desplegables:
    - `getLideresList()`
    - `getBrigadistasList()`
- La función `reassignPerson` fue modificada para llamar a las nuevas y robustas funciones RPC de Supabase (`reasignar_brigadista` o `reasignar_movilizador`).
- Se añadió la llamada a `forceRefresh()` después de una reasignación exitosa para asegurar que el caché se invalide y la interfaz de usuario siempre muestre los datos más recientes.
