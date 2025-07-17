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
        'ID': person.id,
        'Nombre': person.name,
        'Rol': getRoleName(person.role),
        'Fecha Registro': (person.registrationDate || person.created_at).toLocaleDateString('es-ES'),
        'Ciudadanos Registrados': person.registeredCount,
        'Región': person.region || person.entidad || '',
        'Teléfono': person.contactInfo?.phone || '',
        'Email': person.contactInfo?.email || '',
        'Verificado': person.contactInfo?.verified ? 'Sí' : 'No'
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
    { wch: 12 }, // Región
    { wch: 15 }, // Teléfono
    { wch: 25 }, // Email
    { wch: 12 }  // Verificado
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
    { wch: 12 }, // ID Sin Formato
    { wch: 20 }  // Nombre Sin Formato
  ];

  XLSX.utils.book_append_sheet(workbook, hierarchySheet, 'Estructura Jerárquica');

  // Crear hoja de datos planos para análisis
  const flatData = filteredPeople.map(person => {
    const hierarchy = findPersonHierarchy(person.id, allPeople);
    return {
      'ID': person.id,
      'Nombre': person.name,
      'Rol': getRoleName(person.role),
      'Fecha Registro': (person.registrationDate || person.created_at).toLocaleDateString('es-ES'),
      'Ciudadanos Registrados': person.registeredCount,
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
      ID: leader.id,
      Nombre: leader.name,
      'Fecha Registro': (leader.registrationDate || leader.created_at).toLocaleDateString('es-ES'),
      'Ciudadanos Registrados': leader.registeredCount,
    }));

    const leadersSheet = XLSX.utils.json_to_sheet(leadersData);
    XLSX.utils.book_append_sheet(workbook, leadersSheet, 'Líderes');
  }

  if (brigadiers.length > 0) {
    const brigadiersData = brigadiers.map(brigadier => {
      const hierarchy = findPersonHierarchy(brigadier.id, allPeople);
      return {
        ID: brigadier.id,
        Nombre: brigadier.name,
        'Fecha Registro': (brigadier.registrationDate || brigadier.created_at).toLocaleDateString('es-ES'),
        'Ciudadanos Registrados': brigadier.registeredCount,
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
        ID: mobilizer.id,
        Nombre: mobilizer.name,
        'Fecha Registro': (mobilizer.registrationDate || mobilizer.created_at).toLocaleDateString('es-ES'),
        'Ciudadanos Registrados': mobilizer.registeredCount,
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
        ID: citizen.id,
        Nombre: citizen.name,
        'Fecha Registro': (citizen.registrationDate || citizen.created_at).toLocaleDateString('es-ES'),
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

  // Crear datos para la tabla jerárquica
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
        person.registeredCount.toString()
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

  // Crear tabla principal
  autoTable(doc, {
    head: [['ID', 'Nombre', 'Rol', 'Fecha Registro', 'Registrados']],
    body: hierarchicalData,
    startY: 50,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [35, 91, 78], // Color primario
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 25 }, // ID
      1: { cellWidth: 40 }, // Nombre
      2: { cellWidth: 25 }, // Rol
      3: { cellWidth: 30 }, // Fecha
      4: { cellWidth: 20 }, // Registrados
    },
    margin: { top: 50, left: 20, right: 20 },
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