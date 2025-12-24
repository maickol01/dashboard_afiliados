import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Person } from '../types';

// Función simple para exportar tabla HTML directamente (mantener como opción)
export const exportTableToExcel = (tableId: string, fileName: string = 'tabla_datos') => {
  const tabla = document.getElementById(tableId);

  if (tabla) {
    const worksheet = XLSX.utils.table_to_sheet(tabla);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const finalFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(dataBlob, finalFileName);
  } else {
    console.error(`No se encontró la tabla con ID: ${tableId}`);
  }
};

// Función avanzada para exportar con estructura jerárquica interactiva
export const exportInteractiveExcel = (data: Person[], selectedItems: string[]) => {
  const workbook = XLSX.utils.book_new();

  // Función para obtener todas las personas de forma plana
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

  // Obtener todas las personas relacionadas con los elementos seleccionados
  const allPeople = getAllPeopleFlat(data);
  const relatedPeople = new Set<string>();

  selectedItems.forEach(selectedId => {
    const person = allPeople.find(p => p.id === selectedId);
    if (!person) return;

    relatedPeople.add(selectedId);

    if (person.role === 'lider') {
      const leader = data.find(l => l.id === selectedId);
      if (leader) {
        const addHierarchy = (people: Person[]) => {
          people.forEach(p => {
            relatedPeople.add(p.id);
            if (p.children) {
              addHierarchy(p.children);
            }
          });
        };
        if (leader.children) {
          addHierarchy(leader.children);
        }
      }
    }
  });

  // Crear estructura jerárquica para Excel con agrupación
  const createInteractiveExcelData = () => {
    const excelData: Array<Record<string, string | number>> = [];
    const rowsConfig: Array<{ level?: number; startRow?: number; endRow?: number }> = [];
    let currentRow = 1; // Empezamos en 1 porque la fila 0 es el header

    // Función recursiva para agregar datos con niveles de agrupación
    const addPersonWithGrouping = (person: Person, level: number = 0) => {
      // Agregar la persona actual
      excelData.push({
        // Core fields
        'ID': person.id,
        'Nombre': person.name,
        'Rol': getRoleName(person.role),
        'Fecha Registro': (person.registrationDate || person.created_at).toLocaleDateString('es-ES'),
        'Ciudadanos Registrados': person.registeredCount,
        // Electoral fields
        'Clave Electoral': person.clave_electoral || '',
        'CURP': person.curp || '',
        'Sección': person.seccion || '',
        'Entidad': person.entidad || '',
        'Municipio': person.municipio || '',
        // Contact fields
        'Dirección': person.direccion || '',
        'Colonia': person.colonia || '',
        'Código Postal': person.codigo_postal || '',
        'Número Celular': person.numero_cel || '',
        'Verificado': person.num_verificado ? 'Sí' : 'No',
        // Relationship fields (where applicable)
        'ID Líder': person.lider_id || '',
        'ID Brigadista': person.brigadista_id || '',
        'ID Movilizador': person.movilizador_id || ''
      });

      // Si no es el nivel base (líder), configurar agrupación
      if (level > 0) {
        rowsConfig[currentRow] = { level: level };
      }

      currentRow++;

      // Agregar hijos si existen y están en la lista filtrada
      if (person.children) {
        const filteredChildren = person.children.filter(child => relatedPeople.has(child.id));
        filteredChildren.forEach(child => {
          addPersonWithGrouping(child, level + 1);
        });
      }
    };

    // Procesar solo los líderes que están en la selección
    const selectedLeaders = data.filter(leader => relatedPeople.has(leader.id));
    selectedLeaders.forEach(leader => {
      addPersonWithGrouping(leader, 0);
    });

    return { excelData, rowsConfig };
  };

  const { excelData, rowsConfig } = createInteractiveExcelData();

  // Crear la hoja de cálculo con agrupación
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Configurar agrupación de filas (!rows)
  worksheet['!rows'] = rowsConfig;

  // Configurar anchos de columna
  worksheet['!cols'] = [
    { wch: 12 }, // ID
    { wch: 25 }, // Nombre
    { wch: 15 }, // Rol
    { wch: 15 }, // Fecha
    { wch: 18 }, // Registrados
    { wch: 15 }, // Clave Electoral
    { wch: 18 }, // CURP
    { wch: 10 }, // Sección
    { wch: 15 }, // Entidad
    { wch: 15 }, // Municipio
    { wch: 25 }, // Dirección
    { wch: 15 }, // Colonia
    { wch: 12 }, // Código Postal
    { wch: 15 }, // Número Celular
    { wch: 10 }, // Verificado
    { wch: 12 }, // ID Líder
    { wch: 12 }, // ID Brigadista
    { wch: 12 }  // ID Movilizador
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Estructura Interactiva');

  // Crear hoja de resumen
  const filteredPeople = allPeople.filter(person => relatedPeople.has(person.id));
  const leaders = filteredPeople.filter(p => p.role === 'lider');
  const brigadiers = filteredPeople.filter(p => p.role === 'brigadista');
  const mobilizers = filteredPeople.filter(p => p.role === 'movilizador');
  const citizens = filteredPeople.filter(p => p.role === 'ciudadano');

  const summaryData = [
    { Concepto: 'Total Líderes Seleccionados', Cantidad: leaders.length },
    { Concepto: 'Total Brigadistas', Cantidad: brigadiers.length },
    { Concepto: 'Total Movilizadores', Cantidad: mobilizers.length },
    { Concepto: 'Total Ciudadanos', Cantidad: citizens.length },
    { Concepto: 'Total Personas', Cantidad: filteredPeople.length },
    { Concepto: '', Cantidad: '' },
    { Concepto: 'INSTRUCCIONES DE USO:', Cantidad: '' },
    { Concepto: '1. Haga clic en los números de fila', Cantidad: '' },
    { Concepto: '2. Use los botones + y - para expandir/contraer', Cantidad: '' },
    { Concepto: '3. Los brigadistas aparecen bajo sus líderes', Cantidad: '' },
    { Concepto: '4. Los movilizadores bajo sus brigadistas', Cantidad: '' },
    { Concepto: '5. Los ciudadanos bajo sus movilizadores', Cantidad: '' },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen e Instrucciones');

  // Generar archivo
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  const fileName = `estructura_interactiva_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(dataBlob, fileName);
};

export const exportToExcel = (data: Person[], selectedItems: string[]) => {
  const workbook = XLSX.utils.book_new();

  // Función para obtener todas las personas de forma plana
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

  // Función para encontrar la jerarquía completa de una persona
  const findPersonHierarchy = (personId: string, allPeople: Person[]): { leader?: Person, brigadier?: Person, mobilizer?: Person, citizen?: Person } => {
    const person = allPeople.find(p => p.id === personId);
    if (!person) return {};

    const hierarchy: { leader?: Person, brigadier?: Person, mobilizer?: Person, citizen?: Person } = {};

    if (person.role === 'lider') {
      hierarchy.leader = person;
    } else if (person.role === 'brigadista') {
      hierarchy.brigadier = person;
      const leader = data.find(l => l.children?.some(b => b.id === personId));
      if (leader) hierarchy.leader = leader;
    } else if (person.role === 'movilizador') {
      hierarchy.mobilizer = person;
      for (const leader of data) {
        const brigadier = leader.children?.find(b => b.children?.some(m => m.id === personId));
        if (brigadier) {
          hierarchy.leader = leader;
          hierarchy.brigadier = brigadier;
          break;
        }
      }
    } else if (person.role === 'ciudadano') {
      hierarchy.citizen = person;
      for (const leader of data) {
        for (const brigadier of leader.children || []) {
          const mobilizer = brigadier.children?.find(m => m.children?.some(c => c.id === personId));
          if (mobilizer) {
            hierarchy.leader = leader;
            hierarchy.brigadier = brigadier;
            hierarchy.mobilizer = mobilizer;
            break;
          }
        }
        if (hierarchy.mobilizer) break;
      }
    }

    return hierarchy;
  };

  // Obtener todas las personas relacionadas con los elementos seleccionados
  const allPeople = getAllPeopleFlat(data);
  const relatedPeople = new Set<string>();

  selectedItems.forEach(selectedId => {
    const person = allPeople.find(p => p.id === selectedId);
    if (!person) return;

    relatedPeople.add(selectedId);

    if (person.role === 'lider') {
      const leader = data.find(l => l.id === selectedId);
      if (leader) {
        const addHierarchy = (people: Person[]) => {
          people.forEach(p => {
            relatedPeople.add(p.id);
            if (p.children) {
              addHierarchy(p.children);
            }
          });
        };
        if (leader.children) {
          addHierarchy(leader.children);
        }
      }
    }
  });

  const filteredPeople = allPeople.filter(person => relatedPeople.has(person.id));

  // Crear la estructura jerárquica para Excel que imite la tabla
  const createHierarchicalExcelData = () => {
    const excelData: Array<Record<string, string | number>> = [];

    // Función recursiva para agregar datos con indentación
    const addPersonWithHierarchy = (person: Person, level: number = 0, parentInfo: string = '') => {
      const indent = '  '.repeat(level); // Indentación visual

      excelData.push({
        'Nivel': level,
        'ID': `${indent}${person.id}`,
        'Nombre': `${indent}${person.name}`,
        'Rol': getRoleName(person.role),
        'Fecha Registro': (person.registrationDate || person.created_at).toLocaleDateString('es-ES'),
        'Ciudadanos Registrados': person.registeredCount,
        'Jerarquía Superior': parentInfo,
        // Core database fields
        'Clave Electoral': person.clave_electoral || '',
        'CURP': person.curp || '',
        'Sección': person.seccion || '',
        'Entidad': person.entidad || '',
        'Municipio': person.municipio || '',
        // Contact fields
        'Dirección': person.direccion || '',
        'Colonia': person.colonia || '',
        'Código Postal': person.codigo_postal || '',
        'Número Celular': person.numero_cel || '',
        'Verificado': person.num_verificado ? 'Sí' : 'No',
        // Relationship fields (where applicable)
        'ID Líder': person.lider_id || '',
        'ID Brigadista': person.brigadista_id || '',
        'ID Movilizador': person.movilizador_id || '',
        'ID Sin Formato': person.id, // Para referencias
        'Nombre Sin Formato': person.name // Para referencias
      });

      // Agregar hijos si existen y están en la lista filtrada
      if (person.children) {
        const filteredChildren = person.children.filter(child => relatedPeople.has(child.id));
        filteredChildren.forEach(child => {
          const newParentInfo = parentInfo ? `${parentInfo} > ${person.name}` : person.name;
          addPersonWithHierarchy(child, level + 1, newParentInfo);
        });
      }
    };

    // Procesar solo los líderes que están en la selección
    const selectedLeaders = data.filter(leader => relatedPeople.has(leader.id));
    selectedLeaders.forEach(leader => {
      addPersonWithHierarchy(leader, 0);
    });

    return excelData;
  };

  // Crear hoja principal con estructura jerárquica
  const hierarchicalData = createHierarchicalExcelData();
  const hierarchySheet = XLSX.utils.json_to_sheet(hierarchicalData);

  // Configurar anchos de columna
  hierarchySheet['!cols'] = [
    { wch: 8 },  // Nivel
    { wch: 20 }, // ID
    { wch: 25 }, // Nombre
    { wch: 12 }, // Rol
    { wch: 15 }, // Fecha
    { wch: 18 }, // Registrados
    { wch: 30 }, // Jerarquía Superior
    { wch: 15 }, // Clave Electoral
    { wch: 18 }, // CURP
    { wch: 10 }, // Sección
    { wch: 15 }, // Entidad
    { wch: 15 }, // Municipio
    { wch: 25 }, // Dirección
    { wch: 15 }, // Colonia
    { wch: 12 }, // Código Postal
    { wch: 15 }, // Número Celular
    { wch: 10 }, // Verificado
    { wch: 12 }, // ID Líder
    { wch: 12 }, // ID Brigadista
    { wch: 12 }, // ID Movilizador
    { wch: 12 }, // ID Sin Formato
    { wch: 20 }  // Nombre Sin Formato
  ];

  XLSX.utils.book_append_sheet(workbook, hierarchySheet, 'Estructura Jerárquica');

  // Crear hoja de datos planos para análisis
  const flatData = filteredPeople.map(person => {
    const hierarchy = findPersonHierarchy(person.id, allPeople);
    return {
      // Core fields
      'ID': person.id,
      'Nombre': person.name,
      'Rol': getRoleName(person.role),
      'Fecha Registro': (person.registrationDate || person.created_at).toLocaleDateString('es-ES'),
      'Ciudadanos Registrados': person.registeredCount,
      // Electoral fields
      'Clave Electoral': person.clave_electoral || '',
      'CURP': person.curp || '',
      'Sección': person.seccion || '',
      'Entidad': person.entidad || '',
      'Municipio': person.municipio || '',
      // Contact fields
      'Dirección': person.direccion || '',
      'Colonia': person.colonia || '',
      'Código Postal': person.codigo_postal || '',
      'Número Celular': person.numero_cel || '',
      'Verificado': person.num_verificado ? 'Sí' : 'No',
      // Relationship fields
      'ID Líder Directo': person.lider_id || '',
      'ID Brigadista Directo': person.brigadista_id || '',
      'ID Movilizador Directo': person.movilizador_id || '',
      // Hierarchy information
      'Líder': hierarchy.leader?.name || '',
      'ID Líder': hierarchy.leader?.id || '',
      'Brigadista': hierarchy.brigadier?.name || '',
      'ID Brigadista': hierarchy.brigadier?.id || '',
      'Movilizador': hierarchy.mobilizer?.name || '',
      'ID Movilizador': hierarchy.mobilizer?.id || '',
    };
  });

  const flatSheet = XLSX.utils.json_to_sheet(flatData);
  XLSX.utils.book_append_sheet(workbook, flatSheet, 'Datos Planos');

  // Crear hojas separadas por rol
  const leaders = filteredPeople.filter(p => p.role === 'lider');
  const brigadiers = filteredPeople.filter(p => p.role === 'brigadista');
  const mobilizers = filteredPeople.filter(p => p.role === 'movilizador');
  const citizens = filteredPeople.filter(p => p.role === 'ciudadano');

  if (leaders.length > 0) {
    const leadersData = leaders.map(leader => ({
      // Core fields
      ID: leader.id,
      Nombre: leader.name,
      'Fecha Registro': (leader.registrationDate || leader.created_at).toLocaleDateString('es-ES'),
      'Ciudadanos Registrados': leader.registeredCount,
      // Electoral fields
      'Clave Electoral': leader.clave_electoral || '',
      'CURP': leader.curp || '',
      'Sección': leader.seccion || '',
      'Entidad': leader.entidad || '',
      'Municipio': leader.municipio || '',
      // Contact fields
      'Dirección': leader.direccion || '',
      'Colonia': leader.colonia || '',
      'Código Postal': leader.codigo_postal || '',
      'Número Celular': leader.numero_cel || '',
      'Verificado': leader.num_verificado ? 'Sí' : 'No',
    }));

    const leadersSheet = XLSX.utils.json_to_sheet(leadersData);
    XLSX.utils.book_append_sheet(workbook, leadersSheet, 'Líderes');
  }

  if (brigadiers.length > 0) {
    const brigadiersData = brigadiers.map(brigadier => {
      const hierarchy = findPersonHierarchy(brigadier.id, allPeople);
      return {
        // Core fields
        ID: brigadier.id,
        Nombre: brigadier.name,
        'Fecha Registro': (brigadier.registrationDate || brigadier.created_at).toLocaleDateString('es-ES'),
        'Ciudadanos Registrados': brigadier.registeredCount,
        // Electoral fields
        'Clave Electoral': brigadier.clave_electoral || '',
        'CURP': brigadier.curp || '',
        'Sección': brigadier.seccion || '',
        'Entidad': brigadier.entidad || '',
        'Municipio': brigadier.municipio || '',
        // Contact fields
        'Dirección': brigadier.direccion || '',
        'Colonia': brigadier.colonia || '',
        'Código Postal': brigadier.codigo_postal || '',
        'Número Celular': brigadier.numero_cel || '',
        'Verificado': brigadier.num_verificado ? 'Sí' : 'No',
        // Relationship fields
        'ID Líder': brigadier.lider_id || '',
        'Líder': hierarchy.leader?.name || '',
      };
    });

    const brigadiersSheet = XLSX.utils.json_to_sheet(brigadiersData);
    XLSX.utils.book_append_sheet(workbook, brigadiersSheet, 'Brigadistas');
  }

  if (mobilizers.length > 0) {
    const mobilizersData = mobilizers.map(mobilizer => {
      const hierarchy = findPersonHierarchy(mobilizer.id, allPeople);
      return {
        // Core fields
        ID: mobilizer.id,
        Nombre: mobilizer.name,
        'Fecha Registro': (mobilizer.registrationDate || mobilizer.created_at).toLocaleDateString('es-ES'),
        'Ciudadanos Registrados': mobilizer.registeredCount,
        // Electoral fields
        'Clave Electoral': mobilizer.clave_electoral || '',
        'CURP': mobilizer.curp || '',
        'Sección': mobilizer.seccion || '',
        'Entidad': mobilizer.entidad || '',
        'Municipio': mobilizer.municipio || '',
        // Contact fields
        'Dirección': mobilizer.direccion || '',
        'Colonia': mobilizer.colonia || '',
        'Código Postal': mobilizer.codigo_postal || '',
        'Número Celular': mobilizer.numero_cel || '',
        'Verificado': mobilizer.num_verificado ? 'Sí' : 'No',
        // Relationship fields
        'ID Brigadista': mobilizer.brigadista_id || '',
        'Brigadista': hierarchy.brigadier?.name || '',
        'Líder': hierarchy.leader?.name || '',
      };
    });

    const mobilizersSheet = XLSX.utils.json_to_sheet(mobilizersData);
    XLSX.utils.book_append_sheet(workbook, mobilizersSheet, 'Movilizadores');
  }

  if (citizens.length > 0) {
    const citizensData = citizens.map(citizen => {
      const hierarchy = findPersonHierarchy(citizen.id, allPeople);
      return {
        // Core fields
        ID: citizen.id,
        Nombre: citizen.name,
        'Fecha Registro': (citizen.registrationDate || citizen.created_at).toLocaleDateString('es-ES'),
        // Electoral fields
        'Clave Electoral': citizen.clave_electoral || '',
        'CURP': citizen.curp || '',
        'Sección': citizen.seccion || '',
        'Entidad': citizen.entidad || '',
        'Municipio': citizen.municipio || '',
        // Contact fields
        'Dirección': citizen.direccion || '',
        'Colonia': citizen.colonia || '',
        'Código Postal': citizen.codigo_postal || '',
        'Número Celular': citizen.numero_cel || '',
        'Verificado': citizen.num_verificado ? 'Sí' : 'No',
        // Relationship fields
        'ID Movilizador': citizen.movilizador_id || '',
        'Movilizador': hierarchy.mobilizer?.name || '',
        'Brigadista': hierarchy.brigadier?.name || '',
        'Líder': hierarchy.leader?.name || '',
      };
    });

    const citizensSheet = XLSX.utils.json_to_sheet(citizensData);
    XLSX.utils.book_append_sheet(workbook, citizensSheet, 'Ciudadanos');
  }

  // Crear hoja de resumen
  const summaryData = [
    { Concepto: 'Total Líderes Seleccionados', Cantidad: leaders.length },
    { Concepto: 'Total Brigadistas', Cantidad: brigadiers.length },
    { Concepto: 'Total Movilizadores', Cantidad: mobilizers.length },
    { Concepto: 'Total Ciudadanos', Cantidad: citizens.length },
    { Concepto: 'Total Personas', Cantidad: filteredPeople.length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Generar archivo
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  const fileName = `estructura_electoral_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(dataBlob, fileName);
};

export const exportToPDF = (data: Person[], selectedItems: string[]) => {
  const doc = new jsPDF();

  // Función para obtener todas las personas de forma plana
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

  // Obtener todas las personas relacionadas con los elementos seleccionados
  const allPeople = getAllPeopleFlat(data);
  const relatedPeople = new Set<string>();

  selectedItems.forEach(selectedId => {
    const person = allPeople.find(p => p.id === selectedId);
    if (!person) return;

    relatedPeople.add(selectedId);

    if (person.role === 'lider') {
      const leader = data.find(l => l.id === selectedId);
      if (leader) {
        const addHierarchy = (people: Person[]) => {
          people.forEach(p => {
            relatedPeople.add(p.id);
            if (p.children) {
              addHierarchy(p.children);
            }
          });
        };
        if (leader.children) {
          addHierarchy(leader.children);
        }
      }
    }
  });

  const filteredPeople = allPeople.filter(person => relatedPeople.has(person.id));

  // Configurar el documento
  doc.setFontSize(20);
  doc.setTextColor(35, 91, 78); // Color primario
  doc.text('Dashboard Electoral - Estructura Jerárquica', 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, 20, 30);
  doc.text(`Total de personas: ${filteredPeople.length}`, 20, 40);

  // Crear datos para la tabla jerárquica con campos principales
  const createHierarchicalPDFData = () => {
    const pdfData: string[][] = [];

    // Función recursiva para agregar datos con indentación
    const addPersonWithHierarchy = (person: Person, level: number = 0) => {
      const indent = '  '.repeat(level); // Indentación visual

      pdfData.push([
        `${indent}${person.id}`,
        `${indent}${person.name}`,
        getRoleName(person.role),
        (person.registrationDate || person.created_at).toLocaleDateString('es-ES'),
        person.registeredCount.toString(),
        person.entidad || '',
        person.numero_cel || '',
        person.num_verificado ? 'Sí' : 'No'
      ]);

      // Agregar hijos si existen y están en la lista filtrada
      if (person.children) {
        const filteredChildren = person.children.filter(child => relatedPeople.has(child.id));
        filteredChildren.forEach(child => {
          addPersonWithHierarchy(child, level + 1);
        });
      }
    };

    // Procesar solo los líderes que están en la selección
    const selectedLeaders = data.filter(leader => relatedPeople.has(leader.id));
    selectedLeaders.forEach(leader => {
      addPersonWithHierarchy(leader, 0);
    });

    return pdfData;
  };

  const hierarchicalData = createHierarchicalPDFData();

  // Crear tabla principal con campos adicionales
  autoTable(doc, {
    head: [['ID', 'Nombre', 'Rol', 'Fecha', 'Registrados', 'Entidad', 'Teléfono', 'Verificado']],
    body: hierarchicalData,
    startY: 50,
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [35, 91, 78], // Color primario
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 20 }, // ID
      1: { cellWidth: 35 }, // Nombre
      2: { cellWidth: 20 }, // Rol
      3: { cellWidth: 22 }, // Fecha
      4: { cellWidth: 18 }, // Registrados
      5: { cellWidth: 25 }, // Entidad
      6: { cellWidth: 25 }, // Teléfono
      7: { cellWidth: 15 }, // Verificado
    },
    margin: { top: 50, left: 10, right: 10 },
  });

  // Agregar resumen en nueva página si hay espacio
  const finalY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 50;

  if (finalY > 250) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(35, 91, 78);
    doc.text('Resumen', 20, 20);
  } else {
    doc.setFontSize(16);
    doc.setTextColor(35, 91, 78);
    doc.text('Resumen', 20, finalY + 20);
  }

  const leaders = filteredPeople.filter(p => p.role === 'lider');
  const brigadiers = filteredPeople.filter(p => p.role === 'brigadista');
  const mobilizers = filteredPeople.filter(p => p.role === 'movilizador');
  const citizens = filteredPeople.filter(p => p.role === 'ciudadano');

  const summaryData = [
    ['Total Líderes', leaders.length.toString()],
    ['Total Brigadistas', brigadiers.length.toString()],
    ['Total Movilizadores', mobilizers.length.toString()],
    ['Total Ciudadanos', citizens.length.toString()],
    ['Total General', filteredPeople.length.toString()],
  ];

  autoTable(doc, {
    head: [['Concepto', 'Cantidad']],
    body: summaryData,
    startY: finalY > 250 ? 30 : finalY + 30,
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [159, 34, 65], // Color secundario
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
    },
    margin: { left: 20, right: 20 },
  });

  // Agregar página detallada con todos los campos de la base de datos
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(35, 91, 78);
  doc.text('Detalle Completo de Campos de Base de Datos', 20, 20);

  // Crear tabla detallada con todos los campos
  const createDetailedPDFData = () => {
    const detailedData: string[][] = [];

    filteredPeople.forEach(person => {
      detailedData.push([
        person.id,
        person.name,
        getRoleName(person.role),
        person.clave_electoral || '',
        person.curp || '',
        person.seccion || '',
        person.entidad || '',
        person.municipio || '',
        person.direccion || '',
        person.colonia || '',
        person.codigo_postal || '',
        person.numero_cel || '',
        person.num_verificado ? 'Sí' : 'No',
        (person.registrationDate || person.created_at).toLocaleDateString('es-ES')
      ]);
    });

    return detailedData;
  };

  const detailedData = createDetailedPDFData();

  // Crear tabla detallada con todos los campos de la base de datos
  autoTable(doc, {
    head: [['ID', 'Nombre', 'Rol', 'Clave Electoral', 'CURP', 'Sección', 'Entidad', 'Municipio', 'Dirección', 'Colonia', 'C.P.', 'Teléfono', 'Verificado', 'Fecha']],
    body: detailedData,
    startY: 30,
    styles: {
      fontSize: 6,
      cellPadding: 1,
    },
    headStyles: {
      fillColor: [35, 91, 78],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 15 }, // ID
      1: { cellWidth: 25 }, // Nombre
      2: { cellWidth: 15 }, // Rol
      3: { cellWidth: 18 }, // Clave Electoral
      4: { cellWidth: 20 }, // CURP
      5: { cellWidth: 12 }, // Sección
      6: { cellWidth: 15 }, // Entidad
      7: { cellWidth: 15 }, // Municipio
      8: { cellWidth: 25 }, // Dirección
      9: { cellWidth: 15 }, // Colonia
      10: { cellWidth: 10 }, // C.P.
      11: { cellWidth: 18 }, // Teléfono
      12: { cellWidth: 12 }, // Verificado
      13: { cellWidth: 15 }, // Fecha
    },
    margin: { top: 30, left: 5, right: 5 },
    theme: 'striped'
  });

  // Generar archivo
  const fileName = `estructura_electoral_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
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