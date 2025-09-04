'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResidentData } from './excelUtils';
import { BedOccupancy, ALL_ROOMS, getRoomConfig, CAPACITY } from './bedConfig';
import { dbOperations, testDatabaseConnection } from './api-service';
import { DashboardStats, fetchDashboardStats } from './api-service';

interface DataContextType {
  // Dashboard stats from the API
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;

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
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial data fetch from API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const stats = await fetchDashboardStats();
        setDashboardStats(stats);

        const connected = await testDatabaseConnection();
        setIsConnectedToDb(connected);

        if (connected) {
          await syncWithDatabase();
        } else {
          // Load from local storage if not connected
          const savedData = localStorage.getItem('dataMatchIt');
          if (savedData) {
            setDataMatchIt(JSON.parse(savedData));
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch initial data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Sync with database
  const syncWithDatabase = async () => {
    if (!isConnectedToDb) return;
    try {
      const residents = await dbOperations.getAllResidents();
      if (residents && residents.length > 0) {
        setDataMatchIt(residents);
      }
    } catch (error) {
      console.error('❌ Database sync failed:', error);
    }
  };

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('dataMatchIt', JSON.stringify(dataMatchIt));
    }
  }, [dataMatchIt, isInitialized]);
  
  useEffect(() => {
    if(!isInitialized) {
        setIsInitialized(true);
    }
  }, [isInitialized]);


  // CRUD operations
  const addToDataMatchIt = async (resident: ResidentData) => {
    setDataMatchIt(prev => [...prev, resident]);
    if (isConnectedToDb) {
      await dbOperations.addResident(resident).catch(() => {/* handle error */});
    }
  };

  const addMultipleToDataMatchIt = async (residents: ResidentData[]) => {
    setDataMatchIt(prev => [...prev, ...residents]);
    if (isConnectedToDb) {
      await dbOperations.addMultipleResidents(residents).catch(() => {/* handle error */});
    }
  };

  const updateInDataMatchIt = async (id: number, updates: Partial<ResidentData>) => {
    setDataMatchIt(prev => prev.map(res => res.id === id ? { ...res, ...updates } : res));
    if (isConnectedToDb) {
      await dbOperations.updateResident(id, updates).catch(() => {/* handle error */});
    }
  };

  const deleteFromDataMatchIt = async (id: number) => {
    setDataMatchIt(prev => prev.filter(res => res.id !== id));
    if (isConnectedToDb) {
      await dbOperations.deleteResident(id).catch(() => {/* handle error */});
    }
  };

  const deleteMultipleFromDataMatchIt = (ids: number[]) => {
    const idsSet = new Set(ids);
    setDataMatchIt(prev => prev.filter(res => !idsSet.has(res.id)));
    if (isConnectedToDb) {
      ids.forEach(id => dbOperations.deleteResident(id).catch(() => {/* handle error */}));
    }
  };
  
  const clearAllData = () => {
    setDataMatchIt([]);
    setStaffAssignmentsState({});
    localStorage.removeItem('dataMatchIt');
    localStorage.removeItem('staffAssignments');
  };

  // Undo/Redo stubs (implementation needed if required)
  const undoDelete = () => console.log("Undo not implemented");
  const redoDelete = () => console.log("Redo not implemented");

  // Derived data computations with safety checks
  const bewonerslijst = dataMatchIt;
  const keukenlijst = dataMatchIt.filter(r => r.status !== 'appointment');
  const noordData = dataMatchIt.filter(r => r.room && String(r.room).startsWith('1'));
  const zuidData = dataMatchIt.filter(r => r.room && String(r.room).startsWith('2'));

  const bedOccupancy: BedOccupancy[] = ALL_ROOMS.map(room => {
    const config = getRoomConfig(room) || { floor: 'N/A', capacity: 0 };
    const residents = dataMatchIt.filter(r => r.room === room);
    return {
      room,
      building: String(room).startsWith('1') ? 'Noord' : 'Zuid',
      floor: config.floor,
      capacity: config.capacity,
      occupied: residents.length,
      available: config.capacity - residents.length,
      residents: residents.map((r, i) => ({ name: `${r.firstName} ${r.lastName}`, badge: r.badge, bedNumber: i + 1 }))
    };
  });

  const occupancyStats = {
    totalBeds: CAPACITY.TOTAL,
    occupiedBeds: dataMatchIt.filter(r => r.room).length,
    get availableBeds() { return this.totalBeds - this.occupiedBeds; },
    get occupancyRate() { return this.totalBeds > 0 ? (this.occupiedBeds / this.totalBeds) * 100 : 0; },
    noord: {
      total: CAPACITY.NOORD,
      occupied: dataMatchIt.filter(r => r.room && String(r.room).startsWith('1')).length,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    },
    zuid: {
      total: CAPACITY.ZUID,
      occupied: dataMatchIt.filter(r => r.room && String(r.room).startsWith('2')).length,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    },
    girls: {
      total: CAPACITY.GIRLS_FLOOR,
      occupied: dataMatchIt.filter(r => r.room && isGirlsRoom(String(r.room))).length,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    },
    minors: {
      total: CAPACITY.MINORS_FLOOR,
      occupied: dataMatchIt.filter(r => r.room && isMinorsRoom(String(r.room))).length,
      get rate() { return this.total > 0 ? (this.occupied / this.total) * 100 : 0; }
    }
  };

  // Legacy setters and other functions
  const setBewonerslijst = (data: ResidentData[]) => setDataMatchIt(data);
  const setStaffAssignments = (assignments: { [residentName: string]: string }) => setStaffAssignmentsState(assignments);

  const value = {
    dashboardStats,
    loading,
    error,
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
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Helper functions to be used within the component
function isGirlsRoom(roomNumber: string): boolean {
  const room = getRoomConfig(roomNumber);
  return room?.specialization === 'girls';
}

function isMinorsRoom(roomNumber: string): boolean {
  const room = getRoomConfig(roomNumber);
  return room?.specialization === 'minors';
}
