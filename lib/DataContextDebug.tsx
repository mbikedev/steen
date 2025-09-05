'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResidentData, getBewonerslijstData, getKeukenlijstData, getNoordData, getZuidData } from './excelUtils';
import { BedOccupancy, ALL_ROOMS, getRoomConfig, CAPACITY } from './bedConfig';
import { dbOperations, testDatabaseConnection, outResidentsApi } from './api-service';

interface DataContextType {
  // Data-Match-It is the primary source
  dataMatchIt: ResidentData[];
  setDataMatchIt: (data: ResidentData[]) => void;
  addToDataMatchIt: (resident: ResidentData) => Promise<void>;
  addMultipleToDataMatchIt: (residents: ResidentData[]) => Promise<void>;
  updateInDataMatchIt: (id: number, updates: Partial<ResidentData>) => void;
  deleteFromDataMatchIt: (id: number) => void;
  moveToOutAndDelete: (id: number) => Promise<void>;
  clearAllData: () => void;
  
  // OUT residents
  outResidents: ResidentData[];
  syncOutResidents: () => Promise<void>;
  
  // Debug info
  isConnectedToDb: boolean;
  lastApiCall: string;
  apiCallHistory: string[];
  syncWithDatabase: () => Promise<void>;
  getStorageInfo: () => any;
  
  // Staff assignments from Toewijzingen
  staffAssignments: { [residentName: string]: string };
  setStaffAssignments: (assignments: { [residentName: string]: string }) => void;
  syncWithToewijzingen: () => void;
  
  // Age verification status from Permissielijst
  ageVerificationStatus: { [badge: string]: 'Meerderjarig' | 'Minderjarig' | null };
  setAgeVerificationStatus: (badge: string, status: 'Meerderjarig' | 'Minderjarig' | null) => void;
  
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
  const [outResidents, setOutResidents] = useState<ResidentData[]>([]);
  const [staffAssignmentsState, setStaffAssignmentsState] = useState<{ [residentName: string]: string }>({});
  const [ageVerificationStatusState, setAgeVerificationStatusState] = useState<{ [badge: string]: 'Meerderjarig' | 'Minderjarig' | null }>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [undoStack, setUndoStack] = useState<ResidentData[][]>([]);
  const [redoStack, setRedoStack] = useState<ResidentData[][]>([]);
  const [isConnectedToDb, setIsConnectedToDb] = useState(false);
  const [lastApiCall, setLastApiCall] = useState<string>('');
  const [apiCallHistory, setApiCallHistory] = useState<string[]>([]);

  // Helper to log API calls
  const logApiCall = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLastApiCall(logMessage);
    setApiCallHistory(prev => [...prev.slice(-9), logMessage]); // Keep last 10
  };

  // Check database connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        logApiCall('Checking database connection...');
        const connected = await testDatabaseConnection();
        setIsConnectedToDb(connected);
        
        if (connected) {
          logApiCall('✅ Connected to PHP backend database');
          // Load data immediately after connection is confirmed
          try {
            logApiCall('🔄 Loading residents from database...');
            const residents = await dbOperations.getAllResidents();
            if (residents && residents.length > 0) {
              setDataMatchIt(residents);
              logApiCall(`✅ Loaded ${residents.length} residents from database`);
            } else {
              logApiCall('ℹ️ No residents found in database');
            }
            
            // Load OUT residents from database
            await syncOutResidents();
          } catch (error) {
            logApiCall(`❌ Database sync failed: ${error}`);
          }
        } else {
          logApiCall('❌ Database connection failed - running offline mode');
        }
      } catch (error) {
        logApiCall(`❌ Connection check error: ${error}`);
        setIsConnectedToDb(false);
      }
    };
    
    checkConnection();
  }, []);

  // Sync with database
  const syncWithDatabase = async () => {
    if (!isConnectedToDb) {
      logApiCall('⚠️ Sync skipped - not connected to database');
      return;
    }
    
    try {
      logApiCall('🔄 Syncing with database...');
      const residents = await dbOperations.getAllResidents();
      if (residents && residents.length > 0) {
        setDataMatchIt(residents);
        logApiCall(`✅ Loaded ${residents.length} residents from database`);
      } else {
        logApiCall('ℹ️ No residents found in database');
      }
      
      // Also sync OUT residents
      await syncOutResidents();
    } catch (error) {
      logApiCall(`❌ Database sync failed: ${error}`);
    }
  };

  // Sync OUT residents from database
  const syncOutResidents = async () => {
    try {
      if (!isConnectedToDb) {
        logApiCall('⚠️ Cannot sync OUT residents - not connected to database');
        return;
      }
      
      logApiCall('🔄 Syncing OUT residents from database...');
      const result = await outResidentsApi.getAll();
      
      if (result.success && result.data) {
        setOutResidents(result.data);
        logApiCall(`✅ Loaded ${result.data.length} OUT residents from database`);
      } else {
        logApiCall('ℹ️ No OUT residents found in database');
        setOutResidents([]);
      }
    } catch (error) {
      logApiCall(`❌ OUT residents sync failed: ${error}`);
      setOutResidents([]);
    }
  };

  // Enhanced CRUD operations with detailed logging
  const addToDataMatchIt = async (resident: ResidentData) => {
    logApiCall(`🔄 Adding resident: ${resident.firstName} ${resident.lastName} (Badge: ${resident.badge})`);
    
    // Add to local state first
    setDataMatchIt(prev => [...prev, resident]);
    logApiCall('✅ Resident added to local state');
    
    // Try to sync with database if connected
    if (isConnectedToDb) {
      try {
        logApiCall('📤 Attempting to save to database...');
        const result = await dbOperations.addResident(resident);
        
        if (result.success && result.data) {
          logApiCall(`✅ Resident saved to database with ID: ${result.data.id}`);
          // Update with database ID
          setDataMatchIt(prev => prev.map(r => 
            r.badge === resident.badge ? { ...r, id: result.data!.id } : r
          ));
        } else {
          logApiCall(`❌ Database save failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        logApiCall(`❌ Database save exception: ${error}`);
      }
    } else {
      logApiCall('⚠️ Database not connected - resident saved locally only');
    }
  };

  // Initialize component
  useEffect(() => {
    setIsInitialized(true);
    // Load age verification status from localStorage
    const savedAgeStatus = localStorage.getItem('ageVerificationStatus');
    if (savedAgeStatus) {
      try {
        setAgeVerificationStatusState(JSON.parse(savedAgeStatus));
      } catch (error) {
        console.error('Failed to load age verification status:', error);
      }
    }
  }, []);

  // Save age verification status to localStorage
  useEffect(() => {
    if (isInitialized && Object.keys(ageVerificationStatusState).length > 0) {
      localStorage.setItem('ageVerificationStatus', JSON.stringify(ageVerificationStatusState));
    }
  }, [ageVerificationStatusState, isInitialized]);

  // Add multiple residents at once
  const addMultipleToDataMatchIt = async (residents: ResidentData[]) => {
    logApiCall(`🔄 Adding ${residents.length} residents (batch)`);
    
    // Add all to local state
    setDataMatchIt(prev => [...prev, ...residents]);
    logApiCall(`✅ ${residents.length} residents added to local state`);
    
    if (isConnectedToDb) {
      try {
        logApiCall('📤 Attempting batch save to database...');
        const results = await dbOperations.addMultipleResidents(residents);
        const successful = results.filter(r => r.success).length;
        if (successful > 0) {
          logApiCall(`✅ ${successful} residents saved to database`);
        }
        if (successful < residents.length) {
          logApiCall(`⚠️ ${residents.length - successful} residents failed to save`);
        }
      } catch (error) {
        logApiCall(`❌ Batch database save failed: ${error}`);
      }
    }
  };

  const updateInDataMatchIt = async (id: number, updates: Partial<ResidentData>) => {
    setDataMatchIt(prev => prev.map(resident => 
      resident.id === id ? { ...resident, ...updates } : resident
    ));
    
    if (isConnectedToDb) {
      try {
        // Only send fields that the backend accepts; skip others (e.g., language)
        const allowedKeys: Array<keyof ResidentData> = [
          'badge','firstName','lastName','room','nationality','ovNumber','registerNumber',
          'dateOfBirth','age','gender','referencePerson','dateIn','daysOfStay','status','remarks','roomRemarks'
        ];
        const serverUpdates: Partial<ResidentData> = {};
        allowedKeys.forEach((key) => {
          if (key in updates) {
            // @ts-expect-error index access
            serverUpdates[key] = updates[key];
          }
        });
        if (Object.keys(serverUpdates).length === 0) {
          logApiCall(`⚠️ Skipping DB update for ${id} - no server-accepted fields`);
          return;
        }
        const result = await dbOperations.updateResident(id, serverUpdates);
        if (result.success) {
          logApiCall(`✅ Resident ${id} updated in database`);
        } else {
          logApiCall(`❌ Database update failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        logApiCall(`❌ Database update failed: ${error}`);
      }
    }
  };

  const deleteFromDataMatchIt = async (id: number) => {
    setDataMatchIt(prev => {
      setUndoStack(currentStack => [...currentStack, prev]);
      setRedoStack([]);
      const newData = prev.filter(resident => resident.id !== id);
      logApiCall(`🗑️ Resident ${id} deleted (local)`);
      return newData;
    });
    
    if (isConnectedToDb) {
      try {
        await dbOperations.deleteResident(id);
        logApiCall(`✅ Resident ${id} deleted from database`);
      } catch (error) {
        logApiCall(`❌ Database delete failed: ${error}`);
      }
    }
  };

  const moveToOutAndDelete = async (id: number) => {
    const resident = dataMatchIt.find(r => r.id === id);
    if (!resident) {
      logApiCall(`❌ Resident ${id} not found for OUT move`);
      console.error(`❌ Resident ${id} not found for OUT move`);
      return;
    }

    logApiCall(`🔄 Moving resident ${resident.firstName} ${resident.lastName} to OUT and deleting from all lists`);
    console.log(`🔄 Moving resident ${resident.firstName} ${resident.lastName} to OUT and deleting from all lists`);
    
    try {
      if (isConnectedToDb) {
        // Use the OUT residents API to move resident to OUT table
        console.log('🔄 Moving resident to OUT table in database with ID:', id);
        const result = await outResidentsApi.moveToOut(id);
        
        if (result.success) {
          logApiCall(`✅ Resident ${resident.firstName} ${resident.lastName} moved to OUT table in database`);
          console.log(`✅ Resident ${resident.firstName} ${resident.lastName} moved to OUT table in database`);
          
          // Update local state - remove from main list
          setDataMatchIt(prev => {
            setUndoStack(currentStack => [...currentStack, prev]);
            setRedoStack([]);
            return prev.filter(r => r.id !== id);
          });
          
          // Reload OUT residents list to include the newly moved resident
          await syncOutResidents();
        } else {
          logApiCall(`❌ Failed to move resident to OUT: ${result.error}`);
          console.error(`❌ Failed to move resident to OUT: ${result.error}`);
        }
      } else {
        // Fallback: If not connected to database, just update local state
        logApiCall('⚠️ Cannot move to OUT - database not connected');
        console.warn('⚠️ Cannot move to OUT - database not connected');
        
        // Still update local state for UI consistency
        const outResident = { ...resident, status: 'OUT' };
        setOutResidents(prev => {
          const filtered = prev.filter(r => r.id !== id);
          return [...filtered, outResident];
        });
        
        setDataMatchIt(prev => {
          setUndoStack(currentStack => [...currentStack, prev]);
          setRedoStack([]);
          return prev.filter(r => r.id !== id);
        });
      }
    } catch (error) {
      logApiCall(`❌ OUT move failed: ${error}`);
      console.error(`❌ OUT move failed: ${error}`);
    }
  };

  // Compute derived data - OUT residents are already excluded from dataMatchIt
  const bewonerslijst = dataMatchIt;
  const keukenlijst = dataMatchIt.map(resident => ({...resident, kitchenSchedule: 'Week A', mealPreference: 'Halal'}));
  const noordData = dataMatchIt.filter(resident => resident.room?.startsWith('1'));
  const zuidData = dataMatchIt.filter(resident => resident.room?.startsWith('2'));
  
  // Calculate bed occupancy - include all rooms from config
  const bedOccupancy: BedOccupancy[] = [];
  
  // Create a simple occupancy calculation - OUT residents already excluded
  const roomOccupancy = dataMatchIt.reduce((acc, resident) => {
    if (resident.room) {
      if (!acc[resident.room]) {
        acc[resident.room] = [];
      }
      acc[resident.room].push(resident);
    }
    return acc;
  }, {} as Record<string, ResidentData[]>);
  
  // Add all rooms from config to ensure we show complete room structure
  ALL_ROOMS.forEach((roomConfig) => {
    const residents = roomOccupancy[roomConfig.roomNumber] || [];
    const maxBeds = roomConfig.maxBeds;
    const occupiedBeds = residents.length;
    
    bedOccupancy.push({
      roomNumber: roomConfig.roomNumber,
      building: roomConfig.building,
      maxBeds,
      occupiedBeds,
      occupancyRate: maxBeds > 0 ? (occupiedBeds / maxBeds) * 100 : 0,
      residents: residents.map((r, index) => ({
        id: r.id || 0,
        name: `${r.firstName} ${r.lastName}`,
        badge: r.badge,
        bedNumber: index + 1
      }))
    });
  });

  // Calculate occupancy statistics - simplified
  const totalOccupied = bedOccupancy.reduce((sum, room) => sum + room.occupiedBeds, 0);
  const totalCapacity = Math.max(69, bedOccupancy.reduce((sum, room) => sum + room.maxBeds, 0)); // Default 69 beds
  
  const occupancyStats = {
    totalBeds: totalCapacity,
    occupiedBeds: totalOccupied,
    get availableBeds() { return this.totalBeds - this.occupiedBeds; },
    get occupancyRate() { return this.totalBeds > 0 ? (this.occupiedBeds / this.totalBeds) * 100 : 0; },
    
    noord: {
      total: 36, // Default Noord capacity
      occupied: bedOccupancy.filter(r => r.building === 'noord').reduce((sum, r) => sum + r.occupiedBeds, 0),
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    },
    
    zuid: {
      total: 33, // Default Zuid capacity
      occupied: bedOccupancy.filter(r => r.building === 'zuid').reduce((sum, r) => sum + r.occupiedBeds, 0),
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    },
    
    girls: {
      total: 18, // Default girls floor capacity
      occupied: dataMatchIt.filter(r => r.gender === 'F' || r.gender === 'V').length,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    },
    
    minors: {
      total: 15, // Default minors floor capacity
      occupied: dataMatchIt.filter(r => r.age && r.age < 18).length,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    }
  };

  // Other functions (simplified for brevity)
  const deleteMultipleFromDataMatchIt = (ids: number[]) => {
    setDataMatchIt(prev => {
      setUndoStack(currentStack => [...currentStack, prev]);
      setRedoStack([]);
      return prev.filter(resident => !ids.includes(resident.id));
    });
  };

  const undoDelete = () => {
    if (undoStack.length === 0) return;
    setUndoStack(prev => {
      const newStack = [...prev];
      const previousState = newStack.pop()!;
      setRedoStack(currentRedo => [...currentRedo, dataMatchIt]);
      setDataMatchIt(previousState);
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
      return newStack;
    });
  };

  const clearAllData = () => {
    logApiCall('🗑️ Clearing all data');
    if (dataMatchIt.length > 0) {
      setUndoStack(currentStack => [...currentStack, dataMatchIt]);
      setRedoStack([]);
    }
    
    setDataMatchIt([]);
    setStaffAssignmentsState({});
  };

  const setStaffAssignments = (assignments: { [residentName: string]: string }) => {
    setStaffAssignmentsState(assignments);
  };

  const syncWithToewijzingen = () => {
    logApiCall('🔄 Syncing with Toewijzingen...');
  };

  // Set age verification status for a resident
  const setAgeVerificationStatus = (badge: string, status: 'Meerderjarig' | 'Minderjarig' | null) => {
    logApiCall(`📋 Setting age verification for badge ${badge}: ${status}`);
    setAgeVerificationStatusState(prev => ({
      ...prev,
      [badge]: status
    }));
  };

  // Get storage and API info for debugging
  const getStorageInfo = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'Not configured';
    const hasApiKey = !!process.env.NEXT_PUBLIC_API_KEY;
    
    return {
      apiUrl,
      hasApiKey,
      total: dataMatchIt.length,
      localStorageSize: JSON.stringify(dataMatchIt).length,
      isConnected: isConnectedToDb,
      lastUpdate: new Date().toISOString()
    };
  };

  // Legacy setters for compatibility
  const setBewonerslijst = (data: ResidentData[]) => setDataMatchIt(data);
  const setKeukenlijst = (data: any[]) => {
    const residents = data.map(item => ({...item, gender: item.gender || 'M', status: item.status || 'active'}));
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


  const value: DataContextType = {
    dataMatchIt,
    setDataMatchIt,
    addToDataMatchIt,
    addMultipleToDataMatchIt,
    updateInDataMatchIt,
    deleteFromDataMatchIt,
    moveToOutAndDelete,
    clearAllData,
    outResidents,
    syncOutResidents,
    isConnectedToDb,
    lastApiCall,
    apiCallHistory,
    syncWithDatabase,
    getStorageInfo,
    staffAssignments: staffAssignmentsState,
    setStaffAssignments,
    syncWithToewijzingen,
    ageVerificationStatus: ageVerificationStatusState,
    setAgeVerificationStatus,
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