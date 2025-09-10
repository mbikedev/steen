'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, UserPlus, Trash2, Clipboard, Upload, Undo, Redo, RefreshCw, ChevronDown } from 'lucide-react';
import { useData } from "../../../lib/DataContext";
import AddUserModal from '../../components/AddUserModal';
import { formatDate, formatDateTime } from '../../../lib/utils';
import * as XLSX from 'xlsx';

// Helper function to calculate days of stay from arrival date
const calculateDaysOfStay = (arrivalDate: string | Date | null | undefined): number => {
  if (!arrivalDate) return 1; // Default to 1 if no arrival date
  
  try {
    const arrival = new Date(arrivalDate);
    const today = new Date();
    
    // Reset time parts to get accurate day count
    arrival.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - arrival.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Return at least 1 day (arrival day counts as day 1)
    return Math.max(1, diffDays + 1);
  } catch (error) {
    console.warn('Error calculating days of stay:', error);
    return 1;
  }
};

function DataMatchItPageContent() {
  const { dataMatchIt, bewonerslijst, deleteFromDataMatchIt, addToDataMatchIt, addMultipleToDataMatchIt, clearAllData, getStorageInfo, updateInDataMatchIt, undoDelete, redoDelete, canUndo, canRedo, deleteMultipleFromDataMatchIt, syncWithToewijzingen } = useData();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('bewonerslijst');
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

  // Handle URL parameter to switch between views
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'keukenlijst') {
      setCurrentView('keukenlijst');
    } else {
      setCurrentView('bewonerslijst');
    }
  }, [searchParams]);

  // Update timestamp on client side to avoid hydration mismatch
  // Also recalculate days of stay for all residents
  useEffect(() => {
    setLastUpdated(formatDateTime(new Date()));
    
    // Auto-update days of stay for all residents based on their arrival date
    const updatedResidents = dataMatchIt.filter(resident => {
      if (resident.dateIn) {
        const calculatedDays = calculateDaysOfStay(resident.dateIn);
        if (calculatedDays !== resident.daysOfStay) {
          return true;
        }
      }
      return false;
    });
    
    // Update residents with new days of stay
    updatedResidents.forEach(resident => {
      const calculatedDays = calculateDaysOfStay(resident.dateIn);
      console.log(`Auto-updating days of stay for ${resident.firstName} ${resident.lastName}: ${calculatedDays} days`);
      updateInDataMatchIt(resident.id, { daysOfStay: calculatedDays });
    });
  }, [dataMatchIt.length]); // Only recalculate when number of residents changes

  // Recalculate days of stay when page regains focus or at midnight
  useEffect(() => {
    const recalculateDaysOfStay = () => {
      console.log('Recalculating days of stay for all residents...');
      dataMatchIt.forEach(resident => {
        if (resident.dateIn) {
          const calculatedDays = calculateDaysOfStay(resident.dateIn);
          if (calculatedDays !== resident.daysOfStay) {
            console.log(`Updating days for ${resident.firstName} ${resident.lastName}: ${resident.daysOfStay} -> ${calculatedDays}`);
            updateInDataMatchIt(resident.id, { daysOfStay: calculatedDays });
          }
        }
      });
    };

    // Recalculate when page regains focus
    const handleFocus = () => {
      recalculateDaysOfStay();
    };

    // Calculate time until midnight for daily update
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set timeout for midnight update
    const midnightTimeout = setTimeout(() => {
      recalculateDaysOfStay();
      // Set interval for daily updates after first midnight
      const dailyInterval = setInterval(recalculateDaysOfStay, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(midnightTimeout);
    };
  }, [dataMatchIt, updateInDataMatchIt]);

  // Sync with Toewijzingen when page mounts
  useEffect(() => {
    console.log('🔄 Data Match It page mounted, syncing with Toewijzingen...');
    syncWithToewijzingen();
  }, []);

  // Get the appropriate data source based on current view
  const getCurrentDataSource = () => {
    return currentView === 'keukenlijst' ? bewonerslijst : dataMatchIt;
  };

  const filteredData = getCurrentDataSource()
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
        const headers = (jsonData[0] as any[]).map(h => {
          // Remove BOM and trim
          const cleanHeader = String(h || '').replace(/^\uFEFF/, '').trim();
          return cleanHeader;
        });
        console.log('Column headers found:', headers);
        console.log('Headers as JSON:', JSON.stringify(headers));

        // Find column indices by trying different header variations
        const findColumnIndex = (possibleNames: string[]) => {
          // First try exact match (case insensitive)
          for (const name of possibleNames) {
            const index = headers.findIndex(h => 
              h.toLowerCase() === name.toLowerCase()
            );
            if (index !== -1) {
              console.log(`Found exact match for column "${name}" at index ${index} (actual header: "${headers[index]}")`);
              return index;
            }
          }
          
          // Then try partial match
          for (const name of possibleNames) {
            const index = headers.findIndex(h => 
              h.toLowerCase().includes(name.toLowerCase()) || 
              h.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, '')
            );
            if (index !== -1) {
              console.log(`Found partial match for column "${name}" at index ${index} (actual header: "${headers[index]}")`);
              return index;
            }
          }
          
          console.log(`Column not found for any of: ${possibleNames.join(', ')}`);
          return -1;
        };

        // Map column names to indices
        const columns = {
          badge: findColumnIndex(['badge', 'Badge', 'externe referentie', 'Externe referentie', 'externe', 'referentie']),
          naam: findColumnIndex(['naam', 'Naam', 'last name', 'lastname', 'achternaam', 'Achternaam']),
          voornaam: findColumnIndex(['voornaam', 'Voornaam', 'first name', 'firstname']),
          blok: findColumnIndex(['blok', 'Blok', 'room', 'kamer', 'wooneenheid', 'Wooneenheid']),
          nationaliteit: findColumnIndex(['nationaliteit', 'Nationaliteit', 'nationality']),
          ovNummer: findColumnIndex(['ov nummer', 'OV Nummer', 'ovnummer', 'ov', 'OV nummer']),
          rijkregisternr: findColumnIndex(['rijkregisternr', 'Rijkregisternr', 'rijksregister', 'register', 'nationaal nummer', 'Nationaal Nummer']),
          geboortedatum: findColumnIndex(['geboortedatum', 'Geboortedatum', 'birth', 'geboorte']),
          leeftijd: findColumnIndex(['leeftijd', 'Leeftijd', 'age']),
          geslacht: findColumnIndex(['geslacht', 'Geslacht', 'gender', 'sex', 'Gender', 'Sex', 'M/F', 'm/f', 'M/V', 'm/v']),
          referentiepersoon: findColumnIndex(['referentiepersoon', 'Referentiepersoon', 'reference', 'referent', 'Referent', 'REFERENT', 'Referent ']),
          datumIn: findColumnIndex(['datum in', 'Datum In', 'aankomstdatum', 'Aankomstdatum', 'date in', 'datein']),
          dagenVerblijf: findColumnIndex(['dagen verblijf', 'Dagen verblijf', 'dagen', 'days', 'verblijf'])
        };

        console.log('Column mapping:', columns);
        console.log('Referentiepersoon column index:', columns.referentiepersoon);
        if (columns.referentiepersoon >= 0) {
          console.log('Referentiepersoon column header:', headers[columns.referentiepersoon]);
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
        const parsedResidents: any[] = [];
        const duplicates: {type: string, value: string, line: number, existing?: any}[] = [];
        const skippedResidents: any[] = [];
        const badgeNumbers = new Map<string, number>(); // Track badge numbers and their first occurrence

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
            if (i <= 5) {
              console.log(`Row ${i} - Badge column index: ${columns.badge}, Badge value: "${badgeValue}", All columns:`, columns);
            }
            
            // For Excel files, badge might be a number already
            let badge;
            if (typeof badgeValue === 'number') {
              badge = badgeValue;
            } else {
              badge = parseInt(String(badgeValue || '0').replace(/\D/g, '')) || 0;
            }
            
            // Skip rows without a valid badge number
            if (!badge || badge === 0) {
              console.log(`Skipping row ${i}: No valid badge number (value: "${badgeValue}", type: ${typeof badgeValue}, parsed: ${badge})`);
              errorCount++;
              continue;
            }
            
            // Check for duplicate badge numbers within the Excel file
            const badgeStr = String(badge);
            if (badgeNumbers.has(badgeStr)) {
              const firstOccurrence = badgeNumbers.get(badgeStr);
              console.error(`❌ DUPLICATE: Badge ${badge} appears in both row ${firstOccurrence} and row ${i}`);
              duplicates.push({
                type: 'badge-excel',
                value: badgeStr,
                line: i,
                existing: { line: firstOccurrence }
              });
              errorCount++;
              continue; // Skip this duplicate row
            }
            badgeNumbers.set(badgeStr, i);
            
            console.log(`✅ Row ${i}: Processing badge ${badge}`);

            // Helper function to parse dates from Excel
            const parseExcelDate = (dateValue: any): string => {
              if (!dateValue) return new Date().toISOString().split('T')[0];
              
              // If it's already a date string in DD/MM/YYYY format
              if (typeof dateValue === 'string' && dateValue.includes('/')) {
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                  const [day, month, year] = parts;
                  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
              }
              
              // If it's an Excel serial date number
              if (typeof dateValue === 'number') {
                const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
                return excelDate.toISOString().split('T')[0];
              }
              
              return new Date().toISOString().split('T')[0];
            };

            const newResident = {
              id: generateUniqueId(),
              badge: String(badge),  // Convert to string to match the type
              lastName: columns.naam >= 0 ? String(row[columns.naam] || '') : '',
              firstName: columns.voornaam >= 0 ? String(row[columns.voornaam] || '') : '',
              room: columns.blok >= 0 ? String(row[columns.blok] || '') : '',
              nationality: columns.nationaliteit >= 0 ? String(row[columns.nationaliteit] || '') : '',
              ovNumber: columns.ovNummer >= 0 ? String(row[columns.ovNummer] || '0000000') : '0000000',
              registerNumber: columns.rijkregisternr >= 0 ? String(row[columns.rijkregisternr] || `0FICT${badge}A`) : `0FICT${badge}A`,
              dateOfBirth: parseExcelDate(columns.geboortedatum >= 0 ? row[columns.geboortedatum] : null),
              age: columns.leeftijd >= 0 ? parseInt(String(row[columns.leeftijd] || '0')) || 0 : 0,
              gender: columns.geslacht >= 0 ? 
                (String(row[columns.geslacht] || '').toUpperCase().includes('V') || 
                 String(row[columns.geslacht] || '').toUpperCase().includes('F') || 
                 String(row[columns.geslacht] || '').toLowerCase().includes('vrouwelijk') ? 'F' : 'M') : 'M',
              referencePerson: (() => {
                if (columns.referentiepersoon >= 0) {
                  const rawValue = row[columns.referentiepersoon];
                  console.log(`Row ${i}: REFERENT raw value:`, rawValue, `(type: ${typeof rawValue}, index: ${columns.referentiepersoon})`);
                  
                  // Handle undefined, null, or empty values
                  if (rawValue === undefined || rawValue === null || rawValue === '') {
                    return '';
                  }
                  
                  // Convert to string and trim
                  const strValue = String(rawValue).trim();
                  console.log(`Row ${i}: REFERENT converted to string: "${strValue}"`);
                  
                  return strValue;
                } else {
                  console.log(`Row ${i}: REFERENT column not found (index: ${columns.referentiepersoon})`);
                  return '';
                }
              })(),
              dateIn: parseExcelDate(columns.datumIn >= 0 ? row[columns.datumIn] : null),
              daysOfStay: calculateDaysOfStay(parseExcelDate(columns.datumIn >= 0 ? row[columns.datumIn] : null)),
              status: 'active',
              name: '' // Add name field
            };

            // Check for duplicates
            let isDuplicate = false;
            
            // Check badge duplicate
            const existingByBadge = dataMatchIt.find(r => r.badge === String(badge));
            if (existingByBadge) {
              duplicates.push({
                type: 'badge',
                value: String(badge),
                line: i,
                existing: existingByBadge
              });
              skippedResidents.push(newResident);
              isDuplicate = true;
              console.warn(`Excel Import: Badge ${badge} already exists, row ${i} skipped`);
            }
            
            // Check name duplicate
            const fullName = `${newResident.firstName} ${newResident.lastName}`.toLowerCase();
            const existingByName = dataMatchIt.find(r => 
              `${r.firstName} ${r.lastName}`.toLowerCase() === fullName
            );
            if (existingByName && !isDuplicate) {
              duplicates.push({
                type: 'name',
                value: `${newResident.firstName} ${newResident.lastName}`,
                line: i,
                existing: existingByName
              });
              skippedResidents.push(newResident);
              isDuplicate = true;
              console.warn(`Excel Import: Name ${newResident.firstName} ${newResident.lastName} already exists, row ${i} skipped`);
            }
            
            if (isDuplicate) {
              errorCount++;
              continue;
            }

            // Log the created resident for debugging
            if (i <= 5 || i === jsonData.length - 1) {
              console.log(`Created resident ${i}:`, newResident);
            }
            
            // Collect residents instead of adding individually
            parsedResidents.push(newResident);
            successCount++;
            console.log(`✅ Added resident ${badge} to import list (total: ${successCount})`);
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
        message += `✅ ${successCount} rijen succesvol geïmporteerd\n`;
        
        // Show duplicate information
        if (duplicates.length > 0) {
          message += `\n⚠️ ${duplicates.length} duplica${duplicates.length !== 1 ? 'ten' : 'at'} gevonden:\n`;
          
          const excelDuplicates = duplicates.filter(d => d.type === 'badge-excel');
          const badgeDuplicates = duplicates.filter(d => d.type === 'badge');
          const nameDuplicates = duplicates.filter(d => d.type === 'name');
          
          if (excelDuplicates.length > 0) {
            message += `\n❌ DUPLICATEN IN EXCEL BESTAND:\n`;
            message += `${excelDuplicates.length} dubbele Badge nummer${excelDuplicates.length !== 1 ? 's' : ''} gevonden in het Excel bestand:\n`;
            excelDuplicates.slice(0, 5).forEach(d => {
              message += `  • Badge ${d.value} komt voor op rij ${d.existing.line} en rij ${d.line}\n`;
            });
            if (excelDuplicates.length > 5) {
              message += `  ... en ${excelDuplicates.length - 5} meer\n`;
            }
            message += `\n⚠️ Verwijder eerst de dubbele badges uit het Excel bestand!\n`;
          }
          
          if (badgeDuplicates.length > 0) {
            message += `• ${badgeDuplicates.length} badge${badgeDuplicates.length !== 1 ? 's' : ''} bestaan al in het systeem\n`;
          }
          if (nameDuplicates.length > 0) {
            message += `• ${nameDuplicates.length} na${nameDuplicates.length !== 1 ? 'men' : 'am'} besta${nameDuplicates.length !== 1 ? 'an' : 'at'} al in het systeem\n`;
          }
        }
        
        const otherErrors = errorCount - duplicates.length;
        if (otherErrors > 0) {
          message += `❌ ${otherErrors} rijen overgeslagen (ongeldige data)\n`;
          if (errors.length > 0) {
            message += `\nFouten:\n${errors.slice(0, 3).join('\n')}`;
            if (errors.length > 3) {
              message += `\n... en ${errors.length - 3} meer`;
            }
          }
        }
        
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
      const calculatedDays = calculateDaysOfStay(processedValue);
      updates.daysOfStay = calculatedDays;
      console.log(`✓ Auto-calculated days of stay: ${calculatedDays} days from entry date ${processedValue}`);
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
      const duplicates: {type: string, value: string, line: number, existing?: any}[] = [];
      const skippedResidents: any[] = [];

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
            
            // Calculate days of stay from entry date
            let calculatedDaysOfStay = parsedDateIn ? calculateDaysOfStay(parsedDateIn) : 1;
            
            if (parsedDateIn) {
              console.log(`✓ Calculated days of stay for ${columns[2]} ${columns[1]}: ${calculatedDaysOfStay} from entry date ${parsedDateIn}`);
            } else {
              // If no entry date provided, try to use the value from the column
              const providedDays = parseNumber(columns[12]);
              if (providedDays > 0) {
                calculatedDaysOfStay = providedDays;
                console.log(`Using provided days of stay for ${columns[2]} ${columns[1]}: ${calculatedDaysOfStay} days`);
              } else {
                calculatedDaysOfStay = 1; // Default to 1 day if no information
                console.log(`⚠️  No valid entry date or days for ${columns[2]} ${columns[1]}, using default: ${calculatedDaysOfStay} day`);
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
              badge: String(badgeNumber),  // Ensure badge is a string
              name: `${columns[2] || ''} ${columns[1] || ''}`.trim(),
              firstName: columns[2]?.trim() || '',
              lastName: columns[1]?.trim() || '',
              room: columns[3]?.trim() || '',
              nationality: columns[4]?.trim() || '',
              ovNumber: ovNumber,
              registerNumber: registerNumber,
              dateOfBirth: parsedDateOfBirth,
              age: calculatedAge,
              gender: (columns[9]?.trim()?.toLowerCase().includes('vrouwelijk') || 
                       columns[9]?.trim()?.toUpperCase().includes('V') || 
                       columns[9]?.trim()?.toUpperCase().includes('F')) ? 'F' : 'M',
              referencePerson: String(columns[10]?.trim() || ''),  // Ensure referencePerson is a string
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

            // Check for duplicates by badge and name
            let isDuplicate = false;
            
            // Check badge duplicate
            const existingByBadge = dataMatchIt.find(r => String(r.badge) === String(newResident.badge));
            if (existingByBadge) {
              duplicates.push({
                type: 'badge',
                value: String(newResident.badge),
                line: i + 1,
                existing: existingByBadge
              });
              skippedResidents.push(newResident);
              isDuplicate = true;
              console.warn(`Bewoner met badge ${newResident.badge} bestaat al, regel ${i + 1} overgeslagen`);
            }
            
            // Check name duplicate (exact match of first + last name)
            const fullName = `${newResident.firstName} ${newResident.lastName}`.toLowerCase();
            const existingByName = dataMatchIt.find(r => 
              `${r.firstName} ${r.lastName}`.toLowerCase() === fullName
            );
            if (existingByName && !isDuplicate) {
              duplicates.push({
                type: 'name',
                value: `${newResident.firstName} ${newResident.lastName}`,
                line: i + 1,
                existing: existingByName
              });
              skippedResidents.push(newResident);
              isDuplicate = true;
              console.warn(`Bewoner ${newResident.firstName} ${newResident.lastName} bestaat al, regel ${i + 1} overgeslagen`);
            }
            
            if (isDuplicate) {
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

      // Show result message with detailed duplicate info
      let message = `${successCount} bewoner${successCount !== 1 ? 's' : ''} succesvol toegevoegd`;
      
      // Show duplicate details if any
      if (duplicates.length > 0) {
        message += `\n\n⚠️ ${duplicates.length} duplica${duplicates.length !== 1 ? 'ten' : 'at'} gevonden en overgeslagen:`;
        
        // Group duplicates by type
        const badgeDuplicates = duplicates.filter(d => d.type === 'badge');
        const nameDuplicates = duplicates.filter(d => d.type === 'name');
        
        if (badgeDuplicates.length > 0) {
          message += `\n• ${badgeDuplicates.length} badge duplica${badgeDuplicates.length !== 1 ? 'ten' : 'at'}`;
          if (badgeDuplicates.length <= 3) {
            badgeDuplicates.forEach(d => {
              message += `\n  - Badge ${d.value} (regel ${d.line})`;
            });
          }
        }
        
        if (nameDuplicates.length > 0) {
          message += `\n• ${nameDuplicates.length} naam duplica${nameDuplicates.length !== 1 ? 'ten' : 'at'}`;
          if (nameDuplicates.length <= 3) {
            nameDuplicates.forEach(d => {
              message += `\n  - ${d.value} (regel ${d.line})`;
            });
          }
        }
        
        if (duplicates.length > 3) {
          message += `\n\nMeer details in de browser console (F12)`;
        }
      }
      
      if (errorCount > duplicates.length) {
        const otherErrors = errorCount - duplicates.length;
        message += `\n${otherErrors} regel${otherErrors !== 1 ? 's' : ''} overgeslagen (fouten)`;
      }
      
      message += `\n\n✓ Leeftijd en dagen verblijf automatisch berekend uit datums`;
      message += `\n✓ Datumformaten geconverteerd naar standaard format`;
      
      // Ask user if they want to see the full duplicate list if many duplicates
      if (duplicates.length > 5) {
        message += `\n\nWilt u de volledige lijst met duplicaten zien in de console?`;
        alert(message);
        
        // Log detailed duplicate information
        console.group('🔍 Duplicaten Rapport');
        console.table(duplicates.map(d => ({
          'Regel': d.line,
          'Type': d.type === 'badge' ? 'Badge' : 'Naam',
          'Waarde': d.value,
          'Bestaande Badge': d.existing?.badge,
          'Bestaande Naam': `${d.existing?.firstName} ${d.existing?.lastName}`
        })));
        console.groupEnd();
      } else {
        alert(message);
      }

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
                <div className="text-lg font-bold">DATA-MATCH-IT</div>
                <div className="text-sm mt-1 capitalize">
                  {currentView === 'keukenlijst' ? 'Keukenlijst' : 'Bewonerslijst'}
                </div>
              </div>
              <div className="text-center text-gray-900 dark:text-gray-100">
                {formatDate(new Date())}
              </div>
              <div className="text-right">
                <div className="text-black dark:text-gray-100">
                  Aantal: <span className="font-bold">{getCurrentDataSource().length}</span> bewoners
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Gefilterd: <span className="font-bold">{filteredData.length}</span>
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
                    REFERENT
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
                  <tr key={`${resident.id}-${resident.badge}-${index}`} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} border-b border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600`}>
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
                      <div className="px-1 py-1" title="Leeftijd wordt automatisch berekend uit geboortedatum">
                        {resident.age || 0}
                      </div>
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
                      <div className="flex items-center gap-1">
                        {resident.dateIn ? (
                          <span title={`Automatisch berekend vanaf ${formatDate(resident.dateIn)}`}>
                            {calculateDaysOfStay(resident.dateIn)}
                          </span>
                        ) : (
                          renderEditableCell(resident, 'daysOfStay', resident.daysOfStay, 'number')
                        )}
                      </div>
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
                      <strong>Data Status:</strong> {storageInfo.hasData ? '✅ Opgeslagen in database' : '❌ Niet opgeslagen'}
                    </div>
                    <div>
                      <strong>Records in database:</strong> {storageInfo.recordCount}
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

export default function DataMatchItPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DataMatchItPageContent />
    </Suspense>
  );
}