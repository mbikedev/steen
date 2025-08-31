'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResidentData, getBewonerslijstData, getKeukenlijstData, getNoordData, getZuidData } from './excelUtils';
import { BedOccupancy, ALL_ROOMS, getRoomConfig, CAPACITY } from './bedConfig';
import { dbOperations, testDatabaseConnection } from './api-service';

// This is an enhanced version of DataContext that integrates with the PHP backend
// To use it, replace the import in your components from './DataContext' to './DataContextWithAPI'

interface DataContextType {
  // Data-Match-It is the primary source
  dataMatchIt: ResidentData[];
  setDataMatchIt: (data: ResidentData[]) => void;
  addToDataMatchIt: (resident: ResidentData) => Promise<void>;
  addMultipleToDataMatchIt: (residents: ResidentData[]) => Promise<void>;
  updateInDataMatchIt: (id: number, updates: Partial<ResidentData>) => void;
  deleteFromDataMatchIt: (id: number) => void;
  clearAllData: () => void;
  
  // Database sync status
  isConnectedToDb: boolean;
  syncWithDatabase: () => Promise<void>;
  
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataMatchIt, setDataMatchIt] = useState<ResidentData[]>([]);
  const [staffAssignmentsState, setStaffAssignmentsState] = useState<{ [residentName: string]: string }>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [undoStack, setUndoStack] = useState<ResidentData[][]>([]);
  const [redoStack, setRedoStack] = useState<ResidentData[][]>([]);
  const [isConnectedToDb, setIsConnectedToDb] = useState(false);

  // Check database connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await testDatabaseConnection();
        setIsConnectedToDb(connected);
        if (connected) {
          console.log('✅ Connected to PHP backend database');
          // Optionally load initial data from database
          await syncWithDatabase();
        } else {
          console.log('⚠️ Running in offline mode (local storage only)');
        }
      } catch (error) {
        console.log('⚠️ Database connection check failed, running offline');
        setIsConnectedToDb(false);
      }
    };
    
    checkConnection();
  }, []);

  // Sync with database
  const syncWithDatabase = async () => {
    if (!isConnectedToDb) return;
    
    try {
      console.log('🔄 Syncing with database...');
      const residents = await dbOperations.getAllResidents();
      if (residents && residents.length > 0) {
        setDataMatchIt(residents);
        console.log(`✅ Loaded ${residents.length} residents from database`);
      }
    } catch (error) {
      console.error('❌ Database sync failed:', error);
    }
  };

  // Initialize with local storage or default data
  useEffect(() => {
    if (isInitialized) return;
    
    // Try to load from localStorage first
    try {
      const savedData = localStorage.getItem('dataMatchIt');
      const savedAssignments = localStorage.getItem('staffAssignments');
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setDataMatchIt(parsed);
        console.log('📂 Loaded', parsed.length, 'residents from localStorage');
      }
      
      if (savedAssignments) {
        setStaffAssignmentsState(JSON.parse(savedAssignments));
        console.log('📂 Loaded staff assignments from localStorage');
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    
    setIsInitialized(true);
  }, [isInitialized]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem('dataMatchIt', JSON.stringify(dataMatchIt));
      localStorage.setItem('dataMatchIt_lastUpdated', new Date().toISOString());
      console.log('💾 Saved', dataMatchIt.length, 'residents to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [dataMatchIt, isInitialized]);

  // Save staff assignments to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem('staffAssignments', JSON.stringify(staffAssignmentsState));
      console.log('💾 Saved staff assignments to localStorage');
    } catch (error) {
      console.error('Error saving staff assignments:', error);
    }
  }, [staffAssignmentsState, isInitialized]);

  // CRUD operations for Data-Match-It
  const addToDataMatchIt = async (resident: ResidentData) => {
    console.log('🔄 addToDataMatchIt called with resident:', {
      firstName: resident.firstName,
      lastName: resident.lastName,
      badge: resident.badge
    });
    
    // Add to local state
    setDataMatchIt(prev => [...prev, resident]);
    console.log('✅ Resident added to local state');
    
    // Try to sync with database if connected
    if (isConnectedToDb) {
      try {
        const result = await dbOperations.addResident(resident);
        if (result.success && result.data) {
          // Update with database ID
          setDataMatchIt(prev => prev.map(r => 
            r.badge === resident.badge ? { ...r, id: result.data.id } : r
          ));
          console.log('✅ Resident synced to database');
        }
      } catch (error) {
        console.warn('⚠️ Database sync failed, data saved locally only');
      }
    }
  };

  // Add multiple residents at once
  const addMultipleToDataMatchIt = async (residents: ResidentData[]) => {
    // Add all to local state
    setDataMatchIt(prev => [...prev, ...residents]);
    console.log(`✅ ${residents.length} residents added to local state`);
    
    // Try to sync with database if connected
    if (isConnectedToDb) {
      try {
        const results = await dbOperations.addMultipleResidents(residents);
        const successful = results.filter(r => r.success).length;
        if (successful > 0) {
          console.log(`✅ ${successful} residents synced to database`);
        }
      } catch (error) {
        console.warn('⚠️ Database batch sync failed, data saved locally only');
      }
    }
  };

  const updateInDataMatchIt = async (id: number, updates: Partial<ResidentData>) => {
    setDataMatchIt(prev => prev.map(resident => 
      resident.id === id ? { ...resident, ...updates } : resident
    ));
    
    // Try to sync with database if connected
    if (isConnectedToDb) {
      try {
        await dbOperations.updateResident(id, updates);
        console.log('✅ Resident updated in database');
      } catch (error) {
        console.warn('⚠️ Database update failed, changes saved locally only');
      }
    }
  };

  const deleteFromDataMatchIt = async (id: number) => {
    setDataMatchIt(prev => {
      setUndoStack(currentStack => [...currentStack, prev]);
      setRedoStack([]);
      const newData = prev.filter(resident => resident.id !== id);
      console.log('Resident deleted, new data length:', newData.length);
      return newData;
    });
    
    // Try to sync with database if connected
    if (isConnectedToDb) {
      try {
        await dbOperations.deleteResident(id);
        console.log('✅ Resident deleted from database');
      } catch (error) {
        console.warn('⚠️ Database delete failed, removed locally only');
      }
    }
  };
  
  // Delete multiple residents at once
  const deleteMultipleFromDataMatchIt = (ids: number[]) => {
    setDataMatchIt(prev => {
      setUndoStack(currentStack => [...currentStack, prev]);
      setRedoStack([]);
      const idsSet = new Set(ids);
      const newData = prev.filter(resident => !idsSet.has(resident.id));
      console.log(`Batch delete: removed ${ids.length} residents`);
      return newData;
    });
    
    // Try to sync with database if connected
    if (isConnectedToDb) {
      ids.forEach(async (id) => {
        try {
          await dbOperations.deleteResident(id);
        } catch (error) {
          console.warn(`⚠️ Failed to delete resident ${id} from database`);
        }
      });
    }
  };
  
  // Undo/Redo operations
  const undoDelete = () => {
    if (undoStack.length === 0) return;
    
    setUndoStack(prev => {
      const newStack = [...prev];
      const previousState = newStack.pop()!;
      setRedoStack(currentRedo => [...currentRedo, dataMatchIt]);
      setDataMatchIt(previousState);
      console.log('Undo delete: restored', previousState.length, 'residents');
      return newStack;
    });
  };
  
  const redoDelete = () => {
    if (redoStack.length === 0) return;
    
    setRedoStack(prev => {
      const newStack = [...prev];
      const nextState = newStack.pop()!;
      setUndoStack(currentUndo => [...currentUndo, dataMatchIt]);
      setDataMatchIt(nextState);
      console.log('Redo delete: applied', nextState.length, 'residents');
      return newStack;
    });
  };

  const clearAllData = () => {
    try {
      if (dataMatchIt.length > 0) {
        setUndoStack(currentStack => [...currentStack, dataMatchIt]);
        setRedoStack([]);
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

  // Compute derived data
  const bewonerslijst = dataMatchIt;
  
  const keukenlijst = dataMatchIt
    .filter(resident => !resident.status?.includes('appointment'))
    .map(resident => ({
      ...resident,
      kitchenSchedule: 'Week A',
      mealPreference: 'Halal',
    }));
  
  const noordData = dataMatchIt.filter(resident => resident.room?.startsWith('1'));
  const zuidData = dataMatchIt.filter(resident => resident.room?.startsWith('2'));
  
  // Calculate bed occupancy
  const bedOccupancy: BedOccupancy[] = ALL_ROOMS.map(room => {
    const config = getRoomConfig(room);
    const residents = dataMatchIt.filter(r => r.room === room);
    
    return {
      room,
      building: room.startsWith('1') ? 'Noord' : 'Zuid',
      floor: config.floor,
      capacity: config.capacity,
      occupied: residents.length,
      available: config.capacity - residents.length,
      residents: residents.map(r => ({
        name: `${r.firstName} ${r.lastName}`,
        badge: r.badge,
        bedNumber: residents.indexOf(r) + 1
      }))
    };
  });

  // Calculate occupancy statistics
  const occupancyStats = {
    totalBeds: CAPACITY.TOTAL,
    occupiedBeds: bedOccupancy.reduce((sum, room) => sum + room.occupied, 0),
    get availableBeds() { return this.totalBeds - this.occupiedBeds; },
    get occupancyRate() { return (this.occupiedBeds / this.totalBeds) * 100; },
    
    noord: {
      total: CAPACITY.NOORD,
      occupied: bedOccupancy.filter(r => r.building === 'Noord').reduce((sum, r) => sum + r.occupied, 0),
      get rate() { return (this.occupied / this.total) * 100; }
    },
    
    zuid: {
      total: CAPACITY.ZUID,
      occupied: bedOccupancy.filter(r => r.building === 'Zuid').reduce((sum, r) => sum + r.occupied, 0),
      get rate() { return (this.occupied / this.total) * 100; }
    },
    
    girls: {
      total: CAPACITY.GIRLS_FLOOR,
      occupied: bedOccupancy.filter(r => r.floor === 'First' && r.building === 'Noord').reduce((sum, r) => sum + r.occupied, 0),
      get rate() { return (this.occupied / this.total) * 100; }
    },
    
    minors: {
      total: CAPACITY.MINORS_FLOOR,
      occupied: bedOccupancy.filter(r => r.floor === 'First' && r.building === 'Zuid').reduce((sum, r) => sum + r.occupied, 0),
      get rate() { return (this.occupied / this.total) * 100; }
    }
  };

  // Legacy setters for compatibility
  const setBewonerslijst = (data: ResidentData[]) => setDataMatchIt(data);
  const setKeukenlijst = (data: any[]) => {
    const residents = data.map(item => ({
      ...item,
      gender: item.gender || 'M',
      status: item.status || 'active'
    }));
    setDataMatchIt(residents);
  };
  const setNoordData = (data: any[]) => {
    setDataMatchIt(prev => {
      const nonNoordResidents = prev.filter(r => !r.room || !r.room.startsWith('1'));
      return [...nonNoordResidents, ...data];
    });
  };
  const setZuidData = (data: any[]) => {
    setDataMatchIt(prev => {
      const nonZuidResidents = prev.filter(r => !r.room || !r.room.startsWith('2'));
      return [...nonZuidResidents, ...data];
    });
  };

  const setStaffAssignments = (assignments: { [residentName: string]: string }) => {
    setStaffAssignmentsState(assignments);
  };

  const syncWithToewijzingen = () => {
    console.log('Syncing with Toewijzingen assignments...');
    // Implementation depends on how Toewijzingen page communicates
  };

  const value: DataContextType = {
    dataMatchIt,
    setDataMatchIt,
    addToDataMatchIt,
    addMultipleToDataMatchIt,
    updateInDataMatchIt,
    deleteFromDataMatchIt,
    clearAllData,
    isConnectedToDb,
    syncWithDatabase,
    staffAssignments: staffAssignmentsState,
    setStaffAssignments,
    syncWithToewijzingen,
    undoDelete,
    redoDelete,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    deleteMultipleFromDataMatchIt,
    bewonerslijst,
    keukenlijst,
    noordData,
    zuidData,
    bedOccupancy,
    occupancyStats,
    setBewonerslijst,
    setKeukenlijst,
    setNoordData,
    setZuidData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataContext;