'use client';

import { useState, useEffect, useRef } from 'react';
import { Home, Search, Save, X, Edit2, Upload, FileText, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useData } from "../../../lib/DataContextDebug";
import * as XLSX from 'xlsx';

export default function ToewijzingenPage() {
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

  // Handle hydration and load saved data
  useEffect(() => {
    setIsMounted(true);
    
    // Load saved data from localStorage after mounting
    try {
      const savedTableData = localStorage.getItem('toewijzingen_tableData');
      if (savedTableData) {
        const parsed = JSON.parse(savedTableData);
        setTableData(parsed);
        console.log('📥 Loaded table data from localStorage');
      }

      const savedStaffColumns = localStorage.getItem('toewijzingen_staffColumns');
      if (savedStaffColumns) {
        const parsed = JSON.parse(savedStaffColumns);
        setStaffColumns(parsed);
        console.log('📥 Loaded staff columns from localStorage');
      }

      const savedBottomData = localStorage.getItem('toewijzingen_bottomData');
      if (savedBottomData) {
        const parsed = JSON.parse(savedBottomData);
        setBottomData(parsed);
        console.log('📥 Loaded bottom data from localStorage');
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
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
    
    console.log('📋 Current Toewijzingen assignments:', assignments);
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
    console.log('🔄 Starting referentiepersoon sync...');
    
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
            console.log(`🔍 Fuzzy match found: "${assignmentName}" matches "${fullName}" (word-based matching)`);
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
            console.log(`🔍 Similarity match found: "${bestMatch.name}" matches "${fullName}" (${(bestMatch.similarity * 100).toFixed(1)}% similarity)`);
          }
        }
      }
      
      // Debug logging for specific case
      if (fullName.includes('Gerish') || fullName.includes('Faniel') || fullName.includes('Habtay')) {
        console.log(`🔍 Debugging Gerish: fullName="${fullName}", reversedName="${reversedName}", assignedStaff="${assignedStaff}", currentRef="${resident.referencePerson}"`);
        console.log('🔍 Available assignments:', Object.keys(assignments));
      }
      
      // If assigned staff is different from current referentiepersoon, update it
      if (assignedStaff && assignedStaff !== resident.referencePerson) {
        console.log(`🔄 Updating ${fullName}: "${resident.referencePerson}" → "${assignedStaff}"`);
        changesCount++;
        return { ...resident, referencePerson: assignedStaff };
      }
      
      // If resident is not in Toewijzingen but has a referentiepersoon, clear it
      if (!assignedStaff && resident.referencePerson) {
        console.log(`🔄 Clearing referentiepersoon for ${fullName} (not in Toewijzingen)`);
        changesCount++;
        return { ...resident, referencePerson: '' };
      }
      
      return resident;
    });

    if (changesCount > 0) {
      console.log(`✅ Sync completed: ${changesCount} referentiepersoon changes applied`);
      setDataMatchIt(updatedData);
    } else {
      console.log('✅ Sync completed: No changes needed, data is already synchronized');
    }
  };

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 File selected:', file.name, 'Type:', file.type);
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
        cellDates: true
      });
      
      console.log('📊 Excel workbook loaded:', { 
        sheetNames: workbook.SheetNames, 
        totalSheets: workbook.SheetNames.length 
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
      
      console.log('🎯 Using sheet:', targetSheet);
      
      const worksheet = workbook.Sheets[targetSheet];
      
      // Get sheet range to understand the data structure
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      console.log('📋 Sheet range:', range);
      
      // Extract all data including empty cells
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        raw: false,
        defval: '', // Default value for empty cells
        range: range
      });

      console.log('📊 Excel raw data:', { 
        totalRows: jsonData.length,
        firstFewRows: jsonData.slice(0, 3),
        lastFewRows: jsonData.slice(-3)
      });
      
      // Parse Excel data into table format
      const parsedData = parseExcelToToewijzingen(jsonData as string[][]);
      
      if (parsedData && parsedData.length > 0) {
        setTableData(parsedData);
        const filledCells = parsedData.flat().filter(cell => cell.text).length;
        setUploadStatus({
          type: 'success', 
          message: `✅ Excel bestand ingeladen: ${parsedData.length} rijen, ${parsedData[0]?.length || 0} kolommen, ${filledCells} cellen met data`
        });
        console.log('✅ Table data updated from Excel');
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
      console.log('📄 PDF text extracted:', text.substring(0, 200) + '...');
      
      // Parse PDF text data
      const lines = text.split('\n').filter(line => line.trim());
      const parsedData = parseTextToToewijzingen(lines);
      
      if (parsedData.length > 0) {
        setTableData(parsedData);
        setUploadStatus({type: 'success', message: `✅ PDF bestand ingeladen: ${parsedData.length} rijen`});
        console.log('✅ Table data updated from PDF');
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
    console.log('📄 Text data loaded:', text.substring(0, 200) + '...');
    
    // Parse CSV/text data
    const lines = text.split('\n').filter(line => line.trim());
    const parsedData = parseTextToToewijzingen(lines);
    
    if (parsedData.length > 0) {
      setTableData(parsedData);
      setUploadStatus({type: 'success', message: `✅ Tekstbestand ingeladen: ${parsedData.length} rijen`});
      console.log('✅ Table data updated from text file');
    } else {
      throw new Error('Geen geldige data gevonden in tekstbestand');
    }
  };

  // Parse Excel data to Toewijzingen table format
  const parseExcelToToewijzingen = (data: string[][]) => {
    console.log('🔄 Parsing Excel data to Toewijzingen format...', { totalRows: data.length });
    
    if (!data || data.length === 0) {
      throw new Error('Geen data gevonden in Excel bestand');
    }
    
    // Always maintain the template structure: now 13 rows, 9 columns
    const templateRows = 13;
    const templateCols = 9;
    
    console.log('📊 Excel file dimensions:', { 
      templateRows, 
      templateCols, 
      actualDataRows: data.length,
      willFitToTemplate: true 
    });
    
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
        console.log('📋 Detected header row, skipping first row');
        dataRows = data.slice(1);
      } else {
        console.log('📋 No header row detected, using all rows');
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
    
    // Debug output with actual content preview
    const filledCells = newTableData.flat().filter(cell => cell.text);
    console.log('✅ Parsed Excel data:', { 
      outputRows: newTableData.length, 
      outputCols: newTableData[0]?.length,
      filledCells: filledCells.length,
      sampleData: filledCells.slice(0, 10).map(cell => cell.text)
    });
    
    return newTableData;
  };

  // Parse text/CSV data to Toewijzingen table format
  const parseTextToToewijzingen = (lines: string[]) => {
    console.log('🔄 Parsing text data to Toewijzingen format...', { totalLines: lines.length });
    
    if (!lines || lines.length === 0) {
      throw new Error('Geen data gevonden in tekstbestand');
    }
    
    // Always maintain the template structure: now 13 rows, 9 columns
    const templateRows = 13;
    const templateCols = 9;
    
    console.log('📄 Text file dimensions:', { 
      templateRows, 
      templateCols, 
      actualLines: lines.length,
      willFitToTemplate: true 
    });
    
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
    
    // Debug output with actual content preview
    const filledCells = newTableData.flat().filter(cell => cell.text);
    console.log('✅ Parsed text data:', { 
      outputRows: newTableData.length, 
      outputCols: newTableData[0]?.length,
      filledCells: filledCells.length,
      sampleData: filledCells.slice(0, 10).map(cell => cell.text)
    });
    
    return newTableData;
  };

  // Save data to localStorage when it changes (only after mounting)
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('toewijzingen_tableData', JSON.stringify(tableData));
      console.log('💾 Table data saved to localStorage');
    }
  }, [tableData, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('toewijzingen_staffColumns', JSON.stringify(staffColumns));
      console.log('💾 Staff columns saved to localStorage');
    }
  }, [staffColumns, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('toewijzingen_bottomData', JSON.stringify(bottomData));
      console.log('💾 Bottom data saved to localStorage');
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
    console.log('handleSaveCell called with:', { editingCell, editValue, editType });
    
    if (editingCell) {
      const newData = [...tableData];
      const currentCell = newData[editingCell.row][editingCell.col];
      const previousText = currentCell.text.trim();
      
      console.log('Before update - currentCell:', currentCell);
      
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
      
      console.log('After update - newCell:', newData[editingCell.row][editingCell.col]);
      
      setTableData(newData);
      
      console.log('TableData updated, new data length:', newData.length);

      // Handle adding resident to IB column
      if (editValue.trim() && editingCell.col < dynamicStaffColumns.length) {
        const ibName = dynamicStaffColumns[editingCell.col].name;
        console.log('IB name for column', editingCell.col, ':', ibName);
        updateResidentReferentiepersoon(editValue.trim(), ibName);
      }
      
      // Handle removing resident from IB column (clear referentiepersoon only)
      if (previousText && !editValue.trim() && editingCell.col < dynamicStaffColumns.length) {
        console.log('Resident being removed from IB column, clearing referentiepersoon:', previousText);
        clearResidentReferentiepersoon(previousText);
      }

      console.log('Setting editing cell to null and clearing form');
      setEditingCell(null);
      setEditValue('');
      setEditType('');
    } else {
      console.log('No editing cell - save cancelled');
    }
  };

  // Function to clear referentiepersoon when resident is removed from IB column
  const clearResidentReferentiepersoon = (residentName: string) => {
    console.log('Attempting to clear referentiepersoon for resident:', residentName);
    
    if (!dataMatchIt || !setDataMatchIt) {
      console.log('DataMatchIt or setDataMatchIt not available');
      return;
    }

    const updatedData = dataMatchIt.map(resident => {
      // Try both firstName + lastName and lastName + firstName
      const fullName = `${resident.firstName} ${resident.lastName}`.trim();
      const reversedName = `${resident.lastName} ${resident.firstName}`.trim();
      
      console.log('Comparing for referentiepersoon clearing:', fullName, 'and', reversedName, 'with:', residentName);
      
      if (fullName === residentName || reversedName === residentName) {
        console.log('Match found! Clearing referentiepersoon for:', residentName);
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
      console.log('✅ Referentiepersoon cleared for resident:', residentName);
      setDataMatchIt(updatedData);
    } else {
      console.log('❌ Resident not found for referentiepersoon clearing:', residentName);
    }
  };

  // Function to update referentiepersoon in dataMatchIt
  const updateResidentReferentiepersoon = (residentName: string, ibName: string) => {
    console.log('Trying to update resident:', residentName, 'with IB:', ibName);
    
    if (!dataMatchIt || !setDataMatchIt) {
      console.log('DataMatchIt or setDataMatchIt not available');
      return;
    }

    const updatedData = dataMatchIt.map(resident => {
      // Try both firstName + lastName and lastName + firstName
      const fullName = `${resident.firstName} ${resident.lastName}`.trim();
      const reversedName = `${resident.lastName} ${resident.firstName}`.trim();
      
      console.log('Comparing:', fullName, 'and', reversedName, 'with:', residentName);
      
      if (fullName === residentName || reversedName === residentName) {
        console.log('Match found! Updating referentiepersoon to:', ibName);
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

    console.log('Updated resident:', matchedResident);
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
    
    console.log(`🗑️ Deleting cell [${rowIndex}][${colIndex}]: "${previousText}"`);
    
    // Clear the cell content
    newData[rowIndex][colIndex] = {
      text: '',
      color: 'white',
      type: ''
    };
    
    // If this was an IB assignment, clear the resident's referentiepersoon
    if (previousText && colIndex < dynamicStaffColumns.length) {
      console.log('Clearing referentiepersoon for removed resident:', previousText);
      clearResidentReferentiepersoon(previousText);
    }
    
    setTableData(newData);
    console.log('✅ Cell deleted and table updated');
  };

  // Clear all cell contents while preserving template structure
  const clearAllCells = () => {
    if (window.confirm('Weet je zeker dat je ALLE celinhoud wilt wissen? Dit kan niet ongedaan worden gemaakt.')) {
      console.log('🗑️ Clearing all cell contents - preserving template structure');
      
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
      
      // Force clear localStorage to ensure clean state
      localStorage.removeItem('toewijzingen_tableData');
      localStorage.removeItem('toewijzingen_staffColumns');
      localStorage.removeItem('toewijzingen_bottomData');
      
      console.log('✅ All cells cleared, localStorage cleared, and template structure restored');
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
  };

  // Handle bottom section editing - each cell belongs to its referentiepersoon group
  const handleBottomEdit = (section: 'IB' | 'GB' | 'NB', index: number, value: string) => {
    const newData = { ...bottomData };
    newData[section][index] = value;
    setBottomData(newData);
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
    
    // Use PDF color attributions
    switch(color.toLowerCase()) {
      case 'red': 
        return 'bg-red-500 text-white hover:bg-red-600 transition-colors duration-200';
      case 'gray': 
        return 'bg-gray-500 text-white hover:bg-gray-600 transition-colors duration-200';
      case 'blue': 
        return 'bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200';
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
  // Only count rows 2-11 (indices 2-11 in the tableData array)
  const getColumnResidentCount = (colIndex: number) => {
    return tableData.reduce((count, row, rowIndex) => {
      // Only count rows 2-11 (skip rows 0, 1, and anything after 11)
      if (rowIndex < 2 || rowIndex > 11) return count;
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
  // Only count rows 2-11 (indices 2-11, skipping rows 0 and 1)
  const total = tableData.reduce((totalCount, row, rowIndex) => {
    // Only count rows 2-11 (skip rows 0, 1, and anything after 11)
    if (rowIndex < 2 || rowIndex > 11) return totalCount;
    
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
            <thead>
              {/* Annotations row - only show for specific columns that have notes */}
              <tr>
                <td className="border-0 px-2 py-1"></td>
                {dynamicStaffColumns.map((staff, idx) => (
                  <td key={idx} className="border-0 px-2 py-1">
                    {/* Only show annotation input for columns that should have notes */}
                    {(['Kris B', 'Evelien', 'Kirsten', 'Monica'].includes(staff.name)) ? (
                      <input
                        type="text"
                        value={staff.annotation}
                        onChange={(e) => handleStaffEdit(idx, 'annotation', e.target.value)}
                        className="w-full text-[10px] text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded"
                        placeholder="..."
                      />
                    ) : (
                      <div className="text-[10px] text-center text-gray-400">-</div>
                    )}
                  </td>
                ))}
              </tr>
              {/* Count row */}
              
              {/* Staff names row */}
              <tr>
                <td className="border-2 border-black dark:border-gray-300 px-2 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-sm font-bold text-center text-black shadow-inner">IB&apos;s</td>
                {dynamicStaffColumns.map((staff, idx) => (
                  <td key={idx} className="border-2 border-black dark:border-gray-300 px-2 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 shadow-inner">
                    <input
                      type="text"
                      value={staff.name}
                      onChange={(e) => handleStaffEdit(idx, 'name', e.target.value)}
                      className="w-full text-sm font-bold text-center bg-transparent border-0 focus:ring-2 focus:ring-purple-500 rounded-lg text-black placeholder-gray-600"
                    />
                  </td>
                ))}
              </tr>
              
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => rowIndex === 1 ? null : (
                <tr key={rowIndex} className={searchTerm && !row.some(cell => isVisible(cell.text)) ? 'hidden' : ''}>
                  <td className="border-2 border-black dark:border-gray-300 px-2 py-1 text-xs font-bold text-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-black dark:text-gray-300">
                    {rowIndex <= 1 ? '' : rowIndex - 1}
                  </td>
                  {row.map((cell, colIndex) => (
                    <td 
                      key={colIndex}
                      className={`border-2 border-black dark:border-gray-300 px-1 py-1 text-xs cursor-pointer relative text-center group transition-all duration-200 hover:z-10 hover:transform hover:scale-105 ${getCellClass(cell.text, cell.type, cell.color)} ${
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
                            className="w-full px-1 py-0 text-xs bg-white text-black border border-gray-300 rounded text-center"
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
                          <span className={`text-center ${!isVisible(cell.text) ? 'opacity-30' : ''}`}>{cell.text}</span>
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