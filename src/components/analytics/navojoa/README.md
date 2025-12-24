# SectionVerticalBarChart - Análisis de Densidad Electoral

## Descripción
Componente de gráfica de barras verticales que muestra el análisis de densidad electoral por sección con funcionalidades avanzadas de filtrado, ordenamiento, drill-down y exportación.

## Nuevas Funcionalidades Implementadas

### 🎯 1. Filtros por Densidad
- **Todas las densidades**: Muestra todas las secciones
- **Alta densidad (≥50)**: Solo secciones con 50+ registros
- **Media densidad (20-49)**: Secciones con 20-49 registros  
- **Baja densidad (<20)**: Secciones con menos de 20 registros

### 📊 2. Ordenamiento Interactivo
- **Más registros primero**: Orden descendente por total de registros
- **Menos registros primero**: Orden ascendente por total de registros
- **Sección A-Z**: Orden alfabético por número de sección
- **Sección Z-A**: Orden alfabético inverso por número de sección

### 🔍 3. Drill-down con Modal Popup
Al hacer clic en cualquier barra se abre un modal popup que incluye:
- **Información General**: Número de sección, colonia, total de registros, nivel de densidad
- **Distribución por Roles**: Desglose visual de líderes, brigadistas, movilizadores y ciudadanos
- **Métricas de Rendimiento**: Indicadores de rendimiento y eficiencia
- **Recomendaciones**: Sugerencias automáticas basadas en los datos de la sección
- **Cierre Intuitivo**: Se cierra al hacer clic afuera del modal o presionar la tecla ESC
- **Fondo Completamente Transparente**: Sin overlay oscuro, la página de fondo se mantiene completamente visible

### 📤 4. Exportación Básica
- **Exportar como TXT**: Reporte completo en formato de texto plano
- **Exportar como CSV**: Datos estructurados para Excel/Google Sheets

## Uso del Componente

```tsx
import SectionVerticalBarChart from './SectionVerticalBarChart';

<SectionVerticalBarChart 
  sectionData={navojoaData?.sectionData || []}
  onSectionClick={handleSectionClick}
  loading={loading}
/>
```

## Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `sectionData` | `NavojoaElectoralSection[]` | Array de datos de secciones electorales |
| `onSectionClick` | `(sectionNumber: string) => void` | Callback opcional cuando se hace clic en una sección |
| `loading` | `boolean` | Estado de carga del componente |

## Características Técnicas

### Responsive Design
- Adaptación automática para dispositivos móviles
- Controles reorganizados en pantallas pequeñas
- Tooltips y modales optimizados para touch

### Performance
- Memoización de datos procesados con `useMemo`
- Filtrado y ordenamiento eficiente
- Límite de secciones mostradas (10 en móvil, 20 en desktop)

### Accesibilidad
- Controles de teclado para filtros y ordenamiento
- Modal cerrable con tecla ESC
- Colores con suficiente contraste
- Textos descriptivos para lectores de pantalla
- Prevención de scroll del body cuando el modal está abierto

## Estados del Componente

### Loading State
Muestra skeleton loaders mientras se cargan los datos.

### Empty State
Muestra mensaje informativo cuando no hay datos disponibles.

### Error Handling
Manejo robusto de errores en filtrado, ordenamiento y exportación.

## Colores de Densidad

- 🟢 **Verde (#22c55e)**: Alta densidad (≥50 registros)
- 🟡 **Amarillo (#f59e0b)**: Media densidad (20-49 registros)  
- 🔴 **Rojo (#ef4444)**: Baja densidad (<20 registros)

## Tests

El componente incluye 15 tests que cubren:
- Renderizado básico
- Funcionalidad de filtros
- Ordenamiento de datos
- Interacciones de usuario
- Modal popup con cierre por ESC y click afuera
- Estados de carga y error
- Exportación de datos
- Responsive design

Para ejecutar los tests:
```bash
npm test -- SectionVerticalBarChart.test.tsx
```

## Próximas Mejoras Sugeridas

1. **Filtros Avanzados**: Por colonia, rango de fechas
2. **Comparación**: Selección múltiple de secciones
3. **Tendencias**: Gráficos de evolución temporal
4. **Exportación PDF**: Reportes visuales completos
5. **Sincronización**: Integración con otros componentes del dashboard