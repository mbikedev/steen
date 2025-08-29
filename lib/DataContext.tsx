'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResidentData, getBewonerslijstData, getKeukenlijstData, getNoordData, getZuidData } from './excelUtils';
import { BedOccupancy, ALL_ROOMS, getRoomConfig, CAPACITY } from './bedConfig';
import { dbOperations, testDatabaseConnection } from './supabase';

interface DataContextType {
  // Data-Match-It is the primary source
  dataMatchIt: ResidentData[];
  setDataMatchIt: (data: ResidentData[]) => void;
  addToDataMatchIt: (resident: ResidentData) => Promise<void>;
  addMultipleToDataMatchIt: (residents: ResidentData[]) => Promise<void>;
  updateInDataMatchIt: (id: number, updates: Partial<ResidentData>) => void;
  deleteFromDataMatchIt: (id: number) => void;
  clearAllData: () => void;
  
  // Staff assignments from Toewijzingen
  staffAssignments: { [residentName: string]: string };
  setStaffAssignments: (assignments: { [residentName: string]: string }) => void;
  syncWithToewijzingen: () => void;
  
  // Undo/Redo functionality
  undoDelete: () => void;
  redoDelete: () => void;
  canUndo: boolean;
  canRedo: boolean;
  deleteMultipleFromDataMatchIt: (ids: number[]) => void;
  
  // Derived lists (computed from dataMatchIt)
  bewonerslijst: ResidentData[];
  keukenlijst: any[];
  noordData: any[];
  zuidData: any[];
  
  // Bed occupancy data
  bedOccupancy: BedOccupancy[];
  occupancyStats: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
    noord: { occupied: number; total: number; rate: number };
    zuid: { occupied: number; total: number; rate: number };
    girls: { occupied: number; total: number; rate: number };
    minors: { occupied: number; total: number; rate: number };
  };
  
  // Legacy setters for compatibility
  setBewonerslijst: (data: ResidentData[]) => void;
  setKeukenlijst: (data: any[]) => void;
  setNoordData: (data: any[]) => void;
  setZuidData: (data: any[]) => void;
  updateAllData: (excelData: any) => void;
  getStorageInfo: () => any;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Data-Match-It is the single source of truth
  const [dataMatchIt, setDataMatchIt] = useState<ResidentData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Staff assignments from Toewijzingen page
  const [staffAssignments, setStaffAssignmentsState] = useState<{ [residentName: string]: string }>({});
  
  // Undo/Redo stacks for delete operations
  const [undoStack, setUndoStack] = useState<ResidentData[][]>([]);
  const [redoStack, setRedoStack] = useState<ResidentData[][]>([]);

  // Save data to localStorage whenever dataMatchIt changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) {
      console.log('⏭️ Skipping save - not initialized yet');
      return;
    }
    
    try {
      const dataString = JSON.stringify(dataMatchIt);
      localStorage.setItem('dataMatchIt', dataString);
      localStorage.setItem('dataMatchIt_lastUpdated', new Date().toISOString());
      console.log('💾 Data saved to localStorage:', dataMatchIt.length, 'residents,', dataString.length, 'characters');
    } catch (error) {
      console.error('❌ Failed to save data to localStorage:', error);
    }
  }, [dataMatchIt, isInitialized]);
  
  // Save staff assignments to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem('staffAssignments', JSON.stringify(staffAssignments));
      console.log('💾 Staff assignments saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save staff assignments:', error);
    }
  }, [staffAssignments, isInitialized]);

  // Initialize with saved data or default data
  useEffect(() => {
    console.log('🔄 DataContext initializing...');
    
    // Try to load from localStorage first
    const savedData = localStorage.getItem('dataMatchIt');
    const lastUpdated = localStorage.getItem('dataMatchIt_lastUpdated');
    const savedAssignments = localStorage.getItem('staffAssignments');
    
    console.log('📦 localStorage check:', {
      savedData: savedData ? `${savedData.length} characters` : 'null',
      lastUpdated,
      hasData: savedData !== null,
      hasAssignments: savedAssignments !== null
    });
    
    // Load staff assignments if they exist
    if (savedAssignments) {
      try {
        const parsedAssignments = JSON.parse(savedAssignments);
        setStaffAssignmentsState(parsedAssignments);
        console.log('📋 Loaded staff assignments from localStorage');
      } catch (error) {
        console.error('Error parsing staff assignments:', error);
      }
    }
    
    if (savedData !== null) { // Check for null specifically, allow empty arrays
      try {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData)) {
          console.log('Loaded data from localStorage:', parsedData.length, 'residents');
          if (lastUpdated) {
            console.log('Last updated:', new Date(lastUpdated).toLocaleString());
          }
          setDataMatchIt(parsedData);
          setIsInitialized(true);
          
          // Sync with Toewijzingen after loading saved data
          setTimeout(() => {
            syncWithToewijzingen();
          }, 500);
          
          return; // Exit early if we have saved data
        } else {
          console.warn('Saved data is not an array, using defaults');
        }
      } catch (error) {
        console.error('Error parsing saved data, using defaults:', error);
        // Clean up corrupted data
        localStorage.removeItem('dataMatchIt');
        localStorage.removeItem('dataMatchIt_lastUpdated');
      }
    }

    // If no saved data, combine all initial data into Data-Match-It
    const initialBewoners = getBewonerslijstData();
    const initialNoord = getNoordData();
    const initialZuid = getZuidData();
    
    // Merge all data, avoiding duplicates by badge number
    const combinedData: ResidentData[] = [];
    const seenBadges = new Set();
    
    [...initialBewoners, ...initialNoord, ...initialZuid].forEach((resident: any) => {
      if (!seenBadges.has(resident.badge)) {
        seenBadges.add(resident.badge);
        // Calculate days of stay if needed
        let finalDaysOfStay = resident.daysOfStay || 0;
        if (resident.dateIn && resident.dateIn !== '') {
          try {
            const entryDate = new Date(resident.dateIn);
            const today = new Date();
            if (!isNaN(entryDate.getTime())) {
              const calculatedDays = Math.floor((today.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000));
              // Days start at 1 (same day = 1 day of stay)
              if (calculatedDays >= 0) {
                finalDaysOfStay = calculatedDays + 1;
              } else {
                // If date is in the future, set to 1
                finalDaysOfStay = 1;
              }
            }
          } catch (error) {
            console.warn('Error calculating initial days of stay:', error);
          }
        }
        // Ensure minimum of 1 day
        if (!finalDaysOfStay || finalDaysOfStay < 1 || isNaN(finalDaysOfStay)) {
          finalDaysOfStay = 1;
        }

        combinedData.push({
          ...resident,
          // Ensure all required fields exist
          id: resident.id || Date.now() + Math.random(),
          name: resident.name || `${resident.firstName || ''} ${resident.lastName || ''}`.trim(),
          firstName: resident.firstName || '',
          lastName: resident.lastName || '',
          block: resident.block || resident.room?.charAt(0) || '',
          room: resident.room || '',
          nationality: resident.nationality || '',
          ovNumber: resident.ovNumber || '',
          registerNumber: resident.registerNumber || '',
          dateOfBirth: resident.dateOfBirth || '',
          age: resident.age || 0,
          gender: resident.gender || 'M',
          referencePerson: resident.referencePerson || '',
          dateIn: resident.dateIn || '',
          daysOfStay: finalDaysOfStay,
          status: resident.status || 'active'
        });
      }
    });
    
    console.log('🔄 Using default data, initialized with', combinedData.length, 'residents');
    setDataMatchIt(combinedData);
    setIsInitialized(true);
    
    // Sync with Toewijzingen after initialization
    setTimeout(() => {
      syncWithToewijzingen();
    }, 500);
    
    // Test database connection in the background
    setTimeout(() => {
      testDatabaseConnection();
    }, 1000);
  }, []);

  // Derived lists - computed from dataMatchIt
  const bewonerslijst = dataMatchIt; // All residents
  
  const keukenlijst = dataMatchIt
    .filter(resident => {
      // Exclude appointments from kitchen list - appointments should only show in Noord/Zuid
      const isAppointment = resident.status === 'appointment' || 
                           resident.status === 'scheduled' ||
                           resident.status === 'pending' ||
                           resident.status === 'afspraak' ||
                           resident.status === 'afspraken' ||
                           resident.referencePerson?.toLowerCase().includes('appointment') ||
                           resident.referencePerson?.toLowerCase().includes('afspraak') ||
                           resident.referencePerson?.toLowerCase().includes('afspraken') ||
                           resident.remarks?.toLowerCase().includes('appointment') ||
                           resident.remarks?.toLowerCase().includes('afspraak') ||
                           resident.remarks?.toLowerCase().includes('afspraken') ||
                           resident.roomRemarks?.toLowerCase().includes('appointment') ||
                           resident.roomRemarks?.toLowerCase().includes('afspraak') ||
                           resident.roomRemarks?.toLowerCase().includes('afspraken') ||
                           resident.firstName?.toLowerCase().includes('afspraak') ||
                           resident.lastName?.toLowerCase().includes('afspraak');
      
      if (isAppointment) {
        console.log(`🚫 Excluding appointment from kitchen list:`, resident.badge, resident.firstName, resident.lastName);
      }
      
      return !isAppointment;
    })
    .map(resident => ({
      ...resident,
      remarks: resident.remarks || (resident.badge === 25172 ? 'Medicatie' : ''),
      kitchenSchedule: 'Week A',
      mealPreference: 'Halal',
      // Meal time checkboxes - default to false if not set
      ontbijt: resident.ontbijt || false,
      middag: resident.middag || false,
      snack16: resident.snack16 || false,
      avond: resident.avond || false,
      snack21: resident.snack21 || false
    }));
  
  // Noord: rooms starting with 1 with automatic bed numbering
  const noordResidents = dataMatchIt.filter(resident => resident.room && resident.room.startsWith('1'));
  
  // Group Noord residents by room and assign bed numbers
  const noordRooms = noordResidents.reduce((acc, resident) => {
    if (!acc[resident.room]) {
      acc[resident.room] = [];
    }
    acc[resident.room].push(resident);
    return acc;
  }, {} as Record<string, typeof noordResidents>);
  
  // Assign bed numbers within each room (1, 2, 3, etc.)
  const noordData = Object.keys(noordRooms)
    .flatMap(room => {
      const roomResidents = noordRooms[room];
      // Sort by badge for consistency
      roomResidents.sort((a, b) => a.badge - b.badge);
      
      return roomResidents.map((resident, index) => ({
        ...resident,
        bedNumber: index + 1, // Sequential bed numbers: 1, 2, 3...
        language: resident.language || getLanguageByNationality(resident.nationality)
      }));
    });
  
  // Zuid: rooms starting with 2 with automatic bed numbering
  const zuidResidents = dataMatchIt.filter(resident => resident.room && resident.room.startsWith('2'));
  
  // Group Zuid residents by room and assign bed numbers
  const zuidRooms = zuidResidents.reduce((acc, resident) => {
    if (!acc[resident.room]) {
      acc[resident.room] = [];
    }
    acc[resident.room].push(resident);
    return acc;
  }, {} as Record<string, typeof zuidResidents>);
  
  // Assign bed numbers within each room (1, 2, 3, etc.)
  const zuidData = Object.keys(zuidRooms)
    .flatMap(room => {
      const roomResidents = zuidRooms[room];
      // Sort by badge for consistency
      roomResidents.sort((a, b) => a.badge - b.badge);
      
      return roomResidents.map((resident, index) => ({
        ...resident,
        bedNumber: index + 1, // Sequential bed numbers: 1, 2, 3...
        language: resident.language || getLanguageByNationality(resident.nationality)
      }));
    });

  // Calculate bed occupancy for all rooms
  const bedOccupancy: BedOccupancy[] = ALL_ROOMS.map(roomConfig => {
    const roomResidents = dataMatchIt.filter(resident => resident.room === roomConfig.roomNumber);
    
    return {
      roomNumber: roomConfig.roomNumber,
      building: roomConfig.building,
      maxBeds: roomConfig.maxBeds,
      occupiedBeds: roomResidents.length,
      occupancyRate: roomConfig.maxBeds > 0 ? (roomResidents.length / roomConfig.maxBeds) * 100 : 0,
      residents: roomResidents
        .sort((a, b) => a.badge - b.badge) // Sort by badge for consistent bed assignment
        .map((resident, index) => ({
          id: resident.id,
          name: resident.name,
          badge: resident.badge,
          bedNumber: index + 1
        }))
    };
  });

  // Calculate overall occupancy statistics
  const occupancyStats = {
    totalBeds: CAPACITY.total,
    occupiedBeds: bedOccupancy.reduce((sum, room) => sum + room.occupiedBeds, 0),
    availableBeds: CAPACITY.total - bedOccupancy.reduce((sum, room) => sum + room.occupiedBeds, 0),
    occupancyRate: CAPACITY.total > 0 ? (bedOccupancy.reduce((sum, room) => sum + room.occupiedBeds, 0) / CAPACITY.total) * 100 : 0,
    
    // Noord building stats
    noord: {
      occupied: bedOccupancy.filter(r => r.building === 'noord').reduce((sum, room) => sum + room.occupiedBeds, 0),
      total: CAPACITY.noord.total,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    },
    
    // Zuid building stats  
    zuid: {
      occupied: bedOccupancy.filter(r => r.building === 'zuid').reduce((sum, room) => sum + room.occupiedBeds, 0),
      total: CAPACITY.zuid.total,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    },
    
    // Girls rooms stats (first floor noord)
    girls: {
      occupied: bedOccupancy.filter(r => r.building === 'noord' && ['1.14', '1.15', '1.16', '1.17', '1.18', '1.19'].includes(r.roomNumber)).reduce((sum, room) => sum + room.occupiedBeds, 0),
      total: CAPACITY.noord.first,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    },
    
    // Minors rooms stats (first floor zuid)
    minors: {
      occupied: bedOccupancy.filter(r => r.building === 'zuid' && ['2.14', '2.15', '2.16', '2.17', '2.18'].includes(r.roomNumber)).reduce((sum, room) => sum + room.occupiedBeds, 0),
      total: CAPACITY.zuid.first,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    }
  };

  // CRUD operations for Data-Match-It
  const addToDataMatchIt = async (resident: ResidentData) => {
    console.log('🔄 addToDataMatchIt called with resident:', {
      firstName: resident.firstName,
      lastName: resident.lastName,
      badge: resident.badge
    });
    
    // First add to local state
    setDataMatchIt(prev => [...prev, resident]);
    console.log('✅ Resident added to local state');
    
    // Then try to sync to database (but don't block if it fails)
    console.log('🗄️ Starting database sync...');
    try {
      console.log('📞 Calling dbOperations.addResident...');
      const result = await dbOperations.addResident(resident);
      console.log('📥 Database result received:', result);
      
      if (result.success) {
        console.log('✅ Resident added to database:', result.resident?.id);
        // Update the resident with the database ID if needed
        if (result.resident?.id) {
          setDataMatchIt(prev => prev.map(r => 
            r.id === resident.id 
              ? { ...r, dbId: result.resident.id }
              : r
          ));
          console.log('🔄 Updated local resident with database ID');
        }
      } else {
        console.warn('⚠️ Database sync failed, data saved locally only:', result.error);
        // Data is still saved locally in state and localStorage
      }
    } catch (error) {
      console.error('❌ Database sync threw exception:', error);
      console.warn('⚠️ Database sync failed, data saved locally only:', error);
      // Data is still saved locally in state and localStorage
    }
    
    console.log('🏁 addToDataMatchIt function completed');
  };

  // Add multiple residents at once (for paste and import operations)
  const addMultipleToDataMatchIt = async (residents: ResidentData[]) => {
    // First add all to local state
    setDataMatchIt(prev => [...prev, ...residents]);
    
    // Then try to sync to database in batch (but don't block if it fails)
    try {
      console.log(`🔄 Attempting to sync ${residents.length} residents to database...`);
      const results = await dbOperations.addMultipleResidents(residents);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (successful > 0) {
        console.log(`✅ Database sync: ${successful} succeeded`);
      }
      if (failed > 0) {
        console.warn(`⚠️ Database sync: ${failed} failed (data saved locally)`);
      }
      
      // Update residents with database IDs where successful
      const dbIdMap = new Map();
      results.forEach((result, index) => {
        if (result.success && result.resident?.id) {
          dbIdMap.set(residents[index].id, result.resident.id);
        }
      });
      
      if (dbIdMap.size > 0) {
        setDataMatchIt(prev => prev.map(r => {
          const dbId = dbIdMap.get(r.id);
          return dbId ? { ...r, dbId } : r;
        }));
      }
    } catch (error) {
      console.warn('⚠️ Database sync failed, all data saved locally only:', error);
      // Data is still saved locally in state and localStorage
    }
  };

  const updateInDataMatchIt = (id: number, updates: Partial<ResidentData>) => {
    setDataMatchIt(prev => prev.map(resident => 
      resident.id === id ? { ...resident, ...updates } : resident
    ));
  };

  const deleteFromDataMatchIt = (id: number) => {
    setDataMatchIt(prev => {
      // Save current state to undo stack before deletion
      setUndoStack(currentStack => [...currentStack, prev]);
      // Clear redo stack when a new action is performed
      setRedoStack([]);
      
      const newData = prev.filter(resident => resident.id !== id);
      console.log('Resident deleted, new data length:', newData.length);
      return newData;
    });
  };
  
  // Delete multiple residents at once (batch delete)
  const deleteMultipleFromDataMatchIt = (ids: number[]) => {
    setDataMatchIt(prev => {
      // Save current state to undo stack before deletion
      setUndoStack(currentStack => [...currentStack, prev]);
      // Clear redo stack when a new action is performed
      setRedoStack([]);
      
      const idsSet = new Set(ids);
      const newData = prev.filter(resident => !idsSet.has(resident.id));
      console.log(`Batch delete: removed ${ids.length} residents, new data length: ${newData.length}`);
      return newData;
    });
  };
  
  // Undo last delete operation
  const undoDelete = () => {
    if (undoStack.length === 0) return;
    
    setUndoStack(prev => {
      const newStack = [...prev];
      const previousState = newStack.pop()!;
      
      // Save current state to redo stack
      setRedoStack(currentRedo => [...currentRedo, dataMatchIt]);
      
      // Restore previous state
      setDataMatchIt(previousState);
      console.log('Undo delete: restored', previousState.length, 'residents');
      
      return newStack;
    });
  };
  
  // Redo last undone delete operation
  const redoDelete = () => {
    if (redoStack.length === 0) return;
    
    setRedoStack(prev => {
      const newStack = [...prev];
      const nextState = newStack.pop()!;
      
      // Save current state to undo stack
      setUndoStack(currentUndo => [...currentUndo, dataMatchIt]);
      
      // Apply redo state
      setDataMatchIt(nextState);
      console.log('Redo delete: applied', nextState.length, 'residents');
      
      return newStack;
    });
  };

  // Legacy setters - now update dataMatchIt instead
  const setBewonerslijst = (data: ResidentData[]) => {
    setDataMatchIt(data);
  };

  const setKeukenlijst = (data: any[]) => {
    // Convert keukenlijst format back to ResidentData
    const residents = data.map(item => ({
      ...item,
      gender: item.gender || 'M',
      status: item.status || 'active'
    }));
    setDataMatchIt(residents);
  };

  const setNoordData = (data: any[]) => {
    // Merge Noord data into existing data
    setDataMatchIt(prev => {
      const nonNoordResidents = prev.filter(r => !r.room || !r.room.startsWith('1'));
      return [...nonNoordResidents, ...data];
    });
  };

  const setZuidData = (data: any[]) => {
    // Merge Zuid data into existing data
    setDataMatchIt(prev => {
      const nonZuidResidents = prev.filter(r => !r.room || !r.room.startsWith('2'));
      return [...nonZuidResidents, ...data];
    });
  };

  const clearAllData = () => {
    try {
      // Save current state to undo stack before clearing
      if (dataMatchIt.length > 0) {
        setUndoStack(currentStack => [...currentStack, dataMatchIt]);
        setRedoStack([]); // Clear redo stack when a new action is performed
      }
      
      localStorage.removeItem('dataMatchIt');
      localStorage.removeItem('dataMatchIt_lastUpdated');
      localStorage.removeItem('staffAssignments');
      setDataMatchIt([]);
      setStaffAssignmentsState({});
      console.log('All data cleared from localStorage and memory');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };
  
  const setStaffAssignments = (assignments: { [residentName: string]: string }) => {
    setStaffAssignmentsState(assignments);
    
    // Update dataMatchIt with new reference person assignments
    setDataMatchIt(prev => prev.map(resident => {
      const fullName = `${resident.firstName} ${resident.lastName}`.trim();
      const assignedStaff = assignments[fullName];
      if (assignedStaff && assignedStaff !== resident.referencePerson) {
        return { ...resident, referencePerson: assignedStaff };
      }
      return resident;
    }));
  };

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

  // Function to sync with Toewijzingen data from localStorage
  const syncWithToewijzingen = () => {
    try {
      const savedToewijzingenData = localStorage.getItem('toewijzingen_tableData');
      const savedStaffColumns = localStorage.getItem('toewijzingen_staffColumns');
      
      if (!savedToewijzingenData || !savedStaffColumns) {
        console.log('📋 No Toewijzingen data found for sync');
        return;
      }

      const tableData = JSON.parse(savedToewijzingenData);
      const staffColumns = JSON.parse(savedStaffColumns);
      
      console.log('🔄 Starting sync with Toewijzingen data...');
      
      // Extract assignments from Toewijzingen table
      const assignments: { [residentName: string]: string } = {};
      
      tableData.forEach((row: any[]) => {
        row.forEach((cell: any, colIndex: number) => {
          if (cell.text?.trim() && colIndex < staffColumns.length) {
            const staffName = staffColumns[colIndex].name;
            assignments[cell.text.trim()] = staffName;
          }
        });
      });
      
      console.log('📋 Extracted assignments from Toewijzingen:', assignments);
      
      // Apply assignments to dataMatchIt
      let changesCount = 0;
      setDataMatchIt(prev => prev.map(resident => {
        const fullName = `${resident.firstName} ${resident.lastName}`.trim();
        const reversedName = `${resident.lastName} ${resident.firstName}`.trim();
        
        // More flexible matching - check all assignment keys for partial matches
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
      }));
      
      console.log(`✅ Sync with Toewijzingen completed: ${changesCount} changes applied`);
    } catch (error) {
      console.error('❌ Error syncing with Toewijzingen:', error);
    }
  };

  const getStorageInfo = () => {
    try {
      const savedData = localStorage.getItem('dataMatchIt');
      const lastUpdated = localStorage.getItem('dataMatchIt_lastUpdated');
      return {
        hasData: savedData !== null,
        dataSize: savedData ? savedData.length : 0,
        recordCount: savedData ? JSON.parse(savedData).length : 0,
        lastUpdated: lastUpdated ? new Date(lastUpdated).toLocaleString() : null
      };
    } catch (error) {
      console.error('Error reading storage info:', error);
      return null;
    }
  };

  const updateAllData = (excelData: any) => {
    console.log('DataContext: updateAllData called with:', excelData);
    
    // All data goes into Data-Match-It
    const allNewData: ResidentData[] = [];
    
    if (excelData.Bewonerslijst) {
      console.log('DataContext: Processing Bewonerslijst with', excelData.Bewonerslijst.length, 'rows');
      const parsedBewoners = parseExcelToBewoners(excelData.Bewonerslijst);
      allNewData.push(...parsedBewoners);
    }
    
    if (excelData.Keukenlijst) {
      console.log('DataContext: Processing Keukenlijst with', excelData.Keukenlijst.length, 'rows');
      const parsedKeuken = parseExcelToKeuken(excelData.Keukenlijst);
      allNewData.push(...parsedKeuken);
    }
    
    if (excelData.Noord) {
      console.log('DataContext: Processing Noord with', excelData.Noord.length, 'rows');
      const parsedNoord = parseExcelToNoord(excelData.Noord);
      allNewData.push(...parsedNoord);
    }
    
    if (excelData.Zuid) {
      console.log('DataContext: Processing Zuid with', excelData.Zuid.length, 'rows');
      const parsedZuid = parseExcelToZuid(excelData.Zuid);
      allNewData.push(...parsedZuid);
    }
    
    // Remove duplicates by badge and update Data-Match-It
    const uniqueData = Array.from(
      new Map(allNewData.map(item => [item.badge, item])).values()
    );
    
    setDataMatchIt(uniqueData);
    console.log('DataContext: Data-Match-It updated with', uniqueData.length, 'unique records');
  };

  return (
    <DataContext.Provider value={{
      // Primary data source
      dataMatchIt,
      setDataMatchIt,
      addToDataMatchIt,
      addMultipleToDataMatchIt,
      updateInDataMatchIt,
      deleteFromDataMatchIt,
      clearAllData,
      
      // Staff assignments
      staffAssignments,
      setStaffAssignments,
      syncWithToewijzingen,
      
      // Undo/Redo functionality
      undoDelete,
      redoDelete,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      deleteMultipleFromDataMatchIt,
      
      // Derived lists
      bewonerslijst,
      keukenlijst,
      noordData,
      zuidData,
      
      // Bed occupancy data
      bedOccupancy,
      occupancyStats,
      
      // Legacy setters
      setBewonerslijst,
      setKeukenlijst,
      setNoordData,
      setZuidData,
      updateAllData,
      getStorageInfo
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Helper functions to parse Excel data
function parseExcelToBewoners(data: any[]): ResidentData[] {
  console.log('parseExcelToBewoners: Input data sample:', data[0]);
  return data.map((row, index) => {
    // Parse dates and calculate missing values
    const dateIn = row['Datum In'] || row.dateIn || '';
    const daysOfStayProvided = row['Dagen verblijf'] || row.daysOfStay || 0;
    
    let calculatedDaysOfStay = daysOfStayProvided;
    if (dateIn && dateIn !== '') {
      try {
        const entryDate = new Date(dateIn);
        const today = new Date();
        if (!isNaN(entryDate.getTime())) {
          const calculatedDays = Math.floor((today.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000));
          // Days start at 1 (same day = 1 day of stay)
          if (calculatedDays >= 0) {
            calculatedDaysOfStay = calculatedDays + 1;
          } else {
            // If date is in the future, set to 1
            calculatedDaysOfStay = 1;
          }
        }
      } catch (error) {
        console.warn('Error calculating days of stay from dateIn:', error);
      }
    }
    
    // Ensure days of stay is never less than 1 - provide default
    if (!calculatedDaysOfStay || calculatedDaysOfStay < 1 || isNaN(calculatedDaysOfStay)) {
      calculatedDaysOfStay = 30; // Default to 30 days if no valid date
    }

    // Get badge number for use in default values
    const badgeNumber = row.Badge || row.badge || 0;
    
    // Apply default values for empty OV Nummer and Rijkregisternr
    let ovNumber = row['OV Nummer'] || row.ovNumber || '';
    // Check for empty, null, undefined, or whitespace-only values
    if (!ovNumber || ovNumber === '' || ovNumber === null || ovNumber === undefined || 
        (typeof ovNumber === 'string' && ovNumber.trim() === '')) {
      ovNumber = '0000000'; // Seven zeros for empty OV Nummer
      console.log(`Applied default OV Nummer for badge ${badgeNumber}: ${ovNumber}`);
    }
    
    let registerNumber = row['Rijkregisternr'] || row.registerNumber || '';
    // Check for empty, null, undefined, or whitespace-only values
    if (!registerNumber || registerNumber === '' || registerNumber === null || registerNumber === undefined || 
        (typeof registerNumber === 'string' && registerNumber.trim() === '')) {
      registerNumber = `0FICT${badgeNumber}A`; // 0FICT + badge + A for empty Rijkregisternr
      console.log(`Applied default Rijkregisternr for badge ${badgeNumber}: ${registerNumber}`);
    }

    return {
      id: index + 1,
      badge: badgeNumber,
      name: `${row['Voornaam'] || row.firstName || ''} ${row['Naam'] || row.lastName || ''}`.trim(),
      firstName: row['Voornaam'] || row.firstName || '',
      lastName: row['Naam'] || row.lastName || '',
      block: row['Blok'] || row.block || '',
      room: row['Kamer'] || row.room || '',
      nationality: row['Nationaliteit'] || row.nationality || '',
      ovNumber: ovNumber,
      registerNumber: registerNumber,
      dateOfBirth: row['Geboortedatum'] || row.dateOfBirth || '',
      age: row['Leeftijd'] || row.age || 0,
      gender: row['Geslacht'] || row.gender || '',
      referencePerson: row['Referentiepersoon'] || row.referencePerson || '',
      dateIn: dateIn,
      daysOfStay: calculatedDaysOfStay,
      status: 'active'
    };
  });
}

function parseExcelToKeuken(data: any[]): any[] {
  return data.map((row, index) => {
    const badgeNumber = row.Badge || row.badge || 0;
    
    // Apply default values for empty OV Nummer and Rijkregisternr
    let ovNumber = row['OV Nummer'] || row.ovNumber || '';
    if (!ovNumber || ovNumber === '') {
      ovNumber = '0000000'; // Seven zeros for empty OV Nummer
    }
    
    let registerNumber = row['Rijkregisternr'] || row.registerNumber || '';
    if (!registerNumber || registerNumber === '') {
      registerNumber = `0FICT${badgeNumber}A`; // 0FICT + badge + A for empty Rijkregisternr
    }
    
    return {
      id: index + 1,
      badge: badgeNumber,
      name: `${row['Voornaam'] || row.firstName || ''} ${row['Naam'] || row.lastName || ''}`.trim(),
      firstName: row['Voornaam'] || row.firstName || '',
      lastName: row['Naam'] || row.lastName || '',
      room: row['Kamer'] || row.room || '',
      remarks: row['Opmerkingen'] || row.remarks || '',
      kitchenSchedule: 'Week A',
      mealPreference: 'Halal',
      ovNumber: ovNumber,
      registerNumber: registerNumber,
      // Include meal-related fields from the data if present
      ontbijt: row['Ontbijt'] || row.ontbijt || false,
      middag: row['Middag'] || row.middag || false,
      snack16: row['16 u'] || row.snack16 || false,
      avond: row['Avond'] || row.avond || false,
      snack21: row['21 u'] || row.snack21 || false
    };
  });
}

function parseExcelToNoord(data: any[]): any[] {
  return data.map((row, index) => {
    const badgeNumber = row.Badge || row.badge || 0;
    
    // Apply default values for empty OV Nummer and Rijkregisternr
    let ovNumber = row['OV Nummer'] || row.ovNumber || '';
    if (!ovNumber || ovNumber === '') {
      ovNumber = '0000000'; // Seven zeros for empty OV Nummer
    }
    
    let registerNumber = row['Rijkregisternr'] || row.registerNumber || '';
    if (!registerNumber || registerNumber === '') {
      registerNumber = `0FICT${badgeNumber}A`; // 0FICT + badge + A for empty Rijkregisternr
    }
    
    return {
      id: index + 100,
      bedNumber: row['Bed'] || row.bedNumber || 1,
      room: row['Kamer'] || row.room || '',
      lastName: row['Achternaam'] || row.lastName || '',
      firstName: row['Voornaam'] || row.firstName || '',
      nationality: row['Nationaliteit'] || row.nationality || '',
      language: row['Taal'] || row.language || '',
      gender: row['Geslacht'] || row.gender || '',
      remarks: row['Opmerkingen'] || row.remarks || '',
      badge: badgeNumber,
      ovNumber: ovNumber,
      registerNumber: registerNumber
    };
  });
}

function parseExcelToZuid(data: any[]): any[] {
  return data.map((row, index) => {
    const badgeNumber = row.Badge || row.badge || 0;
    
    // Apply default values for empty OV Nummer and Rijkregisternr
    let ovNumber = row['OV Nummer'] || row.ovNumber || '';
    if (!ovNumber || ovNumber === '') {
      ovNumber = '0000000'; // Seven zeros for empty OV Nummer
    }
    
    let registerNumber = row['Rijkregisternr'] || row.registerNumber || '';
    if (!registerNumber || registerNumber === '') {
      registerNumber = `0FICT${badgeNumber}A`; // 0FICT + badge + A for empty Rijkregisternr
    }
    
    return {
      id: index + 200,
      bedNumber: row['Bed'] || row.bedNumber || 1,
      room: row['Kamer'] || row.room || '',
      lastName: row['Achternaam'] || row.lastName || '',
      firstName: row['Voornaam'] || row.firstName || '',
      nationality: row['Nationaliteit'] || row.nationality || '',
      language: row['Taal'] || row.language || '',
      gender: row['Geslacht'] || row.gender || '',
      remarks: row['Opmerkingen'] || row.remarks || '',
      badge: badgeNumber,
      ovNumber: ovNumber,
      registerNumber: registerNumber
    };
  });
}

function getLanguageByNationality(nationality: string): string {
  const nationalityMap: { [key: string]: string } = {
    'Afghanistan': 'Dari/Pashto',
    'Syria': 'Arabic', 
    'Somalia': 'Somali',
    'Iraq': 'Arabic/Kurdish',
    'Iran': 'Persian',
    'Turkey': 'Turkish',
    'Morocco': 'Arabic/Berber',
    'Algeria': 'Arabic/Berber',
    'Tunisia': 'Arabic',
    'Libya': 'Arabic',
    'Egypt': 'Arabic',
    'Lebanon': 'Arabic',
    'Jordan': 'Arabic',
    'Palestine': 'Arabic',
    'Yemen': 'Arabic',
    'Sudan': 'Arabic',
    'Eritrea': 'Tigrinya',
    'Ethiopia': 'Amharic',
    'Guinea': 'French',
    'Mali': 'French',
    'Senegal': 'French',
    'Ivory Coast': 'French',
    'Burkina Faso': 'French',
    'Niger': 'French',
    'Chad': 'French/Arabic',
    'Cameroon': 'French/English',
    'Central African Republic': 'French',
    'Democratic Republic of Congo': 'French',
    'Republic of Congo': 'French',
    'Rwanda': 'Kinyarwanda/French',
    'Burundi': 'Kirundi/French',
    'Uganda': 'English',
    'Kenya': 'English/Swahili',
    'Tanzania': 'Swahili/English',
    'Nigeria': 'English',
    'Ghana': 'English',
    'Sierra Leone': 'English',
    'Liberia': 'English',
    'Gambia': 'English',
    'Pakistan': 'Urdu',
    'Bangladesh': 'Bengali',
    'India': 'Hindi/English',
    'Sri Lanka': 'Sinhala/Tamil',
    'Myanmar': 'Burmese',
    'China': 'Chinese',
    'Vietnam': 'Vietnamese',
    'Cambodia': 'Khmer',
    'Laos': 'Lao',
    'Thailand': 'Thai',
    'Philippines': 'Filipino/English',
    'Indonesia': 'Indonesian',
    'Malaysia': 'Malay',
    'Russia': 'Russian',
    'Ukraine': 'Ukrainian',
    'Belarus': 'Belarusian',
    'Georgia': 'Georgian',
    'Armenia': 'Armenian',
    'Azerbaijan': 'Azerbaijani',
    'Kazakhstan': 'Kazakh/Russian',
    'Kyrgyzstan': 'Kyrgyz/Russian',
    'Tajikistan': 'Tajik',
    'Turkmenistan': 'Turkmen',
    'Uzbekistan': 'Uzbek'
  };
  
  return nationalityMap[nationality] || 'Unknown';
}