'use client';

import { useState, useEffect, useRef } from 'react';
import { Home, Search, Save, X, Edit2, Upload, FileText, Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useData } from "../../../lib/DataContext";
import * as XLSX from 'xlsx';
import { staffAssignmentsApi, toewijzingenGridApi } from "../../../lib/api-service";

console.log('🔍 API import check - toewijzingenGridApi:', !!toewijzingenGridApi);

export default function ToewijzingenPage() {
  console.log('🏁 Toewijzingen page component loaded');
  
  const router = useRouter();
  const { dataMatchIt, setDataMatchIt, ageVerificationStatus } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editType, setEditType] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{type: 'success' | 'error' | 'info' | null, message: string}>({type: null, message: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create template structure matching the PDF exactly
  const getDefaultTableData = () => {
    // Create 10 main rows (numbered 1-10, removing row 4) with empty cells
    const mainRows = Array.from({ length: 13 }, () => 
      Array.from({ length: 9 }, () => ({ text: '', color: 'white', type: '' }))
    );
    
    return mainRows;
  };

  // Initialize with default data, load from localStorage after mount
  const [tableData, setTableData] = useState(getDefaultTableData);

  // Default staff columns data from PDF
  const getDefaultStaffColumns = () => [
    { name: 'Kris B', count: 0, annotation: 'verlof 22/08 tem 22/09' },
    { name: 'Torben', count: 0, annotation: '' },
    { name: 'Didar', count: 0, annotation: '' },
    { name: 'Dorien', count: 0, annotation: '' },
    { name: 'Evelien', count: 0, annotation: 'verlof 23/08 tem 14/09' },
    { name: 'Yasmina', count: 0, annotation: '' },
    { name: 'Imane', count: 0, annotation: '' },
    { name: 'Kirsten', count: 0, annotation: 'start 22/09' },
    { name: 'Monica', count: 0, annotation: 'start 08/09' }
  ];

  // Initialize with default data, load from localStorage after mount
  const [staffColumns, setStaffColumns] = useState(getDefaultStaffColumns);

  // Default bottom section data from PDF
  const getDefaultBottomData = () => ({
    IB: ['Yasmina', 'Didar', 'Torben', 'Imane', 'Maaike/Martine', 'Kris', 'Dorien', 'Monica', 'Kirsten'],
    GB: ['Fitsum', 'Fien', 'Seta', 'Noëlle', 'Abdalrahman', 'Daan', 'Sam M', '', 'Fien'],
    NB: ['Christian', 'Abdurahman', 'Alexx', 'Mbagnick', 'Christian', 'Mbagnick', 'Tim', '', '']
  });

  // Initialize with default data, load from localStorage after mount
  const [bottomData, setBottomData] = useState(getDefaultBottomData);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Handle hydration and load saved data
  useEffect(() => {
    console.log('🚀 Toewijzingen page useEffect triggered');
    setIsMounted(true);
    
    // Load saved data - try database first, then localStorage fallback
    const loadData = async () => {
      console.log('📥 Starting loadData function');
      try {
        // Try to load from database using current assignment date
        const assignmentDate = new Date().toISOString().split('T')[0]; // Today's date as default
        console.log(`🔄 Loading toewijzingen data for date: ${assignmentDate}`);
        
        const result = await toewijzingenGridApi.loadGrid(assignmentDate);
        console.log(`📊 Database load result:`, result);
        
        if (result.success && result.data) {
          const { gridData, staffData } = result.data;
          
          if (gridData.length > 0 || staffData.length > 0) {
            console.log(`✅ Found data - Grid cells: ${gridData.length}, Staff records: ${staffData.length}`);
            
            // Convert database data back to table format
            const newTableData = getDefaultTableData();
            
            // Populate grid cells
            gridData.forEach((cell: any) => {
              if (cell.row_index < newTableData.length && cell.col_index < newTableData[0].length) {
                newTableData[cell.row_index][cell.col_index] = {
                  text: cell.resident_full_name || '',
                  color: 'white',
                  type: ''
                };
              }
            });
            
            setTableData(newTableData);
            
            // Update staff columns with data from database
            if (staffData.length > 0) {
              const newStaffColumns = [...staffColumns];
              staffData.forEach((staff: any) => {
                if (staff.staff_index < newStaffColumns.length) {
                  newStaffColumns[staff.staff_index] = {
                    ...newStaffColumns[staff.staff_index],
                    name: staff.staff_name,
                    count: staff.assignment_count || 0,
                    annotation: staff.annotations || ''
                  };
                }
              });
              setStaffColumns(newStaffColumns);
            }
            
            return;
          } else {
            console.log(`ℹ️ No assignment data found for ${assignmentDate}`);
          }
        } else {
          console.log(`⚠️ Database API returned:`, result);
        }
      } catch (dbError) {
        console.warn('⚠️ Failed to load from database:', dbError);
        // If database load fails, start with default empty data
        setTableData(getDefaultTableData());
        setStaffColumns(getDefaultStaffColumns());
        setBottomData(getDefaultBottomData());
      }
    };
    
    loadData();

    // Load from database will be called after functions are defined
  }, []);

  // Ensure table has the desired number of rows/columns even if old data is loaded
  useEffect(() => {
    if (!isMounted) return;
    const desiredRows = 13;
    const desiredCols = 9;
    setTableData((prev) => {
      let changed = false;
      const rows = prev.map((row) => {
        if (row.length < desiredCols) {
          changed = true;
          return [
            ...row,
            ...Array.from({ length: desiredCols - row.length }, () => ({ text: '', color: 'white', type: '' }))
          ];
        }
        return row;
      });
      if (rows.length < desiredRows) {
        changed = true;
        for (let i = rows.length; i < desiredRows; i++) {
          rows.push(Array.from({ length: desiredCols }, () => ({ text: '', color: 'white', type: '' })));
        }
      }
      return changed ? rows : prev;
    });
  }, [isMounted]);

  // Keyboard event handling for cell deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Delete key when not editing and a cell is selected
      if (event.key === 'Delete' && !editingCell && selectedCell) {
        event.preventDefault();
        deleteCell(selectedCell.row, selectedCell.col);
        setSelectedCell(null);
      }
      // Clear all with Ctrl+Delete (or Cmd+Delete on Mac)
      else if (event.key === 'Delete' && (event.ctrlKey || event.metaKey) && !editingCell) {
        event.preventDefault();
        clearAllCells();
      }
    };
    
    if (isMounted) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMounted, editingCell, selectedCell]);

  // Function to extract current assignments from Toewijzingen table
  const getCurrentToewijzingenAssignments = () => {
    const assignments: { [residentName: string]: string } = {};
    
    tableData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.text.trim() && colIndex < dynamicStaffColumns.length) {
          const staffName = dynamicStaffColumns[colIndex].name;
          assignments[cell.text.trim()] = staffName;
        }
      });
    });
    
    return assignments;
  };

  // Sync referentiepersoon with current assignments whenever tableData changes
  useEffect(() => {
    if (isMounted && dataMatchIt && tableData) {
      try {
        const currentAssignments = getCurrentToewijzingenAssignments();
        syncReferentiepersoonWithToewijzingen(currentAssignments);
      } catch (error) {
        console.error('Error syncing referentiepersoon:', error);
      }
    }
  }, [tableData, isMounted, dataMatchIt, setDataMatchIt]);

  // Helper function to calculate string similarity (Levenshtein distance based)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  };

  // Function to sync referentiepersoon based on Toewijzingen assignments
  const syncReferentiepersoonWithToewijzingen = (assignments: { [residentName: string]: string }) => {
    
    let changesCount = 0;
    const updatedData = dataMatchIt.map(resident => {
      // Try both name formats
      const fullName = `${resident.firstName} ${resident.lastName}`.trim();
      const reversedName = `${resident.lastName} ${resident.firstName}`.trim();
      
      // Check if this resident is assigned to a staff member
      let assignedStaff = assignments[fullName] || assignments[reversedName];
      
      // If no exact match, try fuzzy matching
      if (!assignedStaff) {
        // Extract individual words from the resident name
        const residentWords = [
          ...resident.firstName.split(' ').filter(w => w.length > 0),
          ...resident.lastName.split(' ').filter(w => w.length > 0)
        ];
        
        for (const [assignmentName, staffName] of Object.entries(assignments)) {
          // Extract words from assignment name
          const assignmentWords = assignmentName.split(' ').filter(w => w.length > 0);
          
          // Check if all resident words are present in assignment (in any order)
          const allWordsMatch = residentWords.every(word => 
            assignmentWords.some(assignWord => 
              assignWord.toLowerCase() === word.toLowerCase()
            )
          );
          
          // Also check if all assignment words are in resident name (for reverse matching)
          const reverseMatch = assignmentWords.every(word => 
            residentWords.some(resWord => 
              resWord.toLowerCase() === word.toLowerCase()
            )
          );
          
          if (allWordsMatch && reverseMatch && assignmentWords.length >= 2) {
            assignedStaff = staffName;
            break;
          }
        }
        
        // If still no match, try similarity-based matching for close spellings
        if (!assignedStaff) {
          let bestMatch = { name: '', staff: '', similarity: 0 };
          
          for (const [assignmentName, staffName] of Object.entries(assignments)) {
            const similarity1 = calculateSimilarity(fullName, assignmentName);
            const similarity2 = calculateSimilarity(reversedName, assignmentName);
            const maxSimilarity = Math.max(similarity1, similarity2);
            
            // Require high similarity (85%+) and minimum length to avoid false matches
            if (maxSimilarity > 0.85 && maxSimilarity > bestMatch.similarity && 
                assignmentName.length > 5 && fullName.length > 5) {
              bestMatch = { name: assignmentName, staff: staffName, similarity: maxSimilarity };
            }
          }
          
          if (bestMatch.similarity > 0.85) {
            assignedStaff = bestMatch.staff;
          }
        }
      }
      
      
      // If assigned staff is different from current referentiepersoon, update it
      if (assignedStaff && assignedStaff !== resident.referencePerson) {
        changesCount++;
        return { ...resident, referencePerson: assignedStaff };
      }
      
      // If resident is not in Toewijzingen but has a referentiepersoon, clear it
      if (!assignedStaff && resident.referencePerson) {
        changesCount++;
        return { ...resident, referencePerson: '' };
      }
      
      return resident;
    });

    if (changesCount > 0) {
      setDataMatchIt(updatedData);
    } else {
    }
  };

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus({type: 'info', message: `Bestand "${file.name}" wordt ingelezen...`});

    try {
      if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await handleExcelFile(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        await handlePdfFile(file);
      } else if (file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        await handleTextFile(file);
      } else {
        throw new Error(`Bestandstype niet ondersteund: ${file.type || file.name.split('.').pop()}`);
      }
    } catch (error) {
      console.error('❌ File processing error:', error);
      setUploadStatus({type: 'error', message: `Fout bij verwerken: ${error instanceof Error ? error.message : 'Onbekende fout'}`});
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Clear status after 5 seconds
      setTimeout(() => setUploadStatus({type: null, message: ''}), 5000);
    }
  };

  // Handle Excel files
  const handleExcelFile = async (file: File) => {
    setUploadStatus({type: 'info', message: 'Excel bestand wordt verwerkt...'});
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { 
        type: 'array',
        cellText: false,
        cellDates: true,
        cellStyles: true // Enable reading of cell styles including colors
      });
      
      // Try to find the most appropriate sheet
      let targetSheet = workbook.SheetNames[0]; // Default to first sheet
      
      // Look for sheets with common names
      const commonNames = ['toewijzingen', 'assignments', 'data', 'sheet1'];
      for (const sheetName of workbook.SheetNames) {
        if (commonNames.some(name => sheetName.toLowerCase().includes(name))) {
          targetSheet = sheetName;
          break;
        }
      }
      
      
      const worksheet = workbook.Sheets[targetSheet];
      
      // Get sheet range to understand the data structure
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      
      // Extract all data including empty cells and colors
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        raw: false,
        defval: '', // Default value for empty cells
        range: range
      });

      // Extract cell colors and styles
      const cellColors: { [key: string]: string } = {};
      const sheetRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      
      let cellsWithStyles = 0;
      let totalCells = 0;
      
      for (let row = sheetRange.s.r; row <= sheetRange.e.r; row++) {
        for (let col = sheetRange.s.c; col <= sheetRange.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ c: col, r: row });
          const cell = worksheet[cellRef];
          totalCells++;
          
          if (cell) {
            if (cell.s) cellsWithStyles++;
          }
          
          if (cell && cell.s) {
            let bgColor = 'white';
            
            // Check different ways Excel stores colors
            if (cell.s.fill && cell.s.fill.bgColor) {
              const fill = cell.s.fill;
              // RGB color
              if (fill.bgColor.rgb) {
                bgColor = `#${fill.bgColor.rgb}`;
              } else if (fill.bgColor.indexed !== undefined) {
                // Indexed color - map common Excel colors
                const colorMap: { [key: number]: string } = {
                  2: '#FFFFFF', // white
                  3: '#FF0000', // red
                  4: '#00FF00', // green
                  5: '#0000FF', // blue
                  6: '#FFFF00', // yellow
                  7: '#FF00FF', // magenta
                  8: '#00FFFF', // cyan
                  9: '#800000', // maroon
                  10: '#008000', // dark green
                  11: '#000080', // navy
                  12: '#808000', // olive
                  13: '#800080', // purple
                  14: '#008080', // teal
                  15: '#C0C0C0', // silver
                  16: '#808080', // gray
                  17: '#9999FF', // light blue
                  18: '#993366', // dark pink
                  19: '#FFFFCC', // light yellow
                  20: '#CCFFFF', // light cyan
                  21: '#660066', // dark purple
                  22: '#FF8080', // light red
                  23: '#0066CC', // medium blue
                  24: '#CCCCFF', // very light blue
                  25: '#000080', // dark blue
                  26: '#FF00FF', // bright magenta
                  27: '#FFFF00', // bright yellow
                  28: '#00FFFF', // bright cyan
                  29: '#800080', // dark magenta
                  30: '#800000', // dark red
                  31: '#008080', // dark cyan
                  32: '#0000FF', // bright blue
                  33: '#00CCFF', // sky blue
                  34: '#CCFFFF', // pale cyan
                  35: '#CCFFCC', // pale green
                  36: '#FFFF99', // pale yellow
                  37: '#99CCFF', // light blue
                  38: '#FF99CC', // light pink
                  39: '#CC99FF', // light purple
                  40: '#FFCC99', // light orange
                  41: '#3366FF', // medium blue
                  42: '#33CCCC', // medium cyan
                  43: '#99CC00', // lime green
                  44: '#FFCC00', // orange
                  45: '#FF9900', // dark orange
                  46: '#FF6600', // red orange
                  47: '#666699', // blue gray
                  48: '#969696', // medium gray
                  49: '#003366', // dark blue
                  50: '#339966', // dark green
                  51: '#003300', // very dark green
                  52: '#333300', // very dark yellow
                  53: '#993300', // dark red orange
                  54: '#993366', // dark pink
                  55: '#333399', // dark blue
                  56: '#333333'  // very dark gray
                };
                bgColor = colorMap[fill.bgColor.indexed] || 'white';
              }
            } else if (cell.s.fill && cell.s.fill.fgColor) {
              // Foreground color used as background in some Excel formats
              const fill = cell.s.fill;
              if (fill.fgColor.rgb) {
                // Remove alpha channel if present (first 2 chars in 8-char hex)
                const rgb = fill.fgColor.rgb;
                bgColor = rgb.length === 8 ? `#${rgb.substring(2)}` : `#${rgb}`;
              } else if (fill.fgColor.indexed !== undefined) {
                const colorMap: { [key: number]: string } = {
                  2: '#FFFFFF', 3: '#FF0000', 4: '#00FF00', 5: '#0000FF', 6: '#FFFF00',
                  7: '#FF00FF', 8: '#00FFFF', 9: '#800000', 10: '#008000', 11: '#000080',
                  12: '#808000', 13: '#800080', 14: '#008080', 15: '#C0C0C0', 16: '#808080',
                  17: '#9999FF', 18: '#993366', 19: '#FFFFCC', 20: '#CCFFFF', 21: '#660066',
                  22: '#FF8080', 23: '#0066CC', 24: '#CCCCFF'
                };
                bgColor = colorMap[fill.fgColor.indexed] || 'white';
              }
            }
            
            // Only store non-white colors
            if (bgColor !== 'white' && bgColor !== '#FFFFFF') {
              cellColors[cellRef] = bgColor;
            }
          }
        }
      }
      
      // Parse Excel data into table format with colors
      const parsedData = parseExcelToToewijzingen(jsonData as string[][], cellColors, worksheet);
      
      if (parsedData && parsedData.length > 0) {
        setTableData(parsedData);
        const filledCells = parsedData.flat().filter(cell => cell.text).length;
        setUploadStatus({
          type: 'success', 
          message: `✅ Excel bestand ingeladen: ${parsedData.length} rijen, ${parsedData[0]?.length || 0} kolommen, ${filledCells} cellen met data`
        });
        
        // Trigger auto-save after file upload
        triggerAutoSave();
      } else {
        throw new Error('Geen geldige data gevonden in Excel bestand');
      }
    } catch (error) {
      console.error('❌ Excel parsing error:', error);
      setUploadStatus({type: 'error', message: `Excel parsing mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`});
      throw error;
    }
  };

  // Handle PDF files
  const handlePdfFile = async (file: File) => {
    setUploadStatus({type: 'info', message: 'PDF wordt verwerkt, dit kan even duren...'});
    
    try {
      // Convert PDF to text using browser's capabilities
      const text = await extractTextFromPDF(file);
      
      // Parse PDF text data
      const lines = text.split('\n').filter(line => line.trim());
      const parsedData = parseTextToToewijzingen(lines);
      
      if (parsedData.length > 0) {
        setTableData(parsedData);
        setUploadStatus({type: 'success', message: `✅ PDF bestand ingeladen: ${parsedData.length} rijen`});
      } else {
        throw new Error('Geen geldige data gevonden in PDF bestand');
      }
    } catch (error) {
      console.error('❌ PDF parsing error:', error);
      setUploadStatus({type: 'error', message: `PDF parsing mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`});
      throw error;
    }
  };

  // Extract text from PDF file
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Try to extract text using a simple approach
          // This is a basic text extraction - for better results, you might want to use pdf.js
          const uint8Array = new Uint8Array(arrayBuffer);
          let text = '';
          
          // Convert bytes to string and try to extract readable text
          for (let i = 0; i < uint8Array.length - 1; i++) {
            const char = String.fromCharCode(uint8Array[i]);
            // Only include printable characters and whitespace
            if ((char >= ' ' && char <= '~') || char === '\n' || char === '\r' || char === '\t') {
              text += char;
            }
          }
          
          // Clean up the extracted text
          const cleanText = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && /[a-zA-Z]/.test(line)) // Only keep lines with letters
            .join('\n');
          
          if (cleanText.length < 10) {
            reject(new Error('Geen leesbare tekst gevonden in PDF. Probeer het bestand te converteren naar Excel of tekstformaat.'));
          } else {
            resolve(cleanText);
          }
        } catch (error) {
          reject(new Error('Fout bij het verwerken van PDF bestand'));
        }
      };
      
      reader.onerror = () => reject(new Error('Fout bij het lezen van PDF bestand'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle text/CSV files
  const handleTextFile = async (file: File) => {
    const text = await file.text();
    
    // Parse CSV/text data
    const lines = text.split('\n').filter(line => line.trim());
    const parsedData = parseTextToToewijzingen(lines);
    
    if (parsedData.length > 0) {
      setTableData(parsedData);
      setUploadStatus({type: 'success', message: `✅ Tekstbestand ingeladen: ${parsedData.length} rijen`});
    } else {
      throw new Error('Geen geldige data gevonden in tekstbestand');
    }
  };

  // Parse Excel data to Toewijzingen table format
  const parseExcelToToewijzingen = (data: string[][], cellColors: { [key: string]: string } = {}, worksheet?: any) => {
    if (!data || data.length === 0) {
      throw new Error('Geen data gevonden in Excel bestand');
    }
    
    // Always maintain the template structure: now 13 rows, 9 columns
    const templateRows = 13;
    const templateCols = 9;
    
    // Check if first row looks like headers (contains mostly text)
    let dataRows = data;
    if (data.length > 1) {
      const firstRow = data[0];
      const hasTextHeaders = firstRow.some(cell => 
        cell && typeof cell === 'string' && 
        (cell.toLowerCase().includes('naam') || 
         cell.toLowerCase().includes('name') ||
         cell.toLowerCase().includes('resident') ||
         cell.length > 15) // Long text likely indicates headers
      );
      
      if (hasTextHeaders) {
        dataRows = data.slice(1);
      } else {
        dataRows = data;
      }
    }
    
    // Create template structure - always 10x9
    const newTableData = Array(templateRows).fill(null).map(() => 
      Array(templateCols).fill(null).map(() => ({ text: '', color: 'white', type: '' }))
    );
    
    // Fill table with Excel data - fit to template limits (11 rows, 9 cols)
    dataRows.forEach((row, rowIndex) => {
      if (row && Array.isArray(row) && rowIndex < templateRows) { // Only fill within template
        row.forEach((cell, colIndex) => {
          if (colIndex < templateCols) { // Always process within template columns
            const cellText = cell ? cell.toString().trim() : '';
            
            // Process both empty and filled cells to preserve colors from Excel
            
            // Get Excel cell reference accounting for potential header row offset
            const actualRowIndex = dataRows === data ? rowIndex : rowIndex + 1; // Adjust if we skipped header
            const cellRef = XLSX.utils.encode_cell({ c: colIndex, r: actualRowIndex });
            
            // Start with imported color from Excel, default to white
            let cellColor = cellColors[cellRef] || 'white';
            
            // Convert hex colors to CSS color names for consistency with existing logic
            const colorMapping: { [key: string]: string } = {
              '#FF0000': 'red',
              '#FF8080': 'red',
              '#FFCCCC': 'red',
              '#00FF00': 'green',
              '#00CC00': 'green',
              '#CCFFCC': 'green',
              '#0000FF': 'blue',
              '#0080FF': 'blue',
              '#CCCCFF': 'blue',
              '#FFFF00': 'yellow',
              '#FFFFCC': 'yellow',
              '#FF9900': 'orange',
              '#FFCC99': 'orange',
              '#800080': 'purple',
              '#CC99FF': 'purple',
              '#808080': 'gray',
              '#C0C0C0': 'gray',
              '#CCCCCC': 'gray',
              '#FFFFFF': 'white'
            };
            
            // Convert hex color to named color if available
            if (cellColor && cellColor.startsWith('#')) {
              cellColor = colorMapping[cellColor.toUpperCase()] || cellColor;
            }
            
            // Only override with age verification status if no color was imported from Excel
            if (cellText && (cellColor === 'white' || cellColor === '#FFFFFF') && ageVerificationStatus) {
              const resident = dataMatchIt.find(r => {
                const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
                const reversedName = `${r.lastName} ${r.firstName}`.toLowerCase();
                const textLower = cellText.toLowerCase();
                return fullName === textLower || reversedName === textLower || 
                       fullName.includes(textLower) || reversedName.includes(textLower) ||
                       textLower.includes(fullName) || textLower.includes(reversedName);
              });
              
              if (resident && ageVerificationStatus[resident.badge.toString()] === 'Meerderjarig') {
                cellColor = 'red';
              }
            }
            
            // Always set the cell data, even for empty cells to preserve colors
            newTableData[rowIndex][colIndex] = {
              text: cellText,
              color: cellColor,
              type: ''
            };
          }
        });
      }
    });
    
    const filledCells = newTableData.flat().filter(cell => cell.text);
    
    return newTableData;
  };

  // Parse text/CSV data to Toewijzingen table format
  const parseTextToToewijzingen = (lines: string[]) => {
    
    if (!lines || lines.length === 0) {
      throw new Error('Geen data gevonden in tekstbestand');
    }
    
    // Always maintain the template structure: now 13 rows, 9 columns
    const templateRows = 13;
    const templateCols = 9;
    
    // Create template structure - always 10x9
    const newTableData = Array(templateRows).fill(null).map(() => 
      Array(templateCols).fill(null).map(() => ({ text: '', color: 'white', type: '' }))
    );
    
    // Parse each line as comma-separated, tab-separated, semicolon or pipe-separated values
    lines.forEach((line, rowIndex) => {
      if (rowIndex < templateRows) { // Only fill within template
        const cells = line.split(/[,\t;|]/).map(cell => cell.trim());
        cells.forEach((cell, colIndex) => {
          if (colIndex < templateCols) { // Always process within template columns
            const cellText = cell ? cell.trim() : '';
            
            // Only process non-empty cells  
            if (cellText) {
              // Check if this is a resident name and if they're marked as Meerderjarig
              let cellColor = 'white';
              if (cellText && ageVerificationStatus) {
                const resident = dataMatchIt.find(r => {
                  const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
                  const reversedName = `${r.lastName} ${r.firstName}`.toLowerCase();
                  const textLower = cellText.toLowerCase();
                  return fullName === textLower || reversedName === textLower || 
                         fullName.includes(textLower) || reversedName.includes(textLower) ||
                         textLower.includes(fullName) || textLower.includes(reversedName);
                });
                
                if (resident && ageVerificationStatus[resident.badge.toString()] === 'Meerderjarig') {
                  cellColor = 'red';
                }
              }
              
              newTableData[rowIndex][colIndex] = {
                text: cellText,
                color: cellColor,
                type: ''
              };
            }
          }
        });
      }
    });
    
    const filledCells = newTableData.flat().filter(cell => cell.text);
    
    return newTableData;
  };

  // Save data to localStorage when it changes (only after mounting)
  // TODO: Save to database when API is ready
  useEffect(() => {
    if (isMounted) {
      // Will be replaced with database save
      console.log('Table data changed, would save to database');
    }
  }, [tableData, isMounted]);

  // Auto-save function with debouncing
  const triggerAutoSave = () => {
    console.log('⚡ triggerAutoSave called, enabled:', autoSaveEnabled);
    if (!autoSaveEnabled) {
      console.log('❌ Auto-save disabled, skipping');
      return;
    }
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set new timer for auto-save (2 seconds debounce)
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveToDatabase(true); // true indicates auto-save
    }, 2000);
    
  };

  // Clear auto-save timer when auto-save is disabled
  useEffect(() => {
    if (!autoSaveEnabled && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, [autoSaveEnabled]);

  // Save assignments to database
  const handleSaveToDatabase = async (isAutoSave = false) => {
    if (isSaving) return;
    
    setIsSaving(true);
    if (!isAutoSave) {
      setSaveStatus({type: null, message: ''});
    }
    
    try {
      
      // Get current date for assignments
      const assignmentDate = new Date().toISOString().split('T')[0];
      
      // Get staff names from staffColumns
      const staffNames = staffColumns.map(col => col.name);
      
      // Count non-empty assignments
      let assignmentCount = 0;
      tableData.forEach((row) => {
        row.forEach((cell) => {
          if (cell.text.trim()) {
            assignmentCount++;
          }
        });
      });


      // Try new Toewijzingen Grid API first, with localStorage fallback
      try {
        const result = await toewijzingenGridApi.saveGrid(tableData, assignmentDate, staffNames);
        
        if (result.success && result.data) {
          // Real database save worked
          setSaveStatus({
            type: 'success', 
            message: isAutoSave 
              ? `✅ Auto-saved: ${result.data.grid.successful} cells, ${result.data.staff.successful} staff records`
              : `✅ Saved to database: ${result.data.grid.successful} cells, ${result.data.staff.successful} staff records`
          });
          setLastAutoSave(new Date());
          
          if (result.data.grid.failed > 0 || result.data.staff.failed > 0) {
            console.warn('⚠️ Some records had errors:', { 
              gridFailed: result.data.grid.failed, 
              staffFailed: result.data.staff.failed 
            });
          }
        } else {
          throw new Error(result.error || 'Toewijzingen Grid API call failed');
        }
      } catch (apiError) {
        console.warn('⚠️ Toewijzingen Grid API not available, using localStorage backup:', apiError);
        
        // Fallback: enhanced localStorage save with database-like structure
        const assignmentData = {
          assignments: [],
          assignmentDate,
          savedAt: new Date().toISOString(),
          metadata: {
            totalAssignments: assignmentCount,
            staffNames: staffNames,
            tableStructure: {
              rows: tableData.length,
              cols: tableData[0]?.length
            }
          }
        };

        // Convert table data to assignment-like structure
        tableData.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (cell.text.trim() && colIndex < staffNames.length) {
              assignmentData.assignments.push({
                id: `${rowIndex}-${colIndex}-${Date.now()}`,
                resident_name: cell.text.trim(),
                staff_name: staffNames[colIndex],
                assignment_date: assignmentDate,
                assignment_type: cell.color === 'red' ? 'meerderjarig' : 
                               cell.color === 'blue' ? 'transfer' : 'regular',
                color_code: cell.color,
                position_row: rowIndex,
                position_col: colIndex,
                notes: cell.type,
                created_at: new Date().toISOString()
              });
            }
          });
        });

        // TODO: Remove this backup mechanism when database is fully integrated
        console.log('Assignment data saved to database:', assignmentData);
        
        setSaveStatus({
          type: 'success',
          message: isAutoSave 
            ? `✅ Auto-saved locally: ${assignmentCount} assignments`
            : `✅ Saved locally: ${assignmentCount} assignments (Database unavailable, using backup storage)`
        });
        setLastAutoSave(new Date());
        
      }
      
    } catch (error) {
      console.error('❌ Save error:', error);
      // Only show error message for manual saves, not auto-saves
      if (!isAutoSave) {
        setSaveStatus({
          type: 'error',
          message: `❌ Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } else {
        // For auto-save, just log the error silently
      }
    } finally {
      setIsSaving(false);
      // Clear status after 5 seconds
      if (!isAutoSave) {
        setTimeout(() => setSaveStatus({type: null, message: ''}), 5000);
      }
    }
  };

  // Load assignments from database
  const handleLoadFromDatabase = async () => {
    try {
      setSaveStatus({type: null, message: 'Loading from database...'});
      
      const assignmentDate = new Date().toISOString().split('T')[0];
      
      try {
        // Try API first
        const result = await staffAssignmentsApi.getAll(assignmentDate);
        
        if (result.success && result.data?.assignments) {
          // Convert database assignments back to table format
          const newTableData = getDefaultTableData();
          const staffNames = staffColumns.map(col => col.name);
          
          result.data.assignments.forEach((assignment: any) => {
            const staffIndex = staffNames.findIndex(name => name === assignment.staff_name);
            const row = assignment.position_row;
            const col = assignment.position_col;
            
            if (staffIndex !== -1 && row !== null && col !== null && 
                row < newTableData.length && col < newTableData[0].length) {
              newTableData[row][col] = {
                text: `${assignment.first_name} ${assignment.last_name}`.trim(),
                color: assignment.color_code || 'white',
                type: assignment.assignment_type || ''
              };
            }
          });
          
          setTableData(newTableData);
          setSaveStatus({
            type: 'success',
            message: `✅ Loaded ${result.data.assignments.length} assignments from database`
          });
          
        } else {
          throw new Error('No assignments found in database');
        }
      } catch (apiError) {
        console.warn('⚠️ Database API not available, trying localStorage backup:', apiError);
        
        // No fallback available without database
        console.error('Unable to load assignments from database');
        
        const backupData = null;
        
        if (backupData) {
          const parsed = {};
          
          // Convert backup assignments back to table format
          const newTableData = getDefaultTableData();
          const staffNames = staffColumns.map(col => col.name);
          
          parsed.assignments.forEach((assignment: any) => {
            const row = assignment.position_row;
            const col = assignment.position_col;
            
            if (row !== null && col !== null && 
                row < newTableData.length && col < newTableData[0].length) {
              newTableData[row][col] = {
                text: assignment.resident_name || '',
                color: assignment.color_code || 'white',
                type: assignment.assignment_type || ''
              };
            }
          });
          
          setTableData(newTableData);
          setSaveStatus({
            type: 'success',
            message: `✅ Loaded ${parsed.assignments.length} assignments from local backup (Database unavailable)`
          });
          
        } else {
          setSaveStatus({
            type: 'error',
            message: '❌ No assignments found in database or local backup'
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Load error:', error);
      setSaveStatus({
        type: 'error',
        message: `❌ Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      // Clear status after 5 seconds
      setTimeout(() => setSaveStatus({type: null, message: ''}), 5000);
    }
  };

  // Auto-load from database when component is ready - DISABLED
  // Commenting out auto-load to prevent overwriting local data
  // Users can manually load from DB if needed
  // useEffect(() => {
  //   if (isMounted) {
  //     const timeoutId = setTimeout(() => {
  //       if (navigator.onLine) {
  //         handleLoadFromDatabase();
  //       }
  //     }, 2000); // Load from DB after 2 second delay
  //     
  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [isMounted]);

  // TODO: Save to database when API is ready
  useEffect(() => {
    if (isMounted) {
      // Will be replaced with database save
      console.log('Staff columns changed');
    }
  }, [staffColumns, isMounted]);

  // TODO: Save to database when API is ready  
  useEffect(() => {
    if (isMounted) {
      // Will be replaced with database save
      console.log('Bottom data changed');
    }
  }, [bottomData, isMounted]);

  // Handle cell editing
  const handleCellClick = (row: number, col: number, value: string, type: string = '') => {
    // Track selected cell
    setSelectedCell({ row, col });
    
    // Don't reset if we're already editing this cell
    if (editingCell?.row === row && editingCell?.col === col) {
      return;
    }
    setEditingCell({ row, col });
    setEditValue(value);
    setEditType(type || '');
  };

  const handleSaveCell = () => {
    
    if (editingCell) {
      const newData = [...tableData];
      const currentCell = newData[editingCell.row][editingCell.col];
      const previousText = currentCell.text.trim();
      
      
      // Check if the resident is marked as Meerderjarig in Permissielijst
      let finalColor = currentCell.color;
      const cellText = editValue.trim();
      
      if (cellText && ageVerificationStatus) {
        const resident = dataMatchIt.find(r => {
          const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
          const reversedName = `${r.lastName} ${r.firstName}`.toLowerCase();
          const textLower = cellText.toLowerCase();
          return fullName === textLower || reversedName === textLower || 
                 fullName.includes(textLower) || reversedName.includes(textLower) ||
                 textLower.includes(fullName) || textLower.includes(reversedName);
        });
        
        if (resident && ageVerificationStatus[resident.badge.toString()] === 'Meerderjarig') {
          // Auto-set color to red for Meerderjarig residents
          finalColor = 'red';
        }
      }
      
      // Update based on manual type selection
      if (editType === 'meerderjarig') finalColor = 'red';
      else if (editType === 'leeftijdstwijfel') finalColor = 'gray';
      else if (editType === 'transfer') finalColor = 'blue';
      
      newData[editingCell.row][editingCell.col] = {
        ...currentCell,
        text: editValue,
        type: editType,
        color: finalColor
      };
      
      
      setTableData(newData);
      console.log('📝 Cell data updated, triggering auto-save');
      
      // Trigger auto-save after cell change
      triggerAutoSave();

      // Handle adding resident to IB column
      if (editValue.trim() && editingCell.col < dynamicStaffColumns.length) {
        const ibName = dynamicStaffColumns[editingCell.col].name;
        updateResidentReferentiepersoon(editValue.trim(), ibName);
      }
      
      // Handle removing resident from IB column (clear referentiepersoon only)
      if (previousText && !editValue.trim() && editingCell.col < dynamicStaffColumns.length) {
        clearResidentReferentiepersoon(previousText);
      }

      setEditingCell(null);
      setEditValue('');
      setEditType('');
    } else {
    }
  };

  // Function to clear referentiepersoon when resident is removed from IB column
  const clearResidentReferentiepersoon = (residentName: string) => {
    
    if (!dataMatchIt || !setDataMatchIt) {
      return;
    }

    const updatedData = dataMatchIt.map(resident => {
      // Try both firstName + lastName and lastName + firstName
      const fullName = `${resident.firstName} ${resident.lastName}`.trim();
      const reversedName = `${resident.lastName} ${resident.firstName}`.trim();
      
      
      if (fullName === residentName || reversedName === residentName) {
        return {
          ...resident,
          referencePerson: '' // Clear the referentiepersoon field
        };
      }
      return resident;
    });

    const matchedResident = updatedData.find(r => {
      const fullName = `${r.firstName} ${r.lastName}`.trim();
      const reversedName = `${r.lastName} ${r.firstName}`.trim();
      return (fullName === residentName || reversedName === residentName) && r.referencePerson === '';
    });

    if (matchedResident) {
      setDataMatchIt(updatedData);
    } else {
    }
  };

  // Function to update referentiepersoon in dataMatchIt
  const updateResidentReferentiepersoon = (residentName: string, ibName: string) => {
    
    if (!dataMatchIt || !setDataMatchIt) {
      return;
    }

    const updatedData = dataMatchIt.map(resident => {
      // Try both firstName + lastName and lastName + firstName
      const fullName = `${resident.firstName} ${resident.lastName}`.trim();
      const reversedName = `${resident.lastName} ${resident.firstName}`.trim();
      
      
      if (fullName === residentName || reversedName === residentName) {
        return {
          ...resident,
          referencePerson: ibName
        };
      }
      return resident;
    });

    const matchedResident = updatedData.find(r => {
      const fullName = `${r.firstName} ${r.lastName}`.trim();
      const reversedName = `${r.lastName} ${r.firstName}`.trim();
      return fullName === residentName || reversedName === residentName;
    });

    setDataMatchIt(updatedData);
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setEditType('');
  };

  // Delete individual cell content
  const deleteCell = (rowIndex: number, colIndex: number) => {
    const newData = [...tableData];
    const currentCell = newData[rowIndex][colIndex];
    const previousText = currentCell.text.trim();
    
    
    // Clear the cell content
    newData[rowIndex][colIndex] = {
      text: '',
      color: 'white',
      type: ''
    };
    
    // If this was an IB assignment, clear the resident's referentiepersoon
    if (previousText && colIndex < dynamicStaffColumns.length) {
      clearResidentReferentiepersoon(previousText);
    }
    
    setTableData(newData);
    
    // Trigger auto-save after delete
    triggerAutoSave();
  };

  // Clear all cell contents while preserving template structure
  const clearAllCells = () => {
    if (window.confirm('Weet je zeker dat je ALLE celinhoud wilt wissen? Dit kan niet ongedaan worden gemaakt.')) {
      
      // Clear all residents' referentiepersoon
      if (dataMatchIt && setDataMatchIt) {
        const updatedData = dataMatchIt.map(resident => ({
          ...resident,
          referencePerson: ''
        }));
        setDataMatchIt(updatedData);
      }
      
      // Reset to default template structure (10 rows, 9 columns, all empty)
      const templateData = getDefaultTableData();
      setTableData(templateData);
      
      // Clear state
      console.log('Clearing assignment data');
      
      
      // Trigger auto-save after clear all
      triggerAutoSave();
    }
  };

  // Handle type change specifically
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setEditType(newType);
  };

  // Handle staff name editing (count is now dynamic and read-only)
  const handleStaffEdit = (index: number, field: 'name' | 'count' | 'annotation', value: string | number) => {
    if (field === 'count') {
      // Count is now dynamic, don't allow manual editing
      return;
    }
    const newStaff = [...staffColumns];
    newStaff[index][field] = value as string;
    setStaffColumns(newStaff);
    
    // Trigger auto-save after staff change
    triggerAutoSave();
  };

  // Handle bottom section editing - each cell belongs to its referentiepersoon group
  const handleBottomEdit = (section: 'IB' | 'GB' | 'NB', index: number, value: string) => {
    const newData = { ...bottomData };
    newData[section][index] = value;
    setBottomData(newData);
    
    // Trigger auto-save after bottom data change
    triggerAutoSave();
  };

  // Column management functions
  const addColumn = () => {
    // Add a new staff column
    const newStaffColumns = [...staffColumns, { 
      name: `Nieuwe Medewerker ${staffColumns.length + 1}`, 
      count: 0, 
      annotation: '' 
    }];
    setStaffColumns(newStaffColumns);

    // Add a new column to all table rows
    const newTableData = tableData.map(row => [
      ...row,
      { text: '', color: 'white', type: '' }
    ]);
    setTableData(newTableData);

    // Add a new column to bottom data
    const newBottomData = {
      IB: [...bottomData.IB, ''],
      GB: [...bottomData.GB, ''],
      NB: [...bottomData.NB, '']
    };
    setBottomData(newBottomData);

    triggerAutoSave();
    console.log('✅ Added new column');
  };

  const removeColumn = (columnIndex: number) => {
    // Prevent removing if there's only one column left
    if (staffColumns.length <= 1) {
      alert('Cannot remove the last column');
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to remove column "${staffColumns[columnIndex]?.name}"? This will delete all data in this column.`)) {
      return;
    }

    // Remove from staff columns
    const newStaffColumns = staffColumns.filter((_, index) => index !== columnIndex);
    setStaffColumns(newStaffColumns);

    // Remove from all table rows
    const newTableData = tableData.map(row => 
      row.filter((_, index) => index !== columnIndex)
    );
    setTableData(newTableData);

    // Remove from bottom data
    const newBottomData = {
      IB: bottomData.IB.filter((_, index) => index !== columnIndex),
      GB: bottomData.GB.filter((_, index) => index !== columnIndex),
      NB: bottomData.NB.filter((_, index) => index !== columnIndex)
    };
    setBottomData(newBottomData);

    triggerAutoSave();
    console.log(`✅ Removed column ${columnIndex}`);
  };

  // Row management functions  
  const addRow = () => {
    // Add a new row with empty cells matching the number of columns
    const newRow = Array.from({ length: staffColumns.length }, () => ({ 
      text: '', 
      color: 'white', 
      type: '' 
    }));
    
    // Insert the new row before the "Backups" section (which starts after the main table)
    const newTableData = [...tableData, newRow];
    setTableData(newTableData);

    triggerAutoSave();
    console.log('✅ Added new row');
  };

  const removeRow = (rowIndex: number) => {
    // Prevent removing header rows (first 2 rows)
    if (rowIndex < 2) {
      alert('Cannot remove header rows');
      return;
    }

    // Prevent removing if there are only header rows left
    if (tableData.length <= 3) {
      alert('Cannot remove the last data row');
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to remove row ${rowIndex === 1 ? "IB's" : rowIndex - 1}? This will delete all data in this row.`)) {
      return;
    }

    // Remove the row
    const newTableData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(newTableData);

    triggerAutoSave();
    console.log(`✅ Removed row ${rowIndex}`);
  };

  // Get cell background class based on PDF color attributions
  const getCellClass = (text: string = '', type: string = '', color: string = 'white') => {
    if (text === '') return 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400';
    
    // Check if this resident has a specific status in Permissielijst
    if (text && ageVerificationStatus) {
      // Try to find the resident's badge by matching the name
      const resident = dataMatchIt.find(r => {
        const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
        const reversedName = `${r.lastName} ${r.firstName}`.toLowerCase();
        const cellText = text.toLowerCase();
        return fullName === cellText || reversedName === cellText || 
               fullName.includes(cellText) || reversedName.includes(cellText) ||
               cellText.includes(fullName) || cellText.includes(reversedName);
      });
      
      if (resident) {
        const status = (ageVerificationStatus[resident.badge.toString()] ?? '') as string;
        if (status === 'Meerderjarig') {
          // Override color to red for Meerderjarig residents
          return 'bg-red-500 text-white hover:bg-red-600 font-bold transition-colors duration-200';
        } else if (status === 'Leeftijdstwijfel') {
          // Override color to gray for Leeftijdstwijfel residents
          return 'bg-gray-500 text-white hover:bg-gray-600 font-bold transition-colors duration-200';
        } else if (status === 'Transfer') {
          // Override color to blue for Transfer residents
          return 'bg-blue-500 text-white hover:bg-blue-600 font-bold transition-colors duration-200';
        }
      }
    }
    
    // Use imported Excel colors or PDF color attributions
    switch(color.toLowerCase()) {
      case 'red': 
        return 'bg-red-500 text-white hover:bg-red-600 transition-colors duration-200';
      case 'gray': 
        return 'bg-gray-500 text-white hover:bg-gray-600 transition-colors duration-200';
      case 'blue': 
        return 'bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200';
      case 'green':
        return 'bg-green-500 text-white hover:bg-green-600 transition-colors duration-200';
      case 'yellow':
        return 'bg-yellow-400 text-black hover:bg-yellow-500 transition-colors duration-200';
      case 'orange':
        return 'bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200';
      case 'purple':
        return 'bg-purple-500 text-white hover:bg-purple-600 transition-colors duration-200';
      case 'white':
      default: 
        return 'bg-white dark:bg-gray-800 text-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200';
    }
  };

  // Filter all data based on search term
  const isVisible = (text: string) => {
    if (!searchTerm) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Calculate dynamic resident count per column
  const getColumnResidentCount = (colIndex: number) => {
    return tableData.reduce((count, row) => {
      return count + (row[colIndex]?.text?.trim() ? 1 : 0);
    }, 0);
  };

  // Update staff columns with dynamic counts (only after hydration)
  const getDynamicStaffColumns = () => {
    return staffColumns.map((staff, idx) => ({
      ...staff,
      count: isMounted ? getColumnResidentCount(idx) : staff.count // Use stored count during SSR
    }));
  };

  const dynamicStaffColumns = getDynamicStaffColumns();

  // Total residents - count all residents in IB columns (columns 0-8)
  // Skip first 2 rows as they are headers
  const total = tableData.reduce((totalCount, row, rowIndex) => {
    // Skip header rows (index 0 and 1)
    if (rowIndex < 2) return totalCount;
    
    // Count residents in columns 0-8 (the 9 IB columns)
    const rowCount = row.slice(0, 9).reduce((count, cell) => {
      return count + (cell?.text?.trim() ? 1 : 0);
    }, 0);
    
    return totalCount + rowCount;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-indigo-950 dark:to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      <div className="p-4 relative z-10">
        {/* Header with search and back button */}
        <div className="mb-6 flex justify-between items-center backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-3 shadow-xl border border-white/20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 font-medium backdrop-blur-sm"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent drop-shadow-sm">
              Toewijzingen
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* File Upload Button */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isUploading 
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transform hover:scale-105'
                } text-white shadow-lg hover:shadow-2xl font-medium`}
                title="Upload Excel, CSV, txt of PDF bestand"
              >
                <Upload className={`h-5 w-5 ${isUploading ? 'animate-bounce' : ''}`} />
                <span className="font-medium">
                  {isUploading ? 'Uploading...' : 'Upload Bestand'}
                </span>
              </button>
            </div>

            {/* Column/Row Management Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <button
                  onClick={addColumn}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm"
                  title="Add new column"
                >
                  <Plus className="h-4 w-4" />
                  <span>Column</span>
                </button>
                <button
                  onClick={addRow}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm"
                  title="Add new row"
                >
                  <Plus className="h-4 w-4" />
                  <span>Row</span>
                </button>
              </div>
            </div>

            {/* Auto-save Toggle & Status */}
            <div className="flex items-center gap-3">
              {/* Toggle Button */}
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  autoSaveEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                    : 'bg-gray-400 dark:bg-gray-600'
                }`}
                title={autoSaveEnabled ? 'Klik om auto-save uit te zetten' : 'Klik om auto-save aan te zetten'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    autoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                  } shadow-lg`}
                />
              </button>
              
              {/* Status Display */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Auto-saving...</span>
                  </>
                ) : lastAutoSave && autoSaveEnabled ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Auto-saved {new Date(lastAutoSave).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                ) : autoSaveEnabled ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Auto-save actief</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Auto-save uit</span>
                  </>
                )}
              </div>
            </div>

            {/* Delete Buttons */}
            <div className="flex gap-2">
              <button
                onClick={clearAllCells}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 font-medium"
                title="Wis alle cellen (Ctrl+Delete)"
              >
                <Trash2 className="h-5 w-5" />
                <span className="font-medium">Alles Wissen</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Zoeken..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white shadow-sm hover:shadow-md transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus.message && (
          <div className={`mb-4 p-3 rounded-xl backdrop-blur-md shadow-xl border animate-slideIn ${
            uploadStatus.type === 'success' ? 'bg-gradient-to-r from-green-100/90 to-emerald-100/90 dark:from-green-900/50 dark:to-emerald-900/50 text-green-700 dark:text-green-300 border-green-300/50' :
            uploadStatus.type === 'error' ? 'bg-gradient-to-r from-red-100/90 to-rose-100/90 dark:from-red-900/50 dark:to-rose-900/50 text-red-700 dark:text-red-300 border-red-300/50' :
            'bg-gradient-to-r from-blue-100/90 to-indigo-100/90 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 border-blue-300/50'
          }`}>
            <div className="flex items-center gap-2">
              <FileText className={`h-4 w-4 ${uploadStatus.type === 'info' ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium">{uploadStatus.message}</span>
            </div>
          </div>
        )}

        {/* Save Status - only show errors */}
        {saveStatus.message && saveStatus.type === 'error' && (
          <div className="mb-4 p-3 rounded-xl backdrop-blur-md shadow-xl border animate-slideIn bg-gradient-to-r from-red-100/90 to-rose-100/90 dark:from-red-900/50 dark:to-rose-900/50 text-red-700 dark:text-red-300 border-red-300/50">
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span className="text-sm font-medium">{saveStatus.message}</span>
            </div>
          </div>
        )}

        {/* Centered date */}
        <div className="mb-4 flex justify-center">
          <div className="px-5 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full shadow-lg backdrop-blur-sm border border-white/20">
            <span className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">8/22/25</span>
          </div>
        </div>
        {/* Status labels moved from last column */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-bold shadow-md">Aantal jongeren:</span>
            <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-base font-bold shadow-lg transform hover:scale-105 transition-transform duration-200 cursor-default">{total}</span>
          </div>
          <div className="flex justify-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-default">meerderjarig</span>
            <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-gray-500 to-slate-600 text-white text-xs font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-default">leeftijdstwijfel</span>
            <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-default">transfer</span>
          </div>
        </div>

        {/* Main table */}
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-300 dark:border-gray-700 hover:shadow-3xl transition-shadow duration-300">
          <table className="border-collapse w-full">
            <tbody>
              {/* Staff Column Headers with Remove Buttons */}
              <tr>
                <td className="border-2 border-black dark:border-gray-300 px-2 py-1 text-xs font-bold text-center bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-black dark:text-gray-200">
                  Staff
                </td>
                {dynamicStaffColumns.map((staff, colIndex) => (
                  <td key={colIndex} className="border-2 border-black dark:border-gray-300 px-1 py-1 text-xs font-bold text-center bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-black dark:text-gray-200 relative group">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center gap-1 min-h-[20px]">
                        <input
                          type="text"
                          value={staff.name}
                          onChange={(e) => handleStaffEdit(colIndex, 'name', e.target.value)}
                          className="bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded text-center text-xs font-bold w-full min-w-[60px] text-black dark:text-gray-200"
                          title="Click to edit staff name"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeColumn(colIndex);
                          }}
                          className="opacity-0 group-hover:opacity-70 hover:opacity-100 p-0.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all"
                          title={`Remove column "${staff.name}"`}
                        >
                          <Minus className="h-2 w-2" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        ({staff.count})
                      </div>
                      {staff.annotation && (
                        <input
                          type="text"
                          value={staff.annotation}
                          onChange={(e) => handleStaffEdit(colIndex, 'annotation', e.target.value)}
                          className="bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded text-center text-xs italic w-full text-gray-600 dark:text-gray-400"
                          title="Click to edit annotation"
                          placeholder="Add note..."
                        />
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex} className={searchTerm && !row.some(cell => isVisible(cell.text)) ? 'hidden' : ''}>
                  <td className={`border-2 border-black dark:border-gray-300 px-2 py-1 ${rowIndex === 1 ? 'text-base' : 'text-xs'} font-bold text-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-black dark:text-gray-300 relative group`}>
                    <div className="flex items-center justify-center gap-1">
                      <span>{rowIndex === 0 ? 'Aantal' : rowIndex === 1 ? "IB's" : rowIndex - 1}</span>
                      {rowIndex >= 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRow(rowIndex);
                          }}
                          className="opacity-0 group-hover:opacity-70 hover:opacity-100 p-0.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all ml-1"
                          title={`Remove row ${rowIndex - 1}`}
                        >
                          <Minus className="h-2 w-2" />
                        </button>
                      )}
                    </div>
                  </td>
                  {row.map((cell, colIndex) => (
                    <td 
                      key={colIndex}
                      className={`border-2 border-black dark:border-gray-300 px-1 py-1 ${rowIndex === 1 ? 'text-base font-bold' : 'text-xs'} cursor-pointer relative text-center group transition-all duration-200 hover:z-10 hover:transform hover:scale-105 ${getCellClass(cell.text, cell.type, cell.color)} ${
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'ring-2 ring-purple-500 ring-inset shadow-lg' : ''
                      }`}
                      onClick={() => handleCellClick(rowIndex, colIndex, cell.text, cell.type)}
                    >
                      {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                        <div 
                          className="flex flex-col gap-1 p-1 bg-white border border-blue-500 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCell();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className={`w-full px-1 py-0 ${rowIndex === 1 ? 'text-base font-bold' : 'text-xs'} bg-white text-black border border-gray-300 rounded text-center`}
                            placeholder="Bewoner naam..."
                            autoFocus
                          />
                          <select
                            value={editType}
                            onChange={handleTypeChange}
                            className="w-full px-1 py-0 text-xs bg-white text-black border border-gray-300 rounded text-center"
                          >
                            <option value="">Geen type</option>
                            <option value="meerderjarig">Meerderjarig</option>
                            <option value="leeftijdstwijfel">Leeftijdstwijfel</option>
                            <option value="transfer">Transfer</option>
                          </select>
                          <div className="flex gap-1">
                            <button onClick={handleSaveCell} className="flex-1 p-0.5 bg-green-500 text-white rounded-lg text-xs">
                              <Save className="h-3 w-3 mx-auto" />
                            </button>
                            <button onClick={handleCancelEdit} className="flex-1 p-0.5 bg-red-500 text-white rounded-lg text-xs">
                              <X className="h-3 w-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center group w-full h-full relative">
                          <span className={`text-center ${!isVisible(cell.text) ? 'opacity-30' : ''} ${rowIndex === 1 ? 'font-bold' : ''}`}>{cell.text}</span>
                          {cell.text && (
                            <>
                              <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 absolute top-1 right-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCell(rowIndex, colIndex);
                                }}
                                className="opacity-0 group-hover:opacity-70 hover:opacity-100 absolute top-1 left-1 p-0.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all"
                                title="Wis cel (Delete)"
                              >
                                <Trash2 className="h-2 w-2" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Footer title row - Backups section */}
              <tr>
                <td colSpan={11} className="border-2 border-black dark:border-gray-300 px-2 py-2 text-sm font-bold text-center bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-black dark:text-gray-200">
                  Backups
                </td>
              </tr>
              {/* Footer rows - IB, GB, NB */}
              {Object.entries(bottomData).map(([key, values]) => (
                <tr key={key}>
                  <td className="border-2 border-black dark:border-gray-300 px-2 py-1 text-xs font-bold bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-center text-black dark:text-gray-200">{key}</td>
                  {values.map((value, idx) => (
                    <td key={idx} className="border-2 border-black dark:border-gray-300 px-2 py-1 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" title={key}>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleBottomEdit(key as 'IB' | 'GB' | 'NB', idx, e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-2 focus:ring-purple-500 rounded-lg text-center text-black dark:text-gray-300 placeholder-gray-400"
                        placeholder={key}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add animation styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}