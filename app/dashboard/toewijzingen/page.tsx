'use client';

import { useState, useEffect, useRef } from 'react';
import { Home, Search, Save, X, Edit2, Upload, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useData } from '../../../lib/DataContext';
import * as XLSX from 'xlsx';

export default function ToewijzingenPage() {
  const router = useRouter();
  const { dataMatchIt, setDataMatchIt } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editType, setEditType] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{type: 'success' | 'error' | 'info' | null, message: string}>({type: null, message: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Default table data with exact PDF content
  const getDefaultTableData = () => [
    // Row 1
    [
      { text: 'Gerish Faniel Habtay', color: 'white', type: '' },
      { text: 'Abdela Selah Ali', color: 'gray', type: '' },
      { text: 'Zahir Said', color: 'red', type: '' },
      { text: 'Araya Even Fsaha', color: 'blue', type: '' },
      { text: 'Baye Fasil Alebacho', color: 'red', type: '' },
      { text: 'Hakimi Shaheen', color: 'white', type: '' },
      { text: 'Girmay Filmon Tesfamichael', color: 'red', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 2
    [
      { text: 'Gerebrhan Tesfamariam Fsaha', color: 'white', type: '' },
      { text: 'Mohammed Seid Abdelkhadr', color: 'red', type: '' },
      { text: 'Tesfaldet Ateshim Weldegergish', color: 'red', type: '' },
      { text: 'Haile Amaniel Abraham', color: 'red', type: '' },
      { text: 'Gebrehewit Dinar Gebremedhin', color: 'red', type: '' },
      { text: 'Nsangou Moulion Hétu Aliyou', color: 'red', type: '' },
      { text: 'Ebrahemkhil Mirwais', color: 'white', type: 'meerderjarig' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 3
    [
      { text: 'Jabarkhel Noor Agha', color: 'white', type: '' },
      { text: 'Tewelde Faniel Tesfaldet', color: 'white', type: '' },
      { text: 'Gerezgiher Samiel Gebre', color: 'white', type: '' },
      { text: 'Tesfazghi Abel Kesete', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: 'Haile Merhawi Weldu', color: 'red', type: '' },
      { text: 'Teklemichael Simon Luul', color: 'white', type: 'leeftijdstwijfel' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 4  
    [
      { text: 'Tewelde Samsom Kifle', color: 'white', type: '' },
      { text: 'Gebrezgabiher Thomas Zeray', color: 'white', type: '' },
      { text: 'Gebremariam Adhanom Measho', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: 'Diomande Mory', color: 'white', type: '' },
      { text: 'Teweldebrhan Saba Teklezghi', color: 'white', type: 'transfer' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 5
    [
      { text: 'Adhanom Filmon Asfha', color: 'white', type: '' },
      { text: 'Mahtsen Ambesajer Teklab', color: 'white', type: '' },
      { text: 'Sahle Ruta Weldeslasie', color: 'white', type: '' },
      { text: 'Kidanemariam Kibrom Gebretsadkan', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: 'Luzizila Ngongo Grace Albertine', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 6
    [
      { text: 'Kahsay Merhawi Mengstu', color: 'red', type: '' },
      { text: 'Berhe Maebel Kebedom', color: 'white', type: '' },
      { text: 'Berhane Muzit Mehari', color: 'white', type: '' },
      { text: 'Stephen Mirfat Issa', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: 'Lizizila Ngongo Merveille Albertine', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 7
    [
      { text: 'Kidane Daniel Berhe', color: 'white', type: '' },
      { text: 'Zere Fanuel Shewit', color: 'white', type: '' },
      { text: 'Da Silva Kumpbela Marta', color: 'white', type: '' },
      { text: 'Behbodi Bahram', color: 'white', type: '' },
      { text: 'Evelien Second Resident', color: 'white', type: '' },
      { text: 'Lizizila Ngongo Junior', color: 'white', type: '' },
      { text: 'Imane Seventh Resident', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 8
    [
      { text: 'Nazari Ahmad Zafar', color: 'red', type: '' },
      { text: 'Abdulrahman EL TAHHAN', color: 'white', type: '' },
      { text: 'Isak Diana Tesfu', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: 'Diallo Aminata', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 9
    [
      { text: 'Ashrafi Baraktullah', color: 'white', type: '' },
      { text: 'Ahmed Ibrahim SHATA', color: 'white', type: '' },
      { text: 'Weldegebriel Luwam Gebremariam', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: 'Abunaja Wafa M I', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 10
    [
      { text: 'Geremariam Aman Teklezgi', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: 'Camara Christine', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ],
    // Row 11 - Empty row
    [
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' },
      { text: '', color: 'white', type: '' }
    ]
  ];

  // Initialize with default data, load from localStorage after mount
  const [tableData, setTableData] = useState(getDefaultTableData);

  // Default staff columns data from PDF
  const getDefaultStaffColumns = () => [
    { name: 'Kris B', count: 3, annotation: 'verlof 22/08 tem 22/09' },
    { name: 'Torben', count: 10, annotation: '' },
    { name: 'Didar', count: 9, annotation: '' },
    { name: 'Dorien', count: 9, annotation: '' },
    { name: 'Evelien', count: 2, annotation: 'verlof 23/08 tem 14/09' },
    { name: 'Yasmina', count: 10, annotation: '' },
    { name: 'Imane', count: 7, annotation: '' },
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
    if (isMounted && dataMatchIt && setDataMatchIt) {
      const currentAssignments = getCurrentToewijzingenAssignments();
      syncReferentiepersoonWithToewijzingen(currentAssignments);
    }
  }, [tableData, isMounted, dataMatchIt]);

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
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('📊 Excel data loaded:', jsonData);
    
    // Parse Excel data into table format
    const parsedData = parseExcelToToewijzingen(jsonData as string[][]);
    
    if (parsedData.length > 0) {
      setTableData(parsedData);
      setUploadStatus({type: 'success', message: `✅ Excel bestand ingeladen: ${parsedData.length} rijen`});
      console.log('✅ Table data updated from Excel');
    } else {
      throw new Error('Geen geldige data gevonden in Excel bestand');
    }
  };

  // Handle PDF files
  const handlePdfFile = async (file: File) => {
    // For now, show a message that PDF parsing needs to be implemented
    // You could integrate a PDF parsing library here
    setUploadStatus({type: 'info', message: 'PDF parsing wordt binnenkort toegevoegd. Gebruik voorlopig Excel bestanden.'});
    throw new Error('PDF parsing wordt binnenkort toegevoegd');
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
    console.log('🔄 Parsing Excel data to Toewijzingen format...');
    
    // Skip header rows and find data
    const dataRows = data.slice(1); // Skip first row (assuming it's header)
    const newTableData = Array(15).fill(null).map(() => 
      Array(9).fill(null).map(() => ({ text: '', color: 'white', type: '' }))
    );
    
    // Fill table with Excel data
    dataRows.forEach((row, rowIndex) => {
      if (rowIndex < 15) {
        row.forEach((cell, colIndex) => {
          if (colIndex < 9 && cell && cell.toString().trim()) {
            newTableData[rowIndex][colIndex] = {
              text: cell.toString().trim(),
              color: 'white', // Default color, could be enhanced to detect colors
              type: ''
            };
          }
        });
      }
    });
    
    return newTableData;
  };

  // Parse text/CSV data to Toewijzingen table format
  const parseTextToToewijzingen = (lines: string[]) => {
    console.log('🔄 Parsing text data to Toewijzingen format...');
    
    const newTableData = Array(15).fill(null).map(() => 
      Array(9).fill(null).map(() => ({ text: '', color: 'white', type: '' }))
    );
    
    // Parse each line as comma-separated or tab-separated values
    lines.forEach((line, rowIndex) => {
      if (rowIndex < 15) {
        const cells = line.split(/[,\t]/).map(cell => cell.trim());
        cells.forEach((cell, colIndex) => {
          if (colIndex < 9 && cell) {
            newTableData[rowIndex][colIndex] = {
              text: cell,
              color: 'white',
              type: ''
            };
          }
        });
      }
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
      
      newData[editingCell.row][editingCell.col] = {
        ...currentCell,
        text: editValue,
        type: editType,
        // Preserve existing color from PDF or update based on type if needed
        color: editType === 'meerderjarig' ? 'red' : 
               editType === 'leeftijdstwijfel' ? 'gray' : 
               editType === 'transfer' ? 'blue' : currentCell.color
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
    if (text === '') return 'bg-white hover:bg-gray-50 text-gray-400';
    
    // Use PDF color attributions
    switch(color.toLowerCase()) {
      case 'red': 
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'gray': 
        return 'bg-gray-500 text-white hover:bg-gray-600';
      case 'blue': 
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'white':
      default: 
        return 'bg-white text-black hover:bg-gray-50';
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

  // Total residents - sum of all dynamic column counts
  const total = dynamicStaffColumns.reduce((sum, staff) => sum + staff.count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <div className="p-6">
        {/* Header with search and back button */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isUploading 
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800'
                } text-white shadow-md hover:shadow-lg`}
                title="Upload Excel, CSV, txt of PDF bestand"
              >
                <Upload className={`h-5 w-5 ${isUploading ? 'animate-bounce' : ''}`} />
                <span className="font-medium">
                  {isUploading ? 'Uploading...' : 'Upload Bestand'}
                </span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Zoeken..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus.message && (
          <div className={`mb-4 p-4 rounded-lg ${
            uploadStatus.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-300' :
            uploadStatus.type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-300' :
            'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300'
          }`}>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>{uploadStatus.message}</span>
            </div>
          </div>
        )}

        {/* Centered date */}
        <div className="mb-6 flex justify-center">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">8/22/25</span>
        </div>

        {/* Main table */}
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
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
                        className="w-full text-xs text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded"
                        placeholder="Notitie..."
                      />
                    ) : (
                      <div className="text-xs text-center text-gray-400">-</div>
                    )}
                  </td>
                ))}
                <td className="border-0"></td>
              </tr>
              {/* Count row */}
              <tr>
                <td className="border-2 border-gray-800 px-2 py-1 text-xs font-bold bg-white">
                  Aantal jongeren:
                </td>
                {dynamicStaffColumns.map((staff, idx) => (
                  <td key={idx} className="border-2 border-gray-800 px-2 py-1 text-xs font-bold text-center bg-white">
                    <span className="w-full text-center font-bold text-blue-600">
                      {staff.count}
                    </span>
                  </td>
                ))}
                <td className="border-2 border-gray-800 px-3 py-1 text-lg font-bold text-center bg-green-500 text-white" title="Total residents from Match IT">
                  {total}
                </td>
              </tr>
              {/* Staff names row */}
              <tr>
                <td className="border-2 border-gray-800 px-2 py-1 bg-yellow-300 text-xs font-bold text-center">IB's</td>
                {dynamicStaffColumns.map((staff, idx) => (
                  <td key={idx} className="border-2 border-gray-800 px-2 py-1 bg-yellow-300">
                    <input
                      type="text"
                      value={staff.name}
                      onChange={(e) => handleStaffEdit(idx, 'name', e.target.value)}
                      className="w-full text-xs font-bold text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded"
                    />
                  </td>
                ))}
                <td className="border-2 border-gray-800"></td>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex} className={searchTerm && !row.some(cell => isVisible(cell.text)) ? 'hidden' : ''}>
                  <td className="border-2 border-gray-800 px-2 py-1 text-xs font-bold text-center bg-white">
                    {rowIndex < 15 ? rowIndex + 1 : ''}
                  </td>
                  {row.map((cell, colIndex) => (
                    <td 
                      key={colIndex}
                      className={`border-2 border-gray-800 px-1 py-1 text-xs cursor-pointer relative text-center ${getCellClass(cell.text, cell.type, cell.color)}`}
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
                            <button onClick={handleSaveCell} className="flex-1 p-0.5 bg-green-500 text-white rounded text-xs">
                              <Save className="h-3 w-3 mx-auto" />
                            </button>
                            <button onClick={handleCancelEdit} className="flex-1 p-0.5 bg-red-500 text-white rounded text-xs">
                              <X className="h-3 w-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center group w-full h-full relative">
                          <span className={`text-center ${!isVisible(cell.text) ? 'opacity-30' : ''}`}>{cell.text}</span>
                          {cell.text && (
                            <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 absolute top-1 right-1" />
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className={`border-2 border-gray-800 px-1 py-1 text-xs text-center ${
                    rowIndex === 1 ? 'bg-red-500 text-white' :
                    rowIndex === 2 ? 'bg-gray-500 text-white' :
                    rowIndex === 3 ? 'bg-blue-500 text-white' :
                    'bg-white'
                  }`} title="Specifications column - not a group">
                    {rowIndex === 1 && 'meerderjarig'}
                    {rowIndex === 2 && 'leeftijdstwijfel'}
                    {rowIndex === 3 && 'transfer'}
                  </td>
                </tr>
              ))}
              {/* Footer title row */}
              <tr>
                <td colSpan="11" className="border-2 border-gray-800 px-2 py-2 text-sm font-bold text-center bg-gray-100">
                  IB's GB's and NB's
                </td>
              </tr>
              {/* Footer rows - IB, GB, NB */}
              {Object.entries(bottomData).map(([key, values]) => (
                <tr key={key}>
                  <td className="border-2 border-gray-800 px-2 py-1 text-xs font-bold bg-white">{key}</td>
                  {values.map((value, idx) => (
                    <td key={idx} className="border-2 border-gray-800 px-2 py-1 text-xs bg-white">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleBottomEdit(key as 'IB' | 'GB' | 'NB', idx, e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded text-center"
                        placeholder="-"
                      />
                    </td>
                  ))}
                  {/* Specifications column - empty for IB/GB/NB rows (not part of any group) */}
                  <td className="border-2 border-gray-800 px-2 py-1 text-xs bg-white" title="Specifications column - not a group"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}