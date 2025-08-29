'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, UserPlus, Trash2, Clipboard, Upload, Undo, Redo, RefreshCw } from 'lucide-react';
import { useData } from '../../../lib/DataContext';
import AddUserModal from '../../components/AddUserModal';
import { formatDate, formatDateTime } from '../../../lib/utils';
import { testDatabaseConnection } from '../../../lib/supabase';
import { fullDatabaseDiagnostic, quickConnectionTest } from '../../../lib/debug-supabase';
import * as XLSX from 'xlsx';

export default function DataMatchItPage() {
  const { dataMatchIt, deleteFromDataMatchIt, addToDataMatchIt, addMultipleToDataMatchIt, clearAllData, getStorageInfo, updateInDataMatchIt, undoDelete, redoDelete, canUndo, canRedo, deleteMultipleFromDataMatchIt, syncWithToewijzingen } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedResidents, setSelectedResidents] = useState<Set<number>>(new Set());
  const [isPasting, setIsPasting] = useState(false);
  const [lastPasteDebug, setLastPasteDebug] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [editingCells, setEditingCells] = useState<{[key: string]: any}>({});
  const [editingValues, setEditingValues] = useState<{[key: string]: any}>({});
  const [dbSyncStatus, setDbSyncStatus] = useState<{type: 'success' | 'error' | 'info' | null, message: string}>({type: null, message: ''});
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update timestamp on client side to avoid hydration mismatch
  useEffect(() => {
    setLastUpdated(formatDateTime(new Date()));
  }, [dataMatchIt]);

  // Sync with Toewijzingen when page mounts
  useEffect(() => {
    console.log('🔄 Data Match It page mounted, syncing with Toewijzingen...');
    syncWithToewijzingen();
  }, []);

  const filteredData = dataMatchIt
    .filter(resident => {
      const matchesSearch = 
        resident.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.badge.toString().includes(searchTerm) ||
        resident.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.room.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => a.badge - b.badge); // Sort by badge number (lowest to highest)

  const handleSelectResident = (residentId: number) => {
    const newSelected = new Set(selectedResidents);
    if (newSelected.has(residentId)) {
      newSelected.delete(residentId);
    } else {
      newSelected.add(residentId);
    }
    setSelectedResidents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResidents.size === filteredData.length) {
      setSelectedResidents(new Set());
    } else {
      setSelectedResidents(new Set(filteredData.map(r => r.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedResidents.size === 0) return;
    
    const count = selectedResidents.size;
    const confirmMessage = `Weet je zeker dat je ${count} geselecteerde bewoner${count > 1 ? 's' : ''} wilt verwijderen?`;
    
    if (confirm(confirmMessage)) {
      // Use batch delete for better undo/redo support
      deleteMultipleFromDataMatchIt(Array.from(selectedResidents));
      setSelectedResidents(new Set());
    }
  };

  // Generate a unique ID using timestamp and random components
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}-${random2}`;
  };

  // Handle Excel file upload
  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Use sheet_to_json with more options to ensure all data is read
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          defval: '', // Default value for empty cells
          blankrows: false, // Skip blank rows
          raw: false, // Use formatted strings rather than raw values
          header: 1 // Return array of arrays to handle any header format
        });

        console.log('Excel sheet name:', sheetName);
        console.log('Total rows found (including header):', jsonData.length);
        console.log('First 3 rows (raw):', jsonData.slice(0, 3));

        // Skip header row and process data
        if (jsonData.length < 2) {
          alert('Excel bestand bevat geen data rijen');
          return;
        }

        // Get headers from first row
        const headers = (jsonData[0] as any[]).map(h => String(h || '').trim());
        console.log('Column headers found:', headers);

        // Find column indices by trying different header variations
        const findColumnIndex = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            const index = headers.findIndex(h => 
              h.toLowerCase().includes(name.toLowerCase()) || 
              h.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, '')
            );
            if (index !== -1) {
              console.log(`Found column "${name}" at index ${index} (actual header: "${headers[index]}")`);
              return index;
            }
          }
          return -1;
        };

        // Map column names to indices
        const columns = {
          badge: findColumnIndex(['badge', 'Badge']),
          naam: findColumnIndex(['naam', 'Naam', 'last name', 'lastname']),
          voornaam: findColumnIndex(['voornaam', 'Voornaam', 'first name', 'firstname']),
          blok: findColumnIndex(['blok', 'Blok', 'room', 'kamer']),
          nationaliteit: findColumnIndex(['nationaliteit', 'Nationaliteit', 'nationality']),
          ovNummer: findColumnIndex(['ov nummer', 'OV Nummer', 'ovnummer', 'ov', 'OV nummer']),
          rijkregisternr: findColumnIndex(['rijkregisternr', 'Rijkregisternr', 'rijksregister', 'register']),
          geboortedatum: findColumnIndex(['geboortedatum', 'Geboortedatum', 'birth', 'geboorte']),
          leeftijd: findColumnIndex(['leeftijd', 'Leeftijd', 'age']),
          geslacht: findColumnIndex(['geslacht', 'Geslacht', 'gender', 'sex']),
          referentiepersoon: findColumnIndex(['referentiepersoon', 'Referentiepersoon', 'reference', 'referent']),
          datumIn: findColumnIndex(['datum in', 'Datum In', 'datum', 'date in', 'datein']),
          dagenVerblijf: findColumnIndex(['dagen verblijf', 'Dagen verblijf', 'dagen', 'days', 'verblijf'])
        };

        console.log('Column mapping:', columns);

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
        const parsedResidents: ResidentData[] = [];

        // Process each data row (skip header at index 0)
        for (let i = 1; i < jsonData.length; i++) {
          try {
            const row = jsonData[i] as any[];
            
            // Debug: log the row data for first few rows
            if (i <= 3) {
              console.log(`Row ${i} data:`, row);
            }

            // Get badge value - try to parse it
            let badgeValue = columns.badge >= 0 ? row[columns.badge] : null;
            const badge = parseInt(String(badgeValue || '0').replace(/\D/g, '')) || 0;
            
            // Skip rows without a valid badge number
            if (!badge || badge === 0) {
              console.log(`Skipping row ${i}: No valid badge number (value: "${badgeValue}")`);
              errorCount++;
              continue;
            }

            const newResident = {
              id: generateUniqueId(),
              badge: badge,
              lastName: columns.naam >= 0 ? String(row[columns.naam] || '') : '',
              firstName: columns.voornaam >= 0 ? String(row[columns.voornaam] || '') : '',
              room: columns.blok >= 0 ? String(row[columns.blok] || '') : '',
              nationality: columns.nationaliteit >= 0 ? String(row[columns.nationaliteit] || '') : '',
              ovNumber: columns.ovNummer >= 0 ? String(row[columns.ovNummer] || '0000000') : '0000000',
              registerNumber: columns.rijkregisternr >= 0 ? String(row[columns.rijkregisternr] || `0FICT${badge}A`) : `0FICT${badge}A`,
              dateOfBirth: columns.geboortedatum >= 0 ? row[columns.geboortedatum] : new Date(),
              age: columns.leeftijd >= 0 ? parseInt(String(row[columns.leeftijd] || '0')) || 0 : 0,
              gender: columns.geslacht >= 0 ? String(row[columns.geslacht] || 'M') : 'M',
              referencePerson: columns.referentiepersoon >= 0 ? String(row[columns.referentiepersoon] || '') : '',
              dateIn: columns.datumIn >= 0 ? row[columns.datumIn] : new Date(),
              daysOfStay: columns.dagenVerblijf >= 0 ? parseInt(String(row[columns.dagenVerblijf] || '0')) || 0 : 0,
              status: 'active'
            };

            // Collect residents instead of adding individually
            parsedResidents.push(newResident);
            successCount++;
          } catch (rowError) {
            console.error(`Error processing row ${i}:`, rowError);
            errors.push(`Row ${i}: ${rowError}`);
            errorCount++;
          }
        }

        // Batch add all parsed residents
        if (parsedResidents.length > 0) {
          setDbSyncStatus({type: 'info', message: `Toevoegen van ${parsedResidents.length} bewoners...`});
          await addMultipleToDataMatchIt(parsedResidents);
          setDbSyncStatus({type: 'success', message: `✅ ${parsedResidents.length} bewoners toegevoegd (lokaal opgeslagen)`});
          
          // Clear status after 5 seconds
          setTimeout(() => setDbSyncStatus({type: null, message: ''}), 5000);
        }

        // Show detailed result message
        let message = `Import voltooid:\n`;
        message += `- ${successCount} rijen succesvol geïmporteerd\n`;
        if (errorCount > 0) {
          message += `- ${errorCount} rijen overgeslagen (geen geldige badge nummer)\n`;
          if (errors.length > 0) {
            message += `\nFouten:\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) {
              message += `\n... en ${errors.length - 5} meer`;
            }
          }
        }
        // Only mention database sync if it's configured
        // message += `\n✅ Data wordt automatisch gesynchroniseerd naar database`;
        
        alert(message);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Fout bij het lezen van het Excel bestand. Probeer het bestand opnieuw op te slaan in Excel en probeer het dan nog een keer.');
      }
    };

    reader.readAsArrayBuffer(file); // Use readAsArrayBuffer instead of readAsBinaryString
  };

  // Inline editing functions
  const startEditing = (residentId: number, field: string, currentValue: any) => {
    const key = `${residentId}-${field}`;
    setEditingCells({ ...editingCells, [key]: true });
    setEditingValues({ ...editingValues, [key]: currentValue });
  };

  const saveEdit = (residentId: number, field: string) => {
    const key = `${residentId}-${field}`;
    const newValue = editingValues[key];
    
    // Handle different data types and apply validation
    let processedValue = newValue;
    if (field === 'badge' || field === 'age' || field === 'daysOfStay') {
      processedValue = parseInt(newValue) || 0;
    } else if (field === 'gender') {
      processedValue = newValue === 'Vrouwelijk' || newValue === 'V' ? 'V' : 'M';
    } else if (typeof newValue === 'string') {
      processedValue = newValue.trim();
    }
    
    // Apply default values if empty for specific fields
    if (field === 'ovNumber' && (!processedValue || processedValue === '')) {
      processedValue = '0000000';
      console.log(`Applied default OV Nummer for badge ${residentId}: ${processedValue}`);
    } else if (field === 'registerNumber' && (!processedValue || processedValue === '')) {
      const resident = dataMatchIt.find(r => r.id === residentId);
      processedValue = `0FICT${resident?.badge || 0}A`;
      console.log(`Applied default Rijkregisternr for badge ${resident?.badge}: ${processedValue}`);
    }
    
    // Prepare updates object - may include calculated fields
    const updates: any = { [field]: processedValue };
    
    // Auto-calculate age if birth date was edited
    if (field === 'dateOfBirth' && processedValue) {
      try {
        const birthDate = new Date(processedValue);
        const today = new Date();
        const calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (calculatedAge >= 0 && calculatedAge < 150) { // Sanity check
          updates.age = calculatedAge;
          console.log(`✓ Auto-calculated age: ${calculatedAge} years from birth date ${processedValue}`);
        }
      } catch (error) {
        console.warn(`Failed to calculate age from birth date ${processedValue}:`, error);
      }
    }
    
    // Auto-calculate days of stay if entry date was edited
    if (field === 'dateIn' && processedValue) {
      try {
        const entryDate = new Date(processedValue);
        const today = new Date();
        const daysDifference = Math.floor((today.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000));
        // Days start at 1 (same day = 1 day of stay), ensure minimum 1
        const calculatedDays = Math.max(1, daysDifference + 1);
        updates.daysOfStay = calculatedDays;
        console.log(`✓ Auto-calculated days of stay: ${calculatedDays} days from entry date ${processedValue}`);
      } catch (error) {
        console.warn(`Failed to calculate days of stay from entry date ${processedValue}:`, error);
      }
    }
    
    updateInDataMatchIt(residentId, updates);
    
    // Clear editing state
    const newEditingCells = { ...editingCells };
    const newEditingValues = { ...editingValues };
    delete newEditingCells[key];
    delete newEditingValues[key];
    setEditingCells(newEditingCells);
    setEditingValues(newEditingValues);
  };

  const cancelEdit = (residentId: number, field: string) => {
    const key = `${residentId}-${field}`;
    const newEditingCells = { ...editingCells };
    const newEditingValues = { ...editingValues };
    delete newEditingCells[key];
    delete newEditingValues[key];
    setEditingCells(newEditingCells);
    setEditingValues(newEditingValues);
  };

  const handleEditChange = (residentId: number, field: string, value: any) => {
    const key = `${residentId}-${field}`;
    setEditingValues({ ...editingValues, [key]: value });
  };

  const handleKeyPress = (e: React.KeyboardEvent, residentId: number, field: string) => {
    if (e.key === 'Enter') {
      saveEdit(residentId, field);
    } else if (e.key === 'Escape') {
      cancelEdit(residentId, field);
    }
  };

  // Helper function to render editable cells
  const renderEditableCell = (resident: any, field: string, value: any, inputType: string = 'text') => {
    const key = `${resident.id}-${field}`;
    const isEditing = editingCells[key];
    const editValue = editingValues[key] !== undefined ? editingValues[key] : value;

    if (isEditing) {
      if (field === 'gender') {
        return (
          <div className="flex items-center gap-1">
            <select
              value={editValue}
              onChange={(e) => handleEditChange(resident.id, field, e.target.value)}
              onBlur={() => saveEdit(resident.id, field)}
              onKeyDown={(e) => handleKeyPress(e, resident.id, field)}
              className="w-full px-1 py-1 text-xs border dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-gray-100"
              autoFocus
            >
              <option value="M">Mannelijk</option>
              <option value="V">Vrouwelijk</option>
            </select>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-1">
            <input
              type={inputType}
              value={editValue}
              onChange={(e) => handleEditChange(resident.id, field, e.target.value)}
              onBlur={() => saveEdit(resident.id, field)}
              onKeyDown={(e) => handleKeyPress(e, resident.id, field)}
              className="w-full px-1 py-1 text-xs border dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-gray-100"
              autoFocus
            />
          </div>
        );
      }
    }

    return (
      <div
        className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800/30 px-1 py-1 rounded text-xs"
        onClick={() => startEditing(resident.id, field, value)}
        title="Klik om te bewerken"
      >
        {field === 'gender' 
          ? (value === 'M' ? 'Mannelijk' : 'Vrouwelijk')
          : (field === 'dateOfBirth' || field === 'dateIn')
          ? (value ? formatDate(value) : '')
          : (value || '')}
      </div>
    );
  };

  const handlePasteUsers = async () => {
    setIsPasting(true);
    
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        alert('Geen data gevonden in klembord');
        return;
      }

      const lines = clipboardText.trim().split('\n');
      const parsedResidents = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          // Split by tab (Excel default) or comma, handle quoted values
          let columns: string[];
          if (line.includes('\t')) {
            // Tab-separated (Excel copy)
            columns = line.split('\t').map(col => col.trim().replace(/^"|"$/g, ''));
          } else {
            // Comma-separated fallback
            columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
          }
          
          console.log(`Regel ${i + 1}: ${columns.length} kolommen:`, columns);
          
          // Handle different column structures - be more flexible
          if (columns.length >= 3) { // Minimum required: badge, naam, voornaam
            // Clean up numeric values - handle empty strings and invalid numbers
            const parseNumber = (value: string): number => {
              const cleaned = value?.toString().trim();
              if (!cleaned || cleaned === '' || cleaned.toLowerCase() === 'invalid date' || cleaned.toLowerCase() === 'null' || cleaned.toLowerCase() === 'undefined') return 0;
              
              // Handle decimal numbers and convert to integer
              const parsed = parseFloat(cleaned);
              if (isNaN(parsed)) return 0;
              
              // Return integer part
              return Math.floor(Math.abs(parsed)); // Ensure positive integer
            };

            const parseDate = (value: string): string => {
              const cleaned = value?.toString().trim();
              if (!cleaned || cleaned === '' || cleaned.toLowerCase() === 'invalid date') return '';
              
              // Handle different date formats
              try {
                // Check for formats like 1/2/1997, 12/31/1997, 1-2-1997, etc.
                if (cleaned.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/)) {
                  const parts = cleaned.split(/[\/\-]/);
                  let day = parseInt(parts[0]);
                  let month = parseInt(parts[1]);
                  let year = parseInt(parts[2]);
                  
                  // Handle 2-digit years
                  if (year < 100) {
                    year += year < 30 ? 2000 : 1900; // Assume 0-29 is 2000s, 30-99 is 1900s
                  }
                  
                  // Create ISO date string (YYYY-MM-DD)
                  const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  
                  // Validate the date
                  const testDate = new Date(isoDate);
                  if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
                    console.log(`Converted date ${cleaned} to ${isoDate}`);
                    return isoDate;
                  }
                }
                
                // Handle ISO format (YYYY-MM-DD) or other standard formats
                const testDate = new Date(cleaned);
                if (!isNaN(testDate.getTime())) {
                  const isoDate = testDate.toISOString().split('T')[0];
                  console.log(`Converted date ${cleaned} to ${isoDate}`);
                  return isoDate;
                }
              } catch (error) {
                console.warn(`Failed to parse date: ${cleaned}`, error);
              }
              
              return cleaned; // Return original if parsing fails
            };

            // Parse dates first
            const parsedDateOfBirth = parseDate(columns[7]);
            const parsedDateIn = parseDate(columns[11]);
            
            // Calculate age from birth date if available
            let calculatedAge = parseNumber(columns[8]); // Use provided age as fallback
            if (parsedDateOfBirth) {
              try {
                const birthDate = new Date(parsedDateOfBirth);
                const today = new Date();
                const ageFromBirth = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                if (ageFromBirth > 0 && ageFromBirth < 150) { // Sanity check
                  calculatedAge = ageFromBirth;
                  console.log(`✓ Calculated age for ${columns[2]} ${columns[1]}: ${calculatedAge} years from birth date ${parsedDateOfBirth}`);
                } else {
                  console.warn(`Calculated age ${ageFromBirth} seems invalid for ${columns[2]} ${columns[1]}, using provided age: ${calculatedAge}`);
                }
              } catch (error) {
                console.warn(`Failed to calculate age from birth date ${parsedDateOfBirth}:`, error);
              }
            } else if (columns[7]?.trim()) {
              console.warn(`Could not parse birth date "${columns[7]}" for ${columns[2]} ${columns[1]}, using provided age: ${calculatedAge}`);
            }
            
            // Calculate days of stay from entry date if available
            let calculatedDaysOfStay = parseNumber(columns[12]); // Use provided value as fallback
            
            if (parsedDateIn) {
              try {
                const entryDate = new Date(parsedDateIn);
                const today = new Date();
                const daysFromEntry = Math.floor((today.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000));
                if (daysFromEntry >= 0) { // Must be positive
                  calculatedDaysOfStay = daysFromEntry;
                  console.log(`✓ Calculated days of stay for ${columns[2]} ${columns[1]}: ${calculatedDaysOfStay} from entry date ${parsedDateIn}`);
                } else {
                  console.warn(`Entry date ${parsedDateIn} is in the future for ${columns[2]} ${columns[1]}, using provided value: ${calculatedDaysOfStay}`);
                }
              } catch (error) {
                console.warn(`Failed to calculate days of stay from entry date ${parsedDateIn}:`, error);
              }
            } else if (columns[11]?.trim()) {
              console.warn(`Could not parse entry date "${columns[11]}" for ${columns[2]} ${columns[1]}, using provided days of stay: ${calculatedDaysOfStay}`);
            }
            
            // Ensure days of stay is never 0 or empty - provide default if needed
            if (calculatedDaysOfStay === 0 || isNaN(calculatedDaysOfStay)) {
              // If no entry date and no provided value, estimate based on typical stay
              if (!parsedDateIn && (!columns[11]?.trim() || columns[11].trim() === '')) {
                calculatedDaysOfStay = 30; // Default to 30 days if no information available
                console.log(`⚠️  No entry date or days provided for ${columns[2]} ${columns[1]}, using default: ${calculatedDaysOfStay} days`);
              } else if (calculatedDaysOfStay === 0) {
                calculatedDaysOfStay = 1; // Minimum 1 day if calculation results in 0
                console.log(`⚠️  Days of stay was 0 for ${columns[2]} ${columns[1]}, setting to minimum: ${calculatedDaysOfStay} day`);
              }
            }

            // Apply default values for OV Nummer and Rijkregisternr if empty
            const badgeNumber = parseNumber(columns[0]);
            let ovNumber = columns[5]?.trim() || '';
            // Check for empty, null, undefined, or whitespace-only values
            if (!ovNumber || ovNumber === '' || ovNumber === null || ovNumber === undefined || 
                (typeof ovNumber === 'string' && ovNumber.trim() === '')) {
              ovNumber = '0000000'; // Seven zeros for empty OV Nummer
              console.log(`Applied default OV Nummer for badge ${badgeNumber}: ${ovNumber}`);
            }
            
            let registerNumber = columns[6]?.trim() || '';
            // Check for empty, null, undefined, or whitespace-only values
            if (!registerNumber || registerNumber === '' || registerNumber === null || registerNumber === undefined || 
                (typeof registerNumber === 'string' && registerNumber.trim() === '')) {
              registerNumber = `0FICT${badgeNumber}A`; // 0FICT + badge + A for empty Rijkregisternr
              console.log(`Applied default Rijkregisternr for badge ${badgeNumber}: ${registerNumber}`);
            }

            const newResident = {
              id: Date.now() + i,
              badge: badgeNumber,
              name: `${columns[2] || ''} ${columns[1] || ''}`.trim(),
              firstName: columns[2]?.trim() || '',
              lastName: columns[1]?.trim() || '',
              block: columns[3]?.trim() || '',
              room: columns[3]?.trim() || '',
              nationality: columns[4]?.trim() || '',
              ovNumber: ovNumber,
              registerNumber: registerNumber,
              dateOfBirth: parsedDateOfBirth,
              age: calculatedAge,
              gender: (columns[9]?.trim() === 'Vrouwelijk' || columns[9]?.trim() === 'V') ? 'V' : 'M',
              referencePerson: columns[10]?.trim() || '',
              dateIn: parsedDateIn,
              daysOfStay: calculatedDaysOfStay,
              status: 'active'
            };

            // Log summary of automatic calculations
            const calculations = [];
            if (parsedDateOfBirth && calculatedAge !== parseNumber(columns[8])) {
              calculations.push(`age: ${calculatedAge} (from ${parsedDateOfBirth})`);
            }
            if (parsedDateIn && calculatedDaysOfStay !== parseNumber(columns[12])) {
              calculations.push(`days of stay: ${calculatedDaysOfStay} (from ${parsedDateIn})`);
            }
            if (calculations.length > 0) {
              console.log(`📊 Auto-calculated for ${newResident.firstName} ${newResident.lastName}: ${calculations.join(', ')}`);
            }

            console.log('Parsed resident:', newResident);

            // Skip if badge already exists
            const existingResident = dataMatchIt.find(r => r.badge === newResident.badge);
            if (existingResident) {
              console.warn(`Bewoner met badge ${newResident.badge} bestaat al, overgeslagen`);
              errorCount++;
              continue;
            }

            parsedResidents.push(newResident);
            successCount++;
          } else {
            console.warn(`Regel ${i + 1} heeft onvoldoende kolommen:`, columns);
            errorCount++;
          }
        } catch (error) {
          console.error(`Fout bij verwerken regel ${i + 1}:`, error);
          errorCount++;
        }
      }

      // Batch add all parsed residents
      if (parsedResidents.length > 0) {
        setDbSyncStatus({type: 'info', message: `Toevoegen van ${parsedResidents.length} bewoners...`});
        await addMultipleToDataMatchIt(parsedResidents);
        setDbSyncStatus({type: 'success', message: `✅ ${parsedResidents.length} bewoners toegevoegd (lokaal opgeslagen)`});
        
        // Clear status after 5 seconds
        setTimeout(() => setDbSyncStatus({type: null, message: ''}), 5000);
      }

      // Show result message
      let message = `${successCount} bewoner${successCount !== 1 ? 's' : ''} succesvol toegevoegd`;
      if (errorCount > 0) {
        message += `\n${errorCount} regel${errorCount !== 1 ? 's' : ''} overgeslagen (fouten of duplicaten)`;
      }
      message += `\n\n✓ Leeftijd en dagen verblijf automatisch berekend uit datums`;
      message += `\n✓ Datumformaten geconverteerd naar standaard format`;
      // Only mention database sync if it's configured
      // message += `\n✓ Data wordt automatisch gesynchroniseerd naar database`;
      message += `\n\nKijk in de browser console (F12) voor gedetailleerde informatie.`;
      alert(message);

      console.log('Paste operation completed:', {
        totalLines: lines.length,
        successCount,
        errorCount,
        addedResidents: parsedResidents
      });

      // Show debug info temporarily
      setLastPasteDebug(`Laatste plakactie: ${successCount} toegevoegd, ${errorCount} overgeslagen`);
      setTimeout(() => setLastPasteDebug(null), 5000); // Hide after 5 seconds

    } catch (error) {
      console.error('Fout bij lezen klembord:', error);
      alert('Kon klembord niet lezen. Zorg ervoor dat je data hebt gekopieerd.');
    } finally {
      setIsPasting(false);
    }
  };

  // Add keyboard shortcuts for paste (Ctrl+V), undo (Ctrl+Z), and redo (Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're not in an input field
      const activeElement = document.activeElement;
      const isInputField = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
      
      // Ctrl+V for paste
      if (event.ctrlKey && event.key === 'v' && !isPasting && !isInputField) {
        event.preventDefault();
        handlePasteUsers();
      }
      
      // Ctrl+Z for undo
      if (event.ctrlKey && !event.shiftKey && event.key === 'z' && !isInputField) {
        event.preventDefault();
        if (canUndo) {
          undoDelete();
        }
      }
      
      // Ctrl+Shift+Z or Ctrl+Y for redo
      if ((event.ctrlKey && event.shiftKey && event.key === 'z') || 
          (event.ctrlKey && event.key === 'y')) {
        if (!isInputField) {
          event.preventDefault();
          if (canRedo) {
            redoDelete();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPasting, canUndo, canRedo]);

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen transition-colors">
        {/* Header - Matching PDF Layout */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="bg-blue-200 dark:bg-blue-600 px-3 py-2 text-center font-semibold text-black dark:text-white">
                DATA-MATCH-IT
              </div>
              <div className="text-center text-gray-900 dark:text-gray-100">
                {formatDate(new Date())}
              </div>
              <div className="text-right">
                <div className="text-black dark:text-gray-100">
                  Aantal: <span className="font-bold">{dataMatchIt.length}</span> bewoners
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Gefilterd: <span className="font-bold">{filteredData.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Import Instructions */}
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clipboard className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Data Importeren vanuit Excel
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p><strong>Optie 1:</strong> Upload een Excel bestand met de "Excel Importeren" knop.</p>
                <p className="mt-1"><strong>Optie 2:</strong> Kopieer rijen vanuit Excel en plak ze hier.</p>
                <p className="mt-2">Verwachte kolomnamen in Excel:</p>
                <p className="mt-1 font-mono text-xs bg-blue-100 dark:bg-blue-800/30 p-1 rounded">
                  Badge | Naam | Voornaam | Blok | Nationaliteit | OV Nummer | Rijkregisternr | Geboortedatum | Leeftijd | Geslacht | Referentiepersoon | Datum In | Dagen verblijf
                </p>
                <div className="mt-2 text-xs space-y-1">
                  <p><strong>Vereist:</strong> Badge, Naam, Voornaam (kolommen 1-3)</p>
                  <p><strong>Datums:</strong> Ondersteunt 1/2/1997, 12-31-1997, 2024-01-15 formaten</p>
                  <p><strong>Auto-berekening:</strong> Leeftijd en dagen verblijf worden automatisch berekend</p>
                  <p><strong>Tip:</strong> Gebruik Ctrl+V om snel te plakken</p>
                  <p><strong>Probleem?</strong> Open browser console (F12) voor details</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Sync Status */}
        {dbSyncStatus.type && (
          <div className={`mb-4 border rounded-lg p-3 ${
            dbSyncStatus.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : dbSyncStatus.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {dbSyncStatus.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : dbSyncStatus.type === 'error' ? (
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${
                  dbSyncStatus.type === 'success' 
                    ? 'text-green-800 dark:text-green-200' 
                    : dbSyncStatus.type === 'error'
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>{dbSyncStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {lastPasteDebug && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800 dark:text-green-200">{lastPasteDebug}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek op badge, naam, nationaliteit, kamer..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-black dark:text-gray-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Undo Button */}
              <button 
                onClick={undoDelete}
                disabled={!canUndo}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  !canUndo
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
                }`}
                title="Ongedaan maken (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
                Ongedaan
              </button>

              {/* Redo Button */}
              <button 
                onClick={redoDelete}
                disabled={!canRedo}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  !canRedo
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
                }`}
                title="Opnieuw (Ctrl+Shift+Z)"
              >
                <Redo className="h-4 w-4" />
                Opnieuw
              </button>

              {/* Sync with Toewijzingen Button */}
              <button 
                onClick={async () => {
                  console.log('🔄 Manual sync triggered');
                  console.log('🔍 syncWithToewijzingen function:', typeof syncWithToewijzingen);
                  
                  if (typeof syncWithToewijzingen === 'function') {
                    setIsSyncing(true);
                    try {
                      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to show loading
                      syncWithToewijzingen();
                      console.log('✅ Sync function called successfully');
                      setDbSyncStatus({type: 'success', message: 'Synchronisatie voltooid!'});
                      setTimeout(() => setDbSyncStatus({type: null, message: ''}), 3000);
                    } catch (error) {
                      console.error('❌ Error calling sync function:', error);
                      setDbSyncStatus({type: 'error', message: 'Fout bij synchronisatie'});
                      setTimeout(() => setDbSyncStatus({type: null, message: ''}), 3000);
                    } finally {
                      setIsSyncing(false);
                    }
                  } else {
                    console.error('❌ syncWithToewijzingen is not a function:', syncWithToewijzingen);
                    setDbSyncStatus({type: 'error', message: 'Sync functie niet beschikbaar'});
                    setTimeout(() => setDbSyncStatus({type: null, message: ''}), 3000);
                  }
                }}
                disabled={isSyncing}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isSyncing 
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800'
                } text-white`}
                title="Synchroniseer referentiepersoon met Toewijzingen"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchroniseert...' : 'Sync Toewijzingen'}
              </button>

              {/* Delete Selected Button */}
              <button 
                onClick={handleDeleteSelected}
                disabled={selectedResidents.size === 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  selectedResidents.size === 0
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Verwijder Geselecteerd ({selectedResidents.size})
              </button>

              {/* Clear All Data Button */}
              {dataMatchIt.length > 0 && (
                <button 
                  onClick={() => {
                    if (confirm('Weet je zeker dat je ALLE data wilt wissen?')) {
                      clearAllData();
                      setSelectedResidents(new Set());
                    }
                  }}
                  className="px-4 py-2 bg-red-800 dark:bg-red-900 text-white rounded-lg hover:bg-red-900 dark:hover:bg-red-950 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Alles Wissen
                </button>
              )}

              {/* Paste Users Button */}
              <button 
                onClick={handlePasteUsers}
                disabled={isPasting}
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 flex items-center gap-2 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                <Clipboard className="h-4 w-4" />
                {isPasting ? 'Plakken...' : 'Gebruikers Plakken'}
              </button>

              {/* Excel Upload Button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Excel Importeren
              </button>

              {/* Hidden file input for Excel */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />

              {/* Add User Button */}
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Gebruiker Toevoegen
              </button>

              {/* Database Test Button */}
              <button 
                onClick={() => {
                  console.log('🔍 Running full database diagnostic...');
                  fullDatabaseDiagnostic();
                }}
                className="px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800 flex items-center gap-2"
              >
                🔍 DB Test
              </button>

              {/* Test Add Resident Button */}
              <button 
                onClick={async () => {
                  console.log('🧪 Testing adding resident to database...');
                  const testResident = {
                    id: Date.now() + Math.random(),
                    firstName: 'Test',
                    lastName: 'Person',
                    badge: `TEST${Date.now()}`,
                    room: '101',
                    nationality: 'Dutch',
                    age: 25,
                    gender: 'M',
                    status: 'active',
                    dateOfBirth: '1999-01-01',
                    name: 'Test Person',
                    block: '1',
                    ovNumber: '',
                    registerNumber: '',
                    referencePerson: '',
                    dateIn: new Date().toISOString().split('T')[0],
                    daysOfStay: 1
                  };
                  
                  console.log('🔄 About to add test resident:', testResident);
                  await addToDataMatchIt(testResident);
                  console.log('✅ Test resident add function completed');
                }}
                className="px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 flex items-center gap-2"
              >
                🧪 Test Add
              </button>
            </div>
          </div>
        </div>

        {/* Data Table - Matching PDF Layout */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-teal-700 dark:bg-teal-800 text-white">
                <tr>
                  <th className="px-1 py-2 text-center font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700 w-12" style={{fontSize: '0.625rem'}}>
                    <input
                      type="checkbox"
                      checked={selectedResidents.size === filteredData.length && filteredData.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Externe referentie
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Achternaam
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Voornaam
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Wooneenheid
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Nationaliteit
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    OV Nummer
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Nationaal Nummer
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Geboortedatum
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Leeftijd
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Geslacht
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Referentiepersoon
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight border-r border-teal-600 dark:border-teal-700" style={{fontSize: '0.625rem'}}>
                    Aankomstdatum
                  </th>
                  <th className="px-1 py-2 text-left font-bold uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Dagen verblijf
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {filteredData.map((resident, index) => (
                  <tr key={resident.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} border-b border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600`}>
                    <td className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="checkbox"
                        checked={selectedResidents.has(resident.id)}
                        onChange={() => handleSelectResident(resident.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600 font-medium">
                      {renderEditableCell(resident, 'badge', resident.badge, 'number')}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'lastName', resident.lastName)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'firstName', resident.firstName)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'room', resident.room)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'nationality', resident.nationality)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'ovNumber', resident.ovNumber)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'registerNumber', resident.registerNumber)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'dateOfBirth', resident.dateOfBirth, 'date')}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'age', resident.age, 'number')}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'gender', resident.gender)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'referencePerson', resident.referencePerson)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(resident, 'dateIn', resident.dateIn, 'date')}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100">
                      {renderEditableCell(resident, 'daysOfStay', resident.daysOfStay, 'number')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


        {/* Data Footer */}
        <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex justify-between items-center">
            <div>
              Toont <span className="font-medium">{filteredData.length}</span> van{' '}
              <span className="font-medium">{dataMatchIt.length}</span> records
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">
                Laatst bijgewerkt: {lastUpdated}
              </div>
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                {showDebugPanel ? 'Verberg debug' : 'Toon debug'}
              </button>
              <button
                onClick={() => testDatabaseConnection()}
                className="text-xs text-blue-400 hover:text-blue-600 underline ml-2"
              >
                Test Database
              </button>
              <button
                onClick={() => fullDatabaseDiagnostic()}
                className="text-xs text-green-400 hover:text-green-600 underline ml-2"
              >
                Full Diagnostic
              </button>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Debug Informatie - Data Persistentie</h4>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              {(() => {
                const storageInfo = getStorageInfo();
                return storageInfo ? (
                  <>
                    <div>
                      <strong>Data Status:</strong> {storageInfo.hasData ? '✅ Opgeslagen in localStorage' : '❌ Niet opgeslagen'}
                    </div>
                    <div>
                      <strong>Records in localStorage:</strong> {storageInfo.recordCount}
                    </div>
                    <div>
                      <strong>Records in geheugen:</strong> {dataMatchIt.length}
                    </div>
                    <div>
                      <strong>Data grootte:</strong> {(storageInfo.dataSize / 1024).toFixed(1)} KB
                    </div>
                    {storageInfo.lastUpdated && (
                      <div>
                        <strong>Laatst opgeslagen:</strong> {storageInfo.lastUpdated}
                      </div>
                    )}
                    <div className="text-green-600">
                      <strong>Persistentie:</strong> ✅ Data blijft behouden bij pagina refresh en browser herstart
                    </div>
                  </>
                ) : (
                  <div className="text-red-600">❌ Fout bij laden storage informatie</div>
                );
              })()}
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (confirm('Weet je zeker dat je alle data wilt wissen?')) {
                      clearAllData();
                      setShowDebugPanel(false);
                    }
                  }}
                  className="px-3 py-1 bg-red-600 dark:bg-red-700 text-white text-xs rounded hover:bg-red-700 dark:hover:bg-red-800"
                >
                  Alle data wissen
                </button>
                <span className="ml-2 text-xs text-gray-500">
                  (Verwijdert alle bewoners en opgeslagen data)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        <AddUserModal 
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}