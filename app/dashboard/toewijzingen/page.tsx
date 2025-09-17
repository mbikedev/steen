'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Upload, Download, Trash2, X, Palette } from 'lucide-react';
import * as XLSX from 'xlsx';

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

const Toewijzingen = () => {
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

  // Load data from database on mount
  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      // Load staff data with fallback
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
      
      // If no staff data from API, use default values
      if (staff.length === 0) {
        staff = [
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
      }
      setStaffData(staff);

      // Load grid data with fallback
      let cellDataMap: CellData = {
        '3-1': 'Jabarkhel Noor Agha',
        '4-1': 'ABDELA Omer Suleman'
      };
      let cellColorMap: CellColorData = {};
      
      try {
        const gridResponse = await fetch('/api/toewijzingen/grid');
        if (gridResponse.ok) {
          const grid = await gridResponse.json();
          if (Array.isArray(grid)) {
            // Convert grid data to cellData format
            const dbCellData: CellData = {};
            const dbCellColors: CellColorData = {};
            grid.forEach((item: GridData) => {
              const cellKey = `${item.row_number}-${item.column_number}`;
              dbCellData[cellKey] = item.resident_name;
              if (item.color_status) {
                dbCellColors[cellKey] = item.color_status;
              }
            });
            cellDataMap = { ...cellDataMap, ...dbCellData };
            cellColorMap = { ...cellColorMap, ...dbCellColors };
          }
        }
      } catch (error) {
        console.warn('Failed to load grid data from API, using defaults');
      }
      
      setCellData(cellDataMap);
      setCellColors(cellColorMap);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set default data even on error
      setStaffData([
        { position: 1, name: 'Kris B' },
        { position: 2, name: 'Torben' },
        { position: 3, name: 'Didar' },
        { position: 4, name: 'Dorien' },
        { position: 5, name: 'Evelien' },
        { position: 6, name: 'Yasmina' },
        { position: 7, name: 'Imane' },
        { position: 8, name: 'Kirsten' },
        { position: 9, name: 'Monica' },
      ]);
      setCellData({
        '3-1': 'Jabarkhel Noor Agha',
        '4-1': 'ABDELA Omer Suleman'
      });
      setLoading(false);
    }
  };

  const saveGridData = async (rowNumber: number, columnNumber: number, residentName: string, colorStatus?: ColorStatus) => {
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
          color_status: colorStatus || null,
        }),
      });
      
      if (!response.ok) {
        console.warn('Failed to save grid data to database, continuing with local storage');
      }
    } catch (error) {
      console.warn('Error saving grid data to database:', error);
      // Data is still saved locally, so functionality continues
    }
  };

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
            
            // Only paste in valid resident areas (rows 3-13, columns 1-9)
            if (targetRow >= 3 && targetRow <= 13 && targetCol >= 1 && targetCol <= 9) {
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
          // Only select valid resident cells
          if (row >= 3 && row <= 13 && col >= 1 && col <= 9) {
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
    for (let row = 3; row <= 13; row++) {
      for (let col = 1; col <= 9; col++) {
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
        
        // Process exactly 11 rows of resident data
        for (let rowIndex = 0; rowIndex < Math.min(11, jsonData.length); rowIndex++) {
          const row = jsonData[rowIndex] as string[];
          if (row && Array.isArray(row)) {
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
      ['11', '', '', '', '', '', '', '', '', '']
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
              title="Import Excel file (11 rows x 9 columns)"
            >
              <Upload className="h-4 w-4" />
              Import Excel (11x9)
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
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden toewijzingen-container" tabIndex={0}>
          <table className="border-collapse table-auto">
            <tbody>
              {Array.from({ length: 18 }, (_, rowIndex) => (
                <tr key={rowIndex} className="border-b dark:border-gray-600">
                  {rowIndex === 14 ? (
                    <td colSpan={10} className="border border-gray-300 dark:border-gray-600 p-4 text-center bg-gray-100 dark:bg-gray-700">
                      <span className="font-bold">Backups</span>
                    </td>
                  ) : (
                    Array.from({ length: 10 }, (_, colIndex) => (
                      <td key={colIndex} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-2 min-h-[60px] whitespace-nowrap">
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
                              <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg p-2">
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
                      
                      {/* Backup staff row 16 */}
                      {rowIndex === 15 && colIndex === 0 && <span>Yasmina</span>}
                      {rowIndex === 15 && colIndex === 1 && <span>Didar</span>}
                      {rowIndex === 15 && colIndex === 2 && <span>Torben</span>}
                      {rowIndex === 15 && colIndex === 3 && <span>Imane</span>}
                      {rowIndex === 15 && colIndex === 4 && <span>Maaike/Martine</span>}
                      {rowIndex === 15 && colIndex === 5 && <span>Kris</span>}
                      {rowIndex === 15 && colIndex === 6 && <span>Dorien</span>}
                      {rowIndex === 15 && colIndex === 7 && <span>Monica</span>}
                      {rowIndex === 15 && colIndex === 8 && <span></span>}
                      {rowIndex === 15 && colIndex === 9 && <span></span>}
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