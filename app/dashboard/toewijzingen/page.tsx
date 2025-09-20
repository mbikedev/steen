'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Upload, Download, Trash2, X, Palette } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '../../../lib/DataContext';

interface CellData {
  [key: string]: string;
}

interface CellColorData {
  [key: string]: 'red' | 'blue' | 'gray' | null;
}

type ColorStatus = 'red' | 'blue' | 'gray' | null;

interface StaffMember {
  position: number;
  name: string;
}

interface GridData {
  row_number: number;
  column_number: number;
  resident_name: string;
  color_status?: ColorStatus;
}

const DEFAULT_IB_NAMES: Record<number, string> = {
  1: 'Kris B',
  2: 'Torben',
  3: 'Didar',
  4: 'Dorien',
  5: 'Evelien',
  6: 'Yasmina',
  7: 'Imane',
  8: 'Kirsten',
  9: 'Monica',
};

const RESIDENT_ROW_MIN = 3;
const RESIDENT_ROW_MAX = 13;
const IB_COLUMN_MIN = 1;
const IB_COLUMN_MAX = 9;

const Toewijzingen = () => {
  const { dataMatchIt, updateInDataMatchIt } = useData();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [cellData, setCellData] = useState<CellData>({});
  const [cellColors, setCellColors] = useState<CellColorData>({});
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [tempValue, setTempValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [showColorMenu, setShowColorMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add paste event listener
  useEffect(() => {
    const handlePasteEvent = (event: ClipboardEvent) => {
      // Only handle paste if focus is on the table area
      const target = event.target as HTMLElement;
      if (target.closest('table') || target.closest('.toewijzingen-container')) {
        handlePaste(event);
      }
    };

    document.addEventListener('paste', handlePasteEvent);
    
    return () => {
      document.removeEventListener('paste', handlePasteEvent);
    };
  }, []);

  const saveGridData = useCallback(
    async (rowNumber: number, columnNumber: number, residentName: string, colorStatus?: ColorStatus) => {
      try {
        const response = await fetch('/api/toewijzingen/grid', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            row_number: rowNumber,
            column_number: columnNumber,
            resident_name: residentName,
            color_status: colorStatus ?? null,
          }),
        });

        if (!response.ok) {
          console.warn('Failed to save grid data to database, continuing with local storage');
        }
      } catch (error) {
        console.warn('Error saving grid data to database:', error);
        // Data is still saved locally, so functionality continues
      }
    },
    []
  );

  const persistResidentCells = useCallback(
    async (cells: CellData, colors: CellColorData) => {
      const pending: Array<Promise<void>> = [];

      for (let row = RESIDENT_ROW_MIN; row <= RESIDENT_ROW_MAX; row++) {
        for (let column = IB_COLUMN_MIN; column <= IB_COLUMN_MAX; column++) {
          const cellKey = `${row}-${column}`;
          const rawName = cells[cellKey];
          const residentName = typeof rawName === 'string' ? rawName.trim() : '';
          const color = colors[cellKey] ?? null;

          pending.push(saveGridData(row, column, residentName, color ?? undefined));

          if (pending.length >= 10) {
            await Promise.all(pending);
            pending.length = 0;
          }
        }
      }

      if (pending.length > 0) {
        await Promise.all(pending);
      }
    },
    [saveGridData]
  );

  const loadData = useCallback(async () => {
    const defaultCellData: CellData = {
      '3-1': 'Jabarkhel Noor Agha',
      '4-1': 'ABDELA Omer Suleman',
      // Initialize backup row with default values
      '15-0': 'Yasmina',
      '15-1': 'Didar',
      '15-2': 'Torben',
      '15-3': 'Imane',
      '15-4': 'Maaike/Martine',
      '15-5': 'Kris',
      '15-6': 'Dorien',
      '15-7': 'Monica'
    };
    const fallbackStaff = Object.entries(DEFAULT_IB_NAMES).map(([position, name]) => ({
      position: Number(position),
      name,
    }));

    try {
      let staff: StaffMember[] = [];
      try {
        const staffResponse = await fetch('/api/toewijzingen/staff');
        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          if (Array.isArray(staffData)) {
            staff = staffData;
          }
        }
      } catch (error) {
        console.warn('Failed to load staff data from API, using defaults');
      }

      if (staff.length === 0) {
        staff = fallbackStaff;
      }
      setStaffData(staff);

      let cellDataMap: CellData = {};
      let cellColorMap: CellColorData = {};

      try {
        const gridResponse = await fetch('/api/toewijzingen/grid');
        if (gridResponse.ok) {
          const grid = await gridResponse.json();
          if (Array.isArray(grid)) {
            const dbCellData: CellData = {};
            const dbCellColors: CellColorData = {};
            grid.forEach((item: GridData) => {
              const cellKey = `${item.row_number}-${item.column_number}`;
              const name = typeof item.resident_name === 'string' ? item.resident_name : '';
              dbCellData[cellKey] = name;
              if (item.color_status) {
                dbCellColors[cellKey] = item.color_status;
              }
            });
            cellDataMap = Object.keys(dbCellData).length === 0 ? { ...defaultCellData } : dbCellData;
            cellColorMap = dbCellColors;
          }
        }
      } catch (error) {
        console.warn('Failed to load grid data from API, using defaults');
        cellDataMap = { ...defaultCellData };
        cellColorMap = {};
      }

      if (Object.keys(cellDataMap).length === 0) {
        cellDataMap = { ...defaultCellData };
      }

      setCellData(cellDataMap);
      setCellColors(cellColorMap);

      await persistResidentCells(cellDataMap, cellColorMap);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setStaffData(fallbackStaff);
      const fallbackCellData = { ...defaultCellData };
      setCellData(fallbackCellData);
      setCellColors({});
      await persistResidentCells(fallbackCellData, {});
      setLoading(false);
    }
  }, [persistResidentCells]);

  // Load data from database on mount
  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleColorChange = async (cellId: string, color: ColorStatus) => {
    const [rowStr, colStr] = cellId.split('-');
    const rowNumber = parseInt(rowStr);
    const columnNumber = parseInt(colStr);
    
    // Update local state
    if (color === null) {
      setCellColors(prev => {
        const newColors = { ...prev };
        delete newColors[cellId];
        return newColors;
      });
    } else {
      setCellColors(prev => ({ ...prev, [cellId]: color }));
    }
    
    // Save to database
    const residentName = cellData[cellId] || '';
    if (residentName) {
      await saveGridData(rowNumber, columnNumber, residentName, color);
    }
    
    setShowColorMenu(null);
  };

  const saveAllStaffData = async () => {
    const defaultStaff = [
      { position: 1, name: 'Kris B' },
      { position: 2, name: 'Torben' },
      { position: 3, name: 'Didar' },
      { position: 4, name: 'Dorien' },
      { position: 5, name: 'Evelien' },
      { position: 6, name: 'Yasmina' },
      { position: 7, name: 'Imane' },
      { position: 8, name: 'Kirsten' },
      { position: 9, name: 'Monica' },
    ];

    for (const staff of defaultStaff) {
      try {
        await fetch('/api/toewijzingen/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(staff),
        });
      } catch (error) {
        console.error('Error saving staff:', staff.name, error);
      }
    }
  };

  const saveAllGridData = async () => {
    for (const [cellKey, residentName] of Object.entries(cellData)) {
      if (residentName && residentName.trim() !== '') {
        const [rowStr, colStr] = cellKey.split('-');
        const rowNumber = parseInt(rowStr);
        const columnNumber = parseInt(colStr);
        
        try {
          await fetch('/api/toewijzingen/grid', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              row_number: rowNumber,
              column_number: columnNumber,
              resident_name: residentName,
            }),
          });
        } catch (error) {
          console.error('Error saving grid data:', cellKey, error);
        }
      }
    }
  };

  const saveAllData = async () => {
    setLoading(true);
    try {
      await saveAllStaffData();
      await saveAllGridData();
      alert('All data saved successfully!');
    } catch (error) {
      console.error('Error saving all data:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/toewijzingen/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Database setup completed successfully!');
        // Reload data after setup
        await loadData();
      } else {
        console.error('Setup error:', result);
        alert('Database setup failed. Please check console for details.');
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      alert('Error setting up database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async (event: ClipboardEvent) => {
    event.preventDefault();
    
    try {
      const clipboardData = event.clipboardData?.getData('text/plain');
      if (!clipboardData) return;

      // Parse clipboard data (assuming tab-separated values like from Excel/Sheets)
      const rows = clipboardData.trim().split('\n');
      const pastedData: CellData = {};

      rows.forEach((row, rowIndex) => {
        const cells = row.split('\t'); // Tab-separated
        cells.forEach((cellValue, colIndex) => {
          if (cellValue.trim()) {
            // Start pasting from row 4 (index 3) and column 2 (index 1) - the resident area
            const targetRow = rowIndex + 3; // Start from row 4 (number 1)
            const targetCol = colIndex + 1; // Start from column 2 (first staff column)
            
            // Only paste in valid areas (rows 3-13, columns 1-9) or backup rows (rows 15-17, columns 0-9)
            if ((targetRow >= 3 && targetRow <= 13 && targetCol >= 1 && targetCol <= 9) || 
                ((targetRow === 15 || targetRow === 16 || targetRow === 17) && targetCol >= 0 && targetCol <= 9)) {
              const cellKey = `${targetRow}-${targetCol}`;
              pastedData[cellKey] = cellValue.trim();
            }
          }
        });
      });

      // Update state with pasted data
      setCellData(prev => ({
        ...prev,
        ...pastedData
      }));

      // Save pasted data to database
      for (const [cellKey, residentName] of Object.entries(pastedData)) {
        const [rowStr, colStr] = cellKey.split('-');
        const rowNumber = parseInt(rowStr);
        const columnNumber = parseInt(colStr);
        await saveGridData(rowNumber, columnNumber, residentName);

        if (
          rowNumber >= RESIDENT_ROW_MIN &&
          rowNumber <= RESIDENT_ROW_MAX &&
          columnNumber >= IB_COLUMN_MIN &&
          columnNumber <= IB_COLUMN_MAX
        ) {
          const trimmedName = residentName.trim();
          const ibName = resolveIbNameForColumn(columnNumber);
          if (trimmedName && ibName) {
            updateResidentsReferent(columnNumber, ibName, trimmedName);
          }
        }
      }

      alert(`Pasted ${Object.keys(pastedData).length} cells successfully!`);
    } catch (error) {
      console.error('Error pasting data:', error);
      alert('Error pasting data. Please try again.');
    }
  };

  // Count residents for each column
  const getResidentCount = (columnIndex: number) => {
    let count = 0;
    for (let row = 3; row <= 13; row++) { // rows 4-14 (numbers 1-11)
      const cellKey = `${row}-${columnIndex}`;
      if (cellData[cellKey] && cellData[cellKey].trim() !== '') {
        count++;
      }
    }
    return count;
  };

  const handleCellClick = (e: React.MouseEvent, cellId: string, currentValue: string) => {
    // Handle multi-selection with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cellId)) {
          newSet.delete(cellId);
        } else {
          newSet.add(cellId);
        }
        return newSet;
      });
    } else if (e.shiftKey && selectionStart) {
      // Handle range selection with Shift key
      const [startRow, startCol] = selectionStart.split('-').map(Number);
      const [endRow, endCol] = cellId.split('-').map(Number);
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      
      const newSelection = new Set<string>();
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          // Only select valid cells (resident cells and backup rows)
          if ((row >= 3 && row <= 13 && col >= 1 && col <= 9) || ((row === 15 || row === 16 || row === 17) && col >= 0 && col <= 9)) {
            newSelection.add(`${row}-${col}`);
          }
        }
      }
      setSelectedCells(newSelection);
    } else {
      // Regular click - start editing or set as selection start
      setEditingCell(cellId);
      setTempValue(currentValue);
      setSelectedCells(new Set());
      setSelectionStart(cellId);
    }
  };

  const clearSelectedCells = async () => {
    if (selectedCells.size === 0) {
      alert('No cells selected. Use Ctrl/Cmd+Click to select cells.');
      return;
    }

    const confirmMessage = `Clear ${selectedCells.size} selected cell${selectedCells.size > 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      // Clear each selected cell
      for (const cellId of selectedCells) {
        const [rowStr, colStr] = cellId.split('-');
        const rowNumber = parseInt(rowStr);
        const columnNumber = parseInt(colStr);
        
        // Update local state
        setCellData(prev => {
          const newData = { ...prev };
          delete newData[cellId];
          return newData;
        });
        setCellColors(prev => {
          const newColors = { ...prev };
          delete newColors[cellId];
          return newColors;
        });
        
        // Clear in database (also clear color)
        await saveGridData(rowNumber, columnNumber, '', null);
      }
      
      setSelectedCells(new Set());
      alert(`Cleared ${selectedCells.size} cells successfully!`);
    } catch (error) {
      console.error('Error clearing selected cells:', error);
      alert('Error clearing cells. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllCells = async () => {
    const residentCells: string[] = [];
    // Include resident cells (rows 3-13, columns 1-9)
    for (let row = 3; row <= 13; row++) {
      for (let col = 1; col <= 9; col++) {
        const cellKey = `${row}-${col}`;
        if (cellData[cellKey] && cellData[cellKey].trim() !== '') {
          residentCells.push(cellKey);
        }
      }
    }
    // Include backup row cells (rows 15-17, columns 0-9)
    for (let row = 15; row <= 17; row++) {
      for (let col = 0; col <= 9; col++) {
        const cellKey = `${row}-${col}`;
        if (cellData[cellKey] && cellData[cellKey].trim() !== '') {
          residentCells.push(cellKey);
        }
      }
    }

    if (residentCells.length === 0) {
      alert('No resident data to clear.');
      return;
    }

    const confirmMessage = `Clear ALL ${residentCells.length} resident assignments? This cannot be undone!`;
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      // Clear all resident cells
      for (const cellId of residentCells) {
        const [rowStr, colStr] = cellId.split('-');
        const rowNumber = parseInt(rowStr);
        const columnNumber = parseInt(colStr);
        
        // Clear in database (also clear color)
        await saveGridData(rowNumber, columnNumber, '', null);
      }
      
      // Clear local state
      setCellData(prev => {
        const newData = { ...prev };
        residentCells.forEach(cellId => {
          delete newData[cellId];
        });
        return newData;
      });
      setCellColors(prev => {
        const newColors = { ...prev };
        residentCells.forEach(cellId => {
          delete newColors[cellId];
        });
        return newColors;
      });
      
      setSelectedCells(new Set());
      alert(`Cleared ${residentCells.length} cells successfully!`);
    } catch (error) {
      console.error('Error clearing all cells:', error);
      alert('Error clearing cells. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  };

  const handleCellBlur = (cellId: string) => {
    const [rowStr, colStr] = cellId.split('-');
    const rowNumber = parseInt(rowStr);
    const columnNumber = parseInt(colStr);
    
    setCellData(prev => ({
      ...prev,
      [cellId]: tempValue
    }));
    
    // Save to database with existing color
    const existingColor = cellColors[cellId];
    saveGridData(rowNumber, columnNumber, tempValue, existingColor);

    const trimmedValue = tempValue.trim();
    const isResidentAssignmentCell =
      rowNumber >= RESIDENT_ROW_MIN &&
      rowNumber <= RESIDENT_ROW_MAX &&
      columnNumber >= IB_COLUMN_MIN &&
      columnNumber <= IB_COLUMN_MAX;

    if (isResidentAssignmentCell && trimmedValue) {
      const ibName = resolveIbNameForColumn(columnNumber);
      if (ibName) {
        console.log(`Assigning IB "${ibName}" to resident "${trimmedValue}" in column ${columnNumber}`);
        updateResidentsReferent(columnNumber, ibName, trimmedValue);
      } else {
        console.warn(`No IB name found for column ${columnNumber}; skipping referent update for "${trimmedValue}"`);
      }
    }

    setEditingCell(null);
    setTempValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, cellId: string) => {
    if (e.key === 'Enter') {
      handleCellBlur(cellId);
    }
    if (e.key === 'Escape') {
      setEditingCell(null);
      setTempValue('');
    }
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON - expecting exactly 11 rows x 9 columns of resident data
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '', // Default value for empty cells
          blankrows: false,
          raw: false
        });

        console.log('Excel data loaded:', jsonData);

        // Process the Excel data - expecting pure data grid (11 rows x 9 columns)
        const importedCellData: CellData = {};
        
        // Process exactly 14 rows of data (11 resident rows + 3 backup rows)
        for (let rowIndex = 0; rowIndex < Math.min(14, jsonData.length); rowIndex++) {
          const row = jsonData[rowIndex] as string[];
          if (row && Array.isArray(row)) {
            if (rowIndex < 11) {
              // Process resident rows (first 11 rows)
              // Process exactly 9 columns
              for (let colIndex = 0; colIndex < Math.min(9, row.length); colIndex++) {
                const cellValue = row[colIndex];
                if (cellValue && typeof cellValue === 'string' && cellValue.trim().length > 0) {
                  // Map to grid coordinates: row 3-13 (11 rows), columns 1-9 (9 columns)
                  const gridRow = rowIndex + 3; // Start from row 3 (first resident row)
                  const gridCol = colIndex + 1; // Start from column 1 (first staff column)
                  
                  const cellKey = `${gridRow}-${gridCol}`;
                  importedCellData[cellKey] = cellValue.trim();
                }
              }
            } else {
              // Process backup rows (12th-14th rows map to rows 15-17)
              const backupRowIndex = rowIndex - 11; // 0, 1, 2
              const gridRow = 15 + backupRowIndex; // 15, 16, 17
              
              // Process exactly 10 columns (including column 0)
              for (let colIndex = 0; colIndex < Math.min(10, row.length); colIndex++) {
                const cellValue = row[colIndex];
                if (cellValue && typeof cellValue === 'string' && cellValue.trim().length > 0) {
                  const cellKey = `${gridRow}-${colIndex}`;
                  importedCellData[cellKey] = cellValue.trim();
                }
              }
            }
          }
        }

        // Update state with imported data
        setCellData(prev => ({
          ...prev,
          ...importedCellData
        }));

        // Save imported data to database
        setLoading(true);
        try {
          // Save grid data
          for (const [cellKey, residentName] of Object.entries(importedCellData)) {
            const [rowStr, colStr] = cellKey.split('-');
            const rowNumber = parseInt(rowStr);
            const columnNumber = parseInt(colStr);
            await saveGridData(rowNumber, columnNumber, residentName);

            if (
              rowNumber >= RESIDENT_ROW_MIN &&
              rowNumber <= RESIDENT_ROW_MAX &&
              columnNumber >= IB_COLUMN_MIN &&
              columnNumber <= IB_COLUMN_MAX
            ) {
              const trimmedName = residentName.trim();
              const ibName = resolveIbNameForColumn(columnNumber);
              if (trimmedName && ibName) {
                updateResidentsReferent(columnNumber, ibName, trimmedName);
              }
            }
          }

          alert(`Successfully imported ${Object.keys(importedCellData).length} resident assignments!`);
        } catch (error) {
          console.error('Error saving imported data:', error);
          alert('Data imported locally but failed to save to database. Data will still be visible.');
        } finally {
          setLoading(false);
        }

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Error reading Excel file. Please check the file format and try again.');
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      // Header row
      ['Verlof', 'Kris B', 'Torben', 'Didar', 'Dorien', 'Evelien', 'Yasmina', 'Imane', 'Kirsten', 'Monica'],
      // Count row (example)
      ['Aantal:', '2', '1', '3', '0', '2', '1', '2', '0', '1'],
      // Staff names row (for reference)
      ['IB\'s', 'Kris B', 'Torben', 'Didar', 'Dorien', 'Evelien', 'Yasmina', 'Imane', 'Kirsten', 'Monica'],
      // Sample resident data rows
      ['1', 'Sample Resident 1', '', 'Sample Resident 2', '', '', '', '', '', ''],
      ['2', '', 'Sample Resident 3', '', '', 'Sample Resident 4', '', '', '', ''],
      ['3', '', '', '', '', '', 'Sample Resident 5', '', '', ''],
      ['4', '', '', '', '', '', '', 'Sample Resident 6', '', ''],
      ['5', '', '', '', '', '', '', '', '', 'Sample Resident 7'],
      ['6', '', '', '', '', '', '', '', '', ''],
      ['7', '', '', '', '', '', '', '', '', ''],
      ['8', '', '', '', '', '', '', '', '', ''],
      ['9', '', '', '', '', '', '', '', '', ''],
      ['10', '', '', '', '', '', '', '', '', ''],
      ['11', '', '', '', '', '', '', '', '', ''],
      // Backup rows
      ['Yasmina', 'Didar', 'Torben', 'Imane', 'Maaike/Martine', 'Kris', 'Dorien', 'Monica', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '']
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Toewijzingen');
    
    // Save the file
    XLSX.writeFile(wb, 'toewijzingen_template.xlsx');
  };

  const getStaffName = (position: number) => {
    const staff = staffData.find(s => s.position === position);
    return staff?.name || '';
  };

  const resolveIbNameForColumn = (columnNumber: number) => {
    const configuredName = getStaffName(columnNumber);
    if (configuredName && configuredName.trim().length > 0) {
      return configuredName;
    }
    return DEFAULT_IB_NAMES[columnNumber] || '';
  };

  // Function to update a resident's referencePerson based on IB assignment
  const updateResidentsReferent = (columnNumber: number, ibName: string, residentName: string) => {
    try {
      if (!Array.isArray(dataMatchIt) || dataMatchIt.length === 0) {
        console.warn('No residents loaded when attempting to update referent; skipping.');
        return;
      }

      const trimmedIbName = ibName?.trim();
      const trimmedResidentName = residentName?.trim();

      if (!trimmedIbName || !trimmedResidentName) {
        return;
      }

      const normalizeValue = (value: string) =>
        value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s'-]/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();

      const normalizedResidentName = normalizeValue(trimmedResidentName);
      const normalizedIbName = normalizeValue(trimmedIbName);

      if (!normalizedResidentName || !normalizedIbName) {
        return;
      }

      const findByBadge = () => {
        const badgeMatch = trimmedResidentName.match(/\b(\d{3,})\b/);
        if (!badgeMatch) return null;
        const normalizedBadge = badgeMatch[1].replace(/^0+/, '');
        return (
          dataMatchIt.find((resident: any) => {
            if (resident?.badge == null) {
              return false;
            }
            const residentBadge = String(resident.badge).replace(/^0+/, '');
            return residentBadge === normalizedBadge;
          }) || null
        );
      };

      const findByName = () => {
        const matches = dataMatchIt.filter((resident: any) => {
          const firstName = resident?.firstName ?? resident?.first_name ?? '';
          const lastName = resident?.lastName ?? resident?.last_name ?? '';
          if (!firstName && !lastName) {
            return false;
          }
          const firstLast = normalizeValue(`${firstName} ${lastName}`);
          const lastFirst = normalizeValue(`${lastName} ${firstName}`);
          return (
            (firstLast && firstLast === normalizedResidentName) ||
            (lastFirst && lastFirst === normalizedResidentName)
          );
        });

        if (matches.length === 1) {
          return matches[0];
        }

        if (matches.length > 1) {
          const exactFirstLast = matches.find((resident: any) => {
            const first = resident?.firstName ?? resident?.first_name ?? '';
            const last = resident?.lastName ?? resident?.last_name ?? '';
            const firstLast = normalizeValue(`${first} ${last}`);
            return firstLast === normalizedResidentName;
          });
          if (exactFirstLast) {
            return exactFirstLast;
          }
          return matches[0];
        }

        return (
          dataMatchIt.find((resident: any) => {
            const first = resident?.firstName ?? resident?.first_name ?? '';
            const last = resident?.lastName ?? resident?.last_name ?? '';
            const firstLast = normalizeValue(`${first} ${last}`);
            return (
              firstLast &&
              (firstLast.includes(normalizedResidentName) || normalizedResidentName.includes(firstLast))
            );
          }) || null
        );
      };

      const matchedResident = findByBadge() ?? findByName();

      if (!matchedResident?.id) {
        console.warn(`No matching resident found for "${trimmedResidentName}" in column ${columnNumber}; skipping referent update.`);
        return;
      }

      const currentReference =
        matchedResident.referencePerson ?? matchedResident.reference_person ?? null;
      if (currentReference && normalizeValue(String(currentReference)) === normalizedIbName) {
        console.log(`Resident ${matchedResident.badge ?? matchedResident.id} already assigned to IB ${trimmedIbName}.`);
        return;
      }

      console.log(`Assigning IB "${trimmedIbName}" as referent for resident ${matchedResident.badge ?? matchedResident.id} (${trimmedResidentName}) in column ${columnNumber}.`);
      updateInDataMatchIt(matchedResident.id, { referencePerson: trimmedIbName });
    } catch (error) {
      console.error('Error updating residents referent:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Toewijzingen</h1>
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Toewijzingen</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearSelectedCells}
              disabled={loading || selectedCells.size === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title={`Clear ${selectedCells.size} selected cells`}
            >
              <X className="h-4 w-4" />
              Clear Selected ({selectedCells.size})
            </button>
            <button
              onClick={clearAllCells}
              disabled={loading}
              className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Clear all resident assignments"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
            <button
              onClick={downloadTemplate}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Template
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Import Excel file (11 rows x 9 columns + 3 backup rows x 10 columns)"
            >
              <Upload className="h-4 w-4" />
              Import Excel (11x9+3Backups)
            </button>
            <button
              onClick={setupDatabase}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Setting up...' : 'Setup Database'}
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch('/api/toewijzingen/add-color-column', {
                    method: 'POST',
                  });
                  const result = await response.json();
                  if (result.success) {
                    alert('Color status feature enabled!');
                    await loadData();
                  } else {
                    alert(result.suggestion || 'Please check console for details');
                    console.log('Color column setup:', result);
                  }
                } catch (error) {
                  console.error('Error adding color column:', error);
                  alert('Error setting up color feature');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Enable color coding for residents"
            >
              {loading ? 'Enabling...' : 'Enable Colors'}
            </button>
            <button
              onClick={saveAllData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save All to Database'}
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden toewijzingen-container pb-16" tabIndex={0}>
          <table className="border-collapse table-auto">
            <tbody>
              {Array.from({ length: 18 }, (_, rowIndex) => (
                <tr key={rowIndex} className="border-b-2 border-gray-500 dark:border-gray-400">
                  {rowIndex === 14 ? (
                    <td colSpan={10} className="border-2 border-gray-500 dark:border-gray-400 p-4 text-center bg-gray-100 dark:bg-gray-700">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold">Backups</span>
                        <button
                          onClick={async () => {
                            console.log('Clear all backup cells button clicked');
                            // Clear all backup cells immediately in UI
                            const newCellData = { ...cellData };
                            const newCellColors = { ...cellColors };
                            for (let row = 15; row <= 17; row++) {
                              for (let col = 0; col <= 9; col++) {
                                const cellId = `${row}-${col}`;
                                delete newCellData[cellId];
                                delete newCellColors[cellId];
                              }
                            }
                            setCellData(newCellData);
                            setCellColors(newCellColors);
                            console.log('UI state cleared for all backup cells');
                            
                            // Clear from database in parallel
                            try {
                              const clearPromises = [];
                              for (let row = 15; row <= 17; row++) {
                                for (let col = 0; col <= 9; col++) {
                                  clearPromises.push(saveGridData(row, col, '', null));
                                }
                              }
                              await Promise.all(clearPromises);
                              console.log('Successfully cleared all backup cells from database');
                            } catch (error) {
                              console.warn('Some backup cells may not have been cleared from database:', error);
                            }
                          }}
                          className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded text-red-600 dark:text-red-400"
                          title="Clear all backup cells"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  ) : (
                    Array.from({ length: 10 }, (_, colIndex) => (
                      <td key={colIndex} className="border-2 border-gray-500 dark:border-gray-400 dark:bg-gray-800 p-2 min-h-[60px] whitespace-nowrap">
                      {/* Header rows */}
                      {colIndex === 0 && rowIndex === 0 && <span className="font-bold">Verlof</span>}
                      {colIndex === 0 && rowIndex === 1 && <span className="font-bold">Aantal:</span>}
                      {colIndex === 0 && rowIndex === 2 && <span className="font-bold">IB's</span>}
                      
                      {/* Row numbers */}
                      {colIndex === 0 && rowIndex >= 3 && rowIndex <= 13 && <span>{rowIndex - 2}</span>}
                      
                      {/* Counts row */}
                      {rowIndex === 1 && colIndex >= 1 && colIndex <= 9 && <span className="font-bold">{getResidentCount(colIndex)}</span>}
                      
                      {/* Staff names row */}
                      {rowIndex === 2 && colIndex >= 1 && colIndex <= 9 && (
                        <span className="font-bold">{getStaffName(colIndex) || (colIndex === 1 ? 'Kris B' : colIndex === 2 ? 'Torben' : colIndex === 3 ? 'Didar' : colIndex === 4 ? 'Dorien' : colIndex === 5 ? 'Evelien' : colIndex === 6 ? 'Yasmina' : colIndex === 7 ? 'Imane' : colIndex === 8 ? 'Kirsten' : 'Monica')}</span>
                      )}
                      
                      {/* Editable resident cells (rows 4-14, columns 2-10) */}
                      {rowIndex >= 3 && rowIndex <= 13 && colIndex >= 1 && colIndex <= 9 && (() => {
                        const cellId = `${rowIndex}-${colIndex}`;
                        const cellValue = cellData[cellId] || '';
                        const isEditing = editingCell === cellId;
                        const isSelected = selectedCells.has(cellId);
                        const cellColor = cellColors[cellId];
                        
                        // Determine background color based on status
                        let bgColor = '';
                        if (cellColor === 'red') {
                          bgColor = 'bg-red-900 text-white';
                        } else if (cellColor === 'blue') {
                          bgColor = 'bg-blue-900 text-white';
                        } else if (cellColor === 'gray') {
                          bgColor = 'bg-gray-900 text-white';
                        }
                        
                        return (
                          <div className="relative">
                            {isEditing ? (
                              <input
                                type="text"
                                value={tempValue}
                                onChange={handleCellChange}
                                onBlur={() => handleCellBlur(cellId)}
                                onKeyDown={(e) => handleKeyDown(e, cellId)}
                                className="w-full p-1 text-sm border-0 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                <div 
                                  className={`flex-1 min-h-[20px] cursor-pointer p-1 rounded whitespace-pre-wrap transition-colors ${
                                    isSelected 
                                      ? 'border-2 border-blue-500' 
                                      : ''
                                  } ${
                                    bgColor || 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                  } ${
                                    !bgColor ? 'dark:text-white' : ''
                                  }`}
                                  onClick={(e) => handleCellClick(e, cellId, cellValue)}
                                  title={isSelected ? 'Selected (Ctrl/Cmd+Click to deselect)' : 'Ctrl/Cmd+Click to select'}
                                >
                                  {cellValue}
                                </div>
                                {cellValue && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowColorMenu(showColorMenu === cellId ? null : cellId);
                                    }}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded dark:text-white"
                                    title="Set color status"
                                  >
                                    <Palette className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Color menu dropdown */}
                            {showColorMenu === cellId && (
                              <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-500 dark:border-gray-400 rounded shadow-lg p-2">
                                <div className="text-xs font-semibold mb-1">Status:</div>
                                <button
                                  onClick={() => handleColorChange(cellId, 'red')}
                                  className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                >
                                  <span className="w-3 h-3 bg-red-500 rounded"></span>
                                  Adult (Legal age)
                                </button>
                                <button
                                  onClick={() => handleColorChange(cellId, 'blue')}
                                  className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                >
                                  <span className="w-3 h-3 bg-blue-500 rounded"></span>
                                  Transfer pending
                                </button>
                                <button
                                  onClick={() => handleColorChange(cellId, 'gray')}
                                  className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                >
                                  <span className="w-3 h-3 bg-gray-500 rounded"></span>
                                  Age uncertain
                                </button>
                                <button
                                  onClick={() => handleColorChange(cellId, null)}
                                  className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                >
                                  <span className="w-3 h-3 border border-gray-400 rounded"></span>
                                  Clear status
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      
                      {/* Editable backup staff rows 16, 17, 18 */}
                      {(rowIndex === 15 || rowIndex === 16 || rowIndex === 17) && colIndex >= 0 && colIndex <= 9 && (() => {
                        const cellId = `${rowIndex}-${colIndex}`;
                        const cellValue = cellData[cellId] || '';
                        const isEditing = editingCell === cellId;
                        const isSelected = selectedCells.has(cellId);
                        const cellColor = cellColors[cellId];
                        
                        // Determine background color based on status
                        let bgColor = '';
                        if (cellColor === 'red') {
                          bgColor = 'bg-red-900 text-white';
                        } else if (cellColor === 'blue') {
                          bgColor = 'bg-blue-900 text-white';
                        } else if (cellColor === 'gray') {
                          bgColor = 'bg-gray-900 text-white';
                        }
                        
                        return (
                          <div className="relative">
                            {isEditing ? (
                              <input
                                type="text"
                                value={tempValue}
                                onChange={handleCellChange}
                                onBlur={() => handleCellBlur(cellId)}
                                onKeyDown={(e) => handleKeyDown(e, cellId)}
                                className="w-full p-1 text-sm border-0 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                <div 
                                  className={`flex-1 min-h-[20px] cursor-pointer p-1 rounded whitespace-pre-wrap transition-colors ${
                                    isSelected 
                                      ? 'border-2 border-blue-500' 
                                      : ''
                                  } ${
                                    bgColor || 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                  } ${
                                    !bgColor ? 'dark:text-white' : ''
                                  }`}
                                  onClick={(e) => handleCellClick(e, cellId, cellValue)}
                                  title={isSelected ? 'Selected (Ctrl/Cmd+Click to deselect)' : 'Ctrl/Cmd+Click to select'}
                                >
                                  {cellValue}
                                </div>
                                {(cellValue || true) && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        console.log('Delete button clicked for cell:', cellId);
                                        const [rowStr, colStr] = cellId.split('-');
                                        const rowNumber = parseInt(rowStr);
                                        const columnNumber = parseInt(colStr);
                                        
                                        // Clear cell data immediately in UI
                                        setCellData(prev => {
                                          const newData = { ...prev };
                                          delete newData[cellId];
                                          return newData;
                                        });
                                        
                                        // Clear cell color immediately in UI
                                        setCellColors(prev => {
                                          const newColors = { ...prev };
                                          delete newColors[cellId];
                                          return newColors;
                                        });
                                        
                                        // Save to database
                                        try {
                                          await saveGridData(rowNumber, columnNumber, '', null);
                                          console.log('Successfully cleared cell from database:', cellId);
                                        } catch (error) {
                                          console.warn('Failed to clear cell from database:', error);
                                        }
                                      }}
                                      className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded text-red-600 dark:text-red-400"
                                      title="Delete cell content"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Color menu dropdown */}
                            {showColorMenu === cellId && (
                              <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-500 dark:border-gray-400 rounded shadow-lg p-2">
                                <div className="text-xs font-semibold mb-1">Status:</div>
                                <button
                                  onClick={() => handleColorChange(cellId, 'red')}
                                  className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                >
                                  <span className="w-3 h-3 bg-red-500 rounded"></span>
                                  Adult (Legal age)
                                </button>
                                <button
                                  onClick={() => handleColorChange(cellId, 'blue')}
                                  className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                >
                                  <span className="w-3 h-3 bg-blue-500 rounded"></span>
                                  Transfer pending
                                </button>
                                <button
                                  onClick={() => handleColorChange(cellId, 'gray')}
                                  className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                >
                                  <span className="w-3 h-3 bg-gray-500 rounded"></span>
                                  Age uncertain
                                </button>
                                <button
                                  onClick={() => handleColorChange(cellId, null)}
                                  className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                >
                                  <span className="w-3 h-3 border border-gray-400 rounded"></span>
                                  Clear status
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Hidden file input for Excel import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleExcelImport}
          className="hidden"
        />
      </div>
    </DashboardLayout>
  );
};

export default Toewijzingen;
