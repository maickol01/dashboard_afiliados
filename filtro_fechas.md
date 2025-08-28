# Plan de Implementación: Filtro de Fechas para Tabla Jerárquica

## 1. Resumen

Este documento detalla el plan para agregar una funcionalidad de filtro por fechas a la "Tabla Jerárquica". El objetivo es permitir a los usuarios visualizar los ciudadanos registrados en un día, semana o mes específico.

## 2. Archivos a Modificar

*   **`src/components/hierarchy/HierarchyPage.tsx`**: Para agregar la interfaz de usuario del filtro y manejar el estado del filtro.
*   **`src/components/tables/HierarchyTable.tsx`**: Para recibir los datos filtrados y mostrarlos.
*   **`src/hooks/useData.ts`**: Para agregar la lógica de filtrado de datos por fecha.
*   **`src/services/dataService.ts`**: Para crear una nueva función que consulte los datos de Supabase con un filtro de fecha.

## 3. Plan de Implementación

### Paso 1: Crear Componentes de UI para el Filtro

1.  **Crear `src/components/shared/DateFilter.tsx`**: Este componente contendrá:
    *   Un dropdown para seleccionar el tipo de filtro: "Día", "Semana", "Mes".
    *   Un componente de calendario (Date Picker) para seleccionar la fecha.
    *   Un botón para aplicar el filtro.
2.  **Estilo**: Reutilizar los estilos existentes de Tailwind CSS para que el componente sea consistente con el resto de la aplicación.

### Paso 2: Actualizar `HierarchyPage.tsx`

1.  **Integrar `DateFilter`**: Agregar el componente `DateFilter` a la página.
2.  **Manejar Estado del Filtro**: Usar `useState` para almacenar la fecha de inicio y fin seleccionada por el usuario.
3.  **Llamar a `useData` con Filtro**: Pasar las fechas seleccionadas al hook `useData` para que pueda filtrar los datos.

```tsx
// src/components/hierarchy/HierarchyPage.tsx (Ejemplo)

const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null);
const { data, loading, error, refetchData } = useData(dateRange);

const handleFilterChange = (newDateRange) => {
  setDateRange(newDateRange);
};

return (
  <div>
    <DateFilter onChange={handleFilterChange} />
    <HierarchyTable data={data} ... />
  </div>
);
```

### Paso 3: Actualizar el Hook `useData`

1.  **Modificar `useData`**: Actualizar el hook para que acepte un rango de fechas como parámetro opcional.
2.  **Llamar a `dataService`**: Si se proporciona un rango de fechas, llamar a una nueva función en `dataService` (`getHierarchicalDataByDateRange`) en lugar de `getAllHierarchicalData`.

```ts
// src/hooks/useData.ts (Ejemplo)

export const useData = (dateRange) => {
  useEffect(() => {
    const fetchData = async () => {
      if (dateRange) {
        const hierarchicalData = await DataService.getHierarchicalDataByDateRange(dateRange.startDate, dateRange.endDate);
        setData(hierarchicalData);
      } else {
        const hierarchicalData = await DataService.getAllHierarchicalData();
        setData(hierarchicalData);
      }
    };
    fetchData();
  }, [dateRange]);

  // ... resto del hook
};
```

### Paso 4: Actualizar `dataService.ts`

1.  **Crear `getHierarchicalDataByDateRange`**: Esta nueva función tomará una fecha de inicio y una fecha de fin como argumentos.
2.  **Construir Query de Supabase**: La función construirá una query de Supabase que filtra la tabla `ciudadanos` por el campo `created_at` usando las fechas proporcionadas.
3.  **Reutilizar Lógica Existente**: La función reutilizará la lógica de `getAllHierarchicalData` para construir la estructura jerárquica a partir de los datos filtrados.

```ts
// src/services/dataService.ts (Ejemplo)

static async getHierarchicalDataByDateRange(startDate: Date, endDate: Date): Promise<Person[]> {
  const { data: ciudadanos, error } = await supabase
    .from('ciudadanos')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    throw new DatabaseError('Failed to fetch citizens by date range');
  }

  // Lógica para reconstruir la jerarquía a partir de los ciudadanos filtrados
  // ...

  return hierarchicalData;
}
```

## 4. Código a Reusar

*   **`useData` hook**: Se reutilizará la estructura existente del hook, agregando la lógica para manejar el filtro de fecha.
*   **`DataService.getAllHierarchicalData`**: La lógica de transformación de datos de esta función se reutilizará en la nueva función `getHierarchicalDataByDateRange`.
*   **Componentes de UI**: Se reutilizarán los componentes existentes de la librería de componentes y los estilos de Tailwind CSS.

## 5. Pruebas

Se agregarán pruebas unitarias para:

*   El nuevo componente `DateFilter`.
*   La nueva función `getHierarchicalDataByDateRange` en `dataService.ts`.
*   La lógica de filtrado en el hook `useData`.

También se realizarán pruebas de integración para asegurar que la funcionalidad completa del filtro de fechas funcione correctamente en la aplicación.
