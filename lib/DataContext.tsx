'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '@/lib/api-service'
import { getOfficialLanguageByNationality } from './language-utils'
import type { Database } from '@/lib/supabase/database.types'
import { ALL_ROOMS, CAPACITY } from '@/lib/bedConfig'
import { executeWithResourceControl, requestManager } from '@/lib/request-manager'

type Tables = Database['public']['Tables']
type Resident = Tables['residents']['Row']
type Room = Tables['rooms']['Row']
type Appointment = Tables['appointments']['Row']
type StaffAssignment = Tables['staff_assignments']['Row']
type Permission = Tables['permissions']['Row']
type Document = Tables['documents']['Row']
type MealSchedule = Tables['meal_schedules']['Row']

interface DataContextType {
  // Data
  residents: Resident[]
  rooms: Room[]
  appointments: Appointment[]
  staffAssignments: StaffAssignment[]
  permissions: Permission[]
  documents: Document[]
  mealSchedules: MealSchedule[]
  
  // Building-specific data
  noordData: any[]
  zuidData: any[]
  
  // Bed management data
  bedOccupancy: any[]
  occupancyStats: {
    totalBeds: number
    occupiedBeds: number
    availableBeds: number
    occupancyRate: number
  }
  
  // Backward compatibility
  bewonerslijst: Resident[]
  dataMatchIt: Resident[]
  outResidents: Resident[]
  
  // Loading states
  isLoading: boolean
  loading: boolean // alias for backward compatibility
  error: string | null
  
  // Dashboard stats
  dashboardStats: any
  
  // Legacy functions for backward compatibility
  addToDataMatchIt: (resident: any) => Promise<boolean>
  addMultipleToDataMatchIt: (residents: any[]) => Promise<void>
  updateInDataMatchIt: (id: number, updates: any) => void
  deleteFromDataMatchIt: (id: number) => void
  deleteMultipleFromDataMatchIt: (ids: number[]) => void
  clearAllData: () => void
  undoDelete: () => void
  redoDelete: () => void
  canUndo: boolean
  canRedo: boolean
  getStorageInfo: () => any
  setDataMatchIt: (residents: any[]) => void
  ageVerificationStatus: any
  setAgeVerificationStatus: (badge: number, status: 'Meerderjarig' | 'Minderjarig' | null) => void
  moveToOutAndDelete: (residentId: number) => void
  
  // Actions
  refreshResidents: () => Promise<void>
  refreshRooms: () => Promise<void>
  refreshAppointments: () => Promise<void>
  refreshStaffAssignments: () => Promise<void>
  refreshPermissions: () => Promise<void>
  refreshDocuments: () => Promise<void>
  refreshMealSchedules: (date: string) => Promise<void>
  refreshEssential: () => Promise<void>
  refreshAll: () => Promise<void>
  
  // CRUD operations
  createResident: (resident: Omit<Resident, 'id' | 'created_at' | 'updated_at'>) => Promise<Resident | null>
  updateResident: (id: number, updates: Partial<Resident>) => Promise<Resident>
  batchUpdateResidents: (updates: Array<{id: number, updates: Partial<Resident>}>) => Promise<void>
  deleteResident: (id: number) => Promise<void>
  
  createAppointment: (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => Promise<Appointment>
  updateAppointment: (id: number, updates: Partial<Appointment>) => Promise<Appointment>
  deleteAppointment: (id: number) => Promise<void>
  
  createStaffAssignment: (assignment: Omit<StaffAssignment, 'id' | 'created_at' | 'updated_at'>) => Promise<StaffAssignment>
  updateStaffAssignment: (id: number, updates: Partial<StaffAssignment>) => Promise<StaffAssignment>
  
  createPermission: (permission: Omit<Permission, 'id' | 'created_at' | 'updated_at'>) => Promise<Permission>
  updatePermission: (id: number, updates: Partial<Permission>) => Promise<Permission>
  
  uploadDocument: (file: File, metadata: { resident_id?: number; document_type: string; uploaded_by?: string }) => Promise<Document>
  deleteDocument: (id: number) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

export function DataProvider({ children }: DataProviderProps) {
  const [residents, setResidents] = useState<Resident[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [mealSchedules, setMealSchedules] = useState<MealSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [ageVerificationStatus, setAgeVerificationStatus] = useState<Record<number, 'Meerderjarig' | 'Minderjarig' | null>>({})
  const [outResidents, setOutResidents] = useState<Resident[]>([])
  
  // Legacy state for undo/redo functionality
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])

  // Computed legacy values
  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0


  // Transform Supabase data to legacy format for backward compatibility
  const transformResident = (supabaseResident: Resident) => ({
    ...supabaseResident,
    firstName: supabaseResident.first_name,
    lastName: supabaseResident.last_name,
    dateOfBirth: supabaseResident.date_of_birth,
    referencePerson: supabaseResident.reference_person,
    dateIn: supabaseResident.date_in,
    dateOut: supabaseResident.date_out,
    ovNumber: supabaseResident.ov_number,
    registerNumber: supabaseResident.register_number,
    roomRemarks: supabaseResident.room_remarks,
    daysOfStay: supabaseResident.days_of_stay,
    photoUrl: supabaseResident.photo_url,
    // Keep original fields for new code
    first_name: supabaseResident.first_name,
    last_name: supabaseResident.last_name
  })

  // Refresh functions
  const refreshResidents = async () => {
    try {
      const data = await apiService.getResidents()
      const transformedData = (data || []).map(transformResident)
      
      // Separate IN and OUT residents
      const inResidents = transformedData.filter((r: any) => r.status !== 'OUT')
      const outResidentsFromDB = transformedData.filter((r: any) => r.status === 'OUT')
      
      setResidents(inResidents)
      setOutResidents(outResidentsFromDB)
      setError(null) // Clear error on success
      
      console.log('📊 Loaded residents:', {
        total: transformedData.length,
        IN: inResidents.length,
        OUT: outResidentsFromDB.length
      })
    } catch (err: any) {
      // Handle different types of errors gracefully
      const errorMessage = err?.message || 'Unknown error'
      console.warn('⚠️ Failed to fetch residents:', errorMessage)
      
      // Only set error state for critical errors, not network issues
      if (err?.code !== 'NETWORK_ERROR' && !errorMessage.includes('fetch')) {
        setError('Database connection issue')
      }
      
      // Don't retry automatically to prevent infinite loops
      // Let the UI handle showing a retry button if needed
    }
  }

  const refreshRooms = async () => {
    try {
      const data = await apiService.getRooms()
      setRooms(data || [])
    } catch (err) {
      console.error('Error fetching rooms:', err)
      setError('Failed to load rooms')
    }
  }

  const refreshAppointments = async () => {
    try {
      const data = await apiService.getAppointments()
      setAppointments(data || [])
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Failed to load appointments')
    }
  }

  const refreshStaffAssignments = async () => {
    try {
      const data = await apiService.getStaffAssignments()
      setStaffAssignments(data || [])
    } catch (err) {
      console.error('Error fetching staff assignments:', err)
      setError('Failed to load staff assignments')
    }
  }

  const refreshPermissions = async () => {
    try {
      const data = await apiService.getPermissions()
      setPermissions(data || [])
    } catch (err) {
      console.error('Error fetching permissions:', err)
      setError('Failed to load permissions')
    }
  }

  const refreshDocuments = async () => {
    try {
      const data = await apiService.getDocuments()
      setDocuments(data || [])
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Failed to load documents')
    }
  }

  const refreshMealSchedules = async (date: string) => {
    try {
      const data = await apiService.getMealSchedules(date)
      setMealSchedules(data || [])
    } catch (err) {
      console.error('Error fetching meal schedules:', err)
      setError('Failed to load meal schedules')
    }
  }

  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshEssential = async () => {
    if (isRefreshing) {
      console.log('⚠️ Refresh already in progress, skipping...')
      return
    }
    
    setIsRefreshing(true)
    setIsLoading(true)
    setError(null)
    
    try {
      // Check resource status before proceeding
      const queueStatus = requestManager.getStatus()
      console.log('📊 Request queue status:', queueStatus)
      
      if (queueStatus.queueLength > 10) {
        console.warn('⚠️ Request queue is full, clearing to prevent resource exhaustion')
        requestManager.clearQueue()
      }
      
      // Only load essential data for bed management with controlled requests
      await executeWithResourceControl(refreshResidents, 3, 'refresh residents')
      await new Promise(resolve => setTimeout(resolve, 500)) // Much longer delay to prevent overload
      await executeWithResourceControl(refreshRooms, 2, 'refresh rooms')
      
      // Calculate dashboard stats with low priority
      try {
        const stats = await executeWithResourceControl(
          () => apiService.getDashboardStats(), 
          1, 
          'dashboard stats'
        )
        setDashboardStats(stats)
      } catch (err) {
        console.warn('⚠️ Dashboard stats failed, using fallback values')
        // Set fallback dashboard stats to prevent infinite loading
        setDashboardStats({
          totalResidents: residents.length,
          occupiedRooms: 0,
          availableRooms: 0,
          totalRooms: 70,
          occupancyRate: 0,
          recentActivities: []
        })
      }
      
      console.log('✅ Essential data loaded (residents and rooms)')
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error'
      console.warn('⚠️ Error loading essential data:', errorMessage)
      
      // Check for resource exhaustion
      if (errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.error('🚨 Resource exhaustion detected in refreshEssential')
        requestManager.clearQueue()
        setError('System overloaded - please wait and refresh')
      } else if (!errorMessage.includes('fetch') && !errorMessage.includes('network')) {
        setError('Database connection issue')
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const refreshAll = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load critical data first (residents and rooms for bed management)
      await refreshResidents()
      
      // Small delay to prevent overwhelming connections
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await refreshRooms()
      
      // Load remaining data sequentially with delays
      await new Promise(resolve => setTimeout(resolve, 100))
      await refreshAppointments()
      
      await new Promise(resolve => setTimeout(resolve, 100))  
      await refreshStaffAssignments()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      await refreshPermissions()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      await refreshDocuments()
      
      // Calculate dashboard stats (skip if it causes issues)
      try {
        const stats = await apiService.getDashboardStats()
        setDashboardStats(stats)
      } catch (err) {
        console.log('⚠️ Dashboard stats failed, continuing without them')
      }
      
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // CRUD operations
  const createResident = async (resident: Omit<Resident, 'id' | 'created_at' | 'updated_at'>): Promise<Resident | null> => {
    try {
      const newResident = await apiService.createResident(resident)
      await refreshResidents()
      
      // Sync administrative documents for the new resident
      try {
        const syncResult = await apiService.syncResidentDocuments(resident.badge, newResident.id)
        if (syncResult.synced > 0) {
          console.log(`✅ Synced ${syncResult.synced} documents for resident ${resident.badge}`)
        }
      } catch (syncError) {
        console.error('Failed to sync documents for resident:', resident.badge, syncError)
      }
      
      // Refresh dashboard stats after creating a resident
      try {
        const stats = await apiService.getDashboardStats()
        setDashboardStats(stats)
        console.log('✅ Dashboard stats refreshed after resident creation')
      } catch (err) {
        console.error('❌ Failed to refresh dashboard stats after creation:', err)
      }
      
      await apiService.logActivity({
        action: 'create',
        entity_type: 'resident',
        entity_id: newResident.id,
        details: { badge: resident.badge, name: `${resident.first_name} ${resident.last_name}` }
      })
      return newResident
    } catch (error: any) {
      // Handle duplicate key errors gracefully
      if (error?.code === '23505' || error?.message?.includes('duplicate') || error?.message?.includes('409') || error?.status === 409) {
        // Duplicate is already logged in api-service, just return null
        return null
      }
      // Log unexpected errors before re-throwing
      console.error('Unexpected error in createResident:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        residentBadge: resident.badge
      })
      // Re-throw other errors
      throw error
    }
  }

  const updateResident = async (id: number, updates: Partial<Resident>) => {
    try {
      const updatedResident = await apiService.updateResident(id, updates)
      await refreshResidents()
      
      // Log activity if logging is available
      try {
        await apiService.logActivity({
          action: 'update',
          entity_type: 'resident',
          entity_id: id,
          details: updates
        })
      } catch (logError) {
        console.warn('⚠️ Failed to log activity:', logError)
        // Continue execution even if logging fails
      }
      
      return updatedResident
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error'
      console.warn('⚠️ Failed to update resident:', errorMessage)
      
      // Re-throw error for the calling component to handle
      throw new Error(`Failed to update resident: ${errorMessage}`)
    }
  }
  
  // Batch update function to prevent ERR_INSUFFICIENT_RESOURCES
  const batchUpdateResidents = async (updates: Array<{id: number, updates: Partial<Resident>}>) => {
    try {
      // Process in chunks to avoid overwhelming the database
      const chunkSize = 5; // Process 5 updates at a time
      const chunks = [];
      
      for (let i = 0; i < updates.length; i += chunkSize) {
        chunks.push(updates.slice(i, i + chunkSize));
      }
      
      console.log(`📦 Processing ${updates.length} updates in ${chunks.length} chunks`);
      
      // Process each chunk sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const promises = chunk.map(({ id, updates }) => 
            apiService.updateResident(id, updates).catch(err => {
              console.error(`❌ Failed to update resident ${id}:`, err?.message || err);
              // Return null for failed updates instead of throwing
              return null;
            })
          );
          
          const results = await Promise.all(promises);
          const successful = results.filter(r => r !== null).length;
          const failed = results.length - successful;
          
          if (failed > 0) {
            console.warn(`⚠️ Chunk ${i + 1}/${chunks.length}: ${successful} successful, ${failed} failed`);
          } else {
            console.log(`✅ Processed chunk ${i + 1}/${chunks.length}: all ${successful} successful`);
          }
          
          // Small delay between chunks to prevent resource exhaustion
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (chunkError) {
          console.error(`❌ Chunk ${i + 1} failed completely:`, chunkError);
          // Continue with next chunk instead of failing completely
        }
      }
      
      // Refresh once after all updates
      await refreshResidents();
      
      console.log(`✅ Batch updated ${updates.length} residents successfully`);
    } catch (error) {
      console.error('❌ Batch update failed:', error);
      throw error;
    }
  }

  const deleteResident = async (id: number) => {
    await apiService.deleteResident(id)
    await refreshResidents()
    
    // Refresh dashboard stats after deleting a resident
    try {
      const stats = await apiService.getDashboardStats()
      setDashboardStats(stats)
      console.log('✅ Dashboard stats refreshed after resident deletion')
    } catch (err) {
      console.error('❌ Failed to refresh dashboard stats after deletion:', err)
      // Fallback: calculate stats based on current residents data
      setDashboardStats({
        totalResidents: residents.length - 1, // Subtract 1 for the deleted resident
        occupiedRooms: 0,
        availableRooms: 0,
        totalRooms: 70,
        occupancyRate: 0,
        recentActivities: []
      })
    }
    
    await apiService.logActivity({
      action: 'delete',
      entity_type: 'resident',
      entity_id: id
    })
  }

  const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> => {
    const newAppointment = await apiService.createAppointment(appointment)
    await refreshAppointments()
    await apiService.logActivity({
      action: 'create',
      entity_type: 'appointment',
      entity_id: newAppointment.id,
      details: { type: appointment.appointment_type, date: appointment.appointment_date }
    })
    return newAppointment
  }

  const updateAppointment = async (id: number, updates: Partial<Appointment>) => {
    const updatedAppointment = await apiService.updateAppointment(id, updates)
    await refreshAppointments()
    await apiService.logActivity({
      action: 'update',
      entity_type: 'appointment',
      entity_id: id,
      details: updates
    })
    return updatedAppointment
  }

  const deleteAppointment = async (id: number) => {
    await apiService.deleteAppointment(id)
    await refreshAppointments()
    await apiService.logActivity({
      action: 'delete',
      entity_type: 'appointment',
      entity_id: id
    })
  }

  const createStaffAssignment = async (assignment: Omit<StaffAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<StaffAssignment> => {
    const newAssignment: StaffAssignment = await apiService.createStaffAssignment(assignment)
    await refreshStaffAssignments()
    await apiService.logActivity({
      action: 'create',
      entity_type: 'staff_assignment',
      entity_id: newAssignment.id,
      details: { staff: assignment.staff_name, type: assignment.assignment_type }
    })
    return newAssignment
  }

  const updateStaffAssignment = async (id: number, updates: Partial<StaffAssignment>) => {
    const updatedAssignment = await apiService.updateStaffAssignment(id, updates)
    await refreshStaffAssignments()
    await apiService.logActivity({
      action: 'update',
      entity_type: 'staff_assignment',
      entity_id: id,
      details: updates
    })
    return updatedAssignment
  }

  const createPermission = async (permission: Omit<Permission, 'id' | 'created_at' | 'updated_at'>): Promise<Permission> => {
    const newPermission: Permission = await apiService.createPermission(permission)
    await refreshPermissions()
    await apiService.logActivity({
      action: 'create',
      entity_type: 'permission',
      entity_id: newPermission.id,
      details: { type: permission.permission_type, dates: `${permission.start_date} to ${permission.end_date}` }
    })
    return newPermission
  }

  const updatePermission = async (id: number, updates: Partial<Permission>) => {
    const updatedPermission = await apiService.updatePermission(id, updates)
    await refreshPermissions()
    await apiService.logActivity({
      action: 'update',
      entity_type: 'permission',
      entity_id: id,
      details: updates
    })
    return updatedPermission
  }

  const uploadDocument = async (file: File, metadata: { resident_id?: number; document_type: string; uploaded_by?: string }): Promise<Document> => {
    const newDocument = await apiService.uploadDocument(file, metadata)
    await refreshDocuments()
    await apiService.logActivity({
      action: 'upload',
      entity_type: 'document',
      entity_id: newDocument.id,
      details: { name: file.name, type: metadata.document_type }
    })
    return newDocument
  }

  const deleteDocument = async (id: number) => {
    await apiService.deleteDocument(id)
    await refreshDocuments()
    await apiService.logActivity({
      action: 'delete',
      entity_type: 'document',
      entity_id: id
    })
  }

  // Legacy functions for backward compatibility

  const addToDataMatchIt = async (resident: any): Promise<boolean> => {
    console.log('🔄 addToDataMatchIt called - converting to createResident')
    try {
      // Helper function to safely truncate strings to database limits
      const truncateString = (value: string | null | undefined, maxLength: number): string => {
        if (!value) return ''
        const str = String(value).trim()
        if (str.length <= maxLength) return str
        console.warn(`Truncating field from ${str.length} to ${maxLength} characters: "${str.substring(0, 30)}..."`)
        return str.substring(0, maxLength)
      }

      const supabaseResident: any = {
        badge: resident.badge,
        first_name: truncateString(resident.firstName || resident.first_name, 100),
        last_name: truncateString(resident.lastName || resident.last_name, 100),
        room: truncateString(resident.room, 50),
        nationality: truncateString(resident.nationality, 100),
        ov_number: truncateString(resident.ovNumber || resident.ov_number, 100),
        register_number: truncateString(resident.registerNumber || resident.register_number, 100),
        date_of_birth: resident.dateOfBirth || resident.date_of_birth || null,
        age: resident.age || null,
        gender: resident.gender || null,
        reference_person: truncateString(resident.referencePerson || resident.reference_person, 300),
        date_in: resident.dateIn || resident.date_in || null,
        date_out: resident.dateOut || resident.date_out || null,
        days_of_stay: resident.daysOfStay || resident.days_of_stay || null,
        status: resident.status || 'active',
        remarks: resident.remarks || null,
        room_remarks: resident.roomRemarks || resident.room_remarks || null,
        photo_url: resident.photoUrl || resident.photo_url || null
      }
      
      // Only include language if it's provided and the column exists
      if (resident.language) {
        supabaseResident.language = truncateString(resident.language, 50)
      }
      const result = await createResident(supabaseResident)
      if (result === null) {
        // Duplicate was skipped - no need for additional logging
        return false
      }
      return true
    } catch (error: any) {
      // Check if it's a known duplicate error
      const isDuplicate = error?.code === '23505' || 
                         error?.message?.includes('duplicate') || 
                         error?.message?.includes('409') ||
                         error?.status === 409;
      
      if (isDuplicate) {
        // Duplicate already logged, just return false
        return false
      }
      
      // For unexpected errors, log and continue (don't break the whole import)
      console.error('Unexpected error in addToDataMatchIt:', error)
      console.error('Additional error details:', {
        message: error?.message || 'No error message',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        residentBadge: resident.badge,
        residentData: {
          badge: resident.badge,
          firstName: resident.firstName || resident.first_name,
          lastName: resident.lastName || resident.last_name,
          room: resident.room,
          nationality: resident.nationality
        }
      })
      return false
    }
  }

  const addMultipleToDataMatchIt = async (residents: any[]) => {
    console.log(`🔄 addMultipleToDataMatchIt called - adding ${residents.length} residents`)
    let successCount = 0
    let skipCount = 0
    
    for (const resident of residents) {
      const success = await addToDataMatchIt(resident)
      if (success) {
        successCount++
      } else {
        skipCount++
      }
    }
    
    console.log(`✅ Batch import complete: ${successCount} added, ${skipCount} skipped (duplicates or errors)`)
    
    // After adding all residents, sync documents for newly added ones
    console.log(`📄 Starting document sync for imported residents...`)
    let documentsSync = 0
    try {
      // Only sync documents for residents that were successfully added
      const allResidents = await apiService.getResidents()
      for (const importedResident of residents) {
        // Find the resident in the database by badge
        const dbResident = allResidents.find(r => r.badge === importedResident.badge)
        if (dbResident) {
          try {
            const syncResult = await apiService.syncResidentDocuments(dbResident.badge, dbResident.id)
            if (syncResult.synced > 0) {
              documentsSync += syncResult.synced
              console.log(`📄 Synced ${syncResult.synced} documents for ${dbResident.badge}`)
            }
          } catch (syncError) {
            console.error(`Failed to sync documents for ${dbResident.badge}:`, syncError)
          }
        }
      }
      
      if (documentsSync > 0) {
        console.log(`✅ Total documents synced: ${documentsSync}`)
      }
    } catch (error) {
      console.error('Error during batch document sync:', error)
    }
    
    // Only refresh if we added at least one resident
    if (successCount > 0) {
      await refreshResidents()
    }
  }

  const updateInDataMatchIt = (id: number, updates: any) => {
    console.log('🔄 updateInDataMatchIt called - converting to updateResident')
    const supabaseUpdates: any = {}
    if (updates.firstName) supabaseUpdates.first_name = updates.firstName
    if (updates.lastName) supabaseUpdates.last_name = updates.lastName
    if (updates.room !== undefined) supabaseUpdates.room = updates.room
    if (updates.nationality !== undefined) {
      supabaseUpdates.nationality = updates.nationality
      // Auto-fill language when nationality is updated
      const autoLanguage = getOfficialLanguageByNationality(updates.nationality)
      if (autoLanguage) {
        supabaseUpdates.language = autoLanguage
        console.log(`✅ Auto-filled language "${autoLanguage}" for nationality "${updates.nationality}" (ID: ${id})`)
      }
    }
    if (updates.ovNumber !== undefined) supabaseUpdates.ov_number = updates.ovNumber
    if (updates.registerNumber !== undefined) supabaseUpdates.register_number = updates.registerNumber
    if (updates.dateOfBirth !== undefined) supabaseUpdates.date_of_birth = updates.dateOfBirth
    if (updates.age !== undefined) supabaseUpdates.age = updates.age
    if (updates.gender !== undefined) supabaseUpdates.gender = updates.gender
    if (updates.referencePerson !== undefined) supabaseUpdates.reference_person = updates.referencePerson
    if (updates.dateIn !== undefined) supabaseUpdates.date_in = updates.dateIn
    if (updates.dateOut !== undefined) supabaseUpdates.date_out = updates.dateOut
    if (updates.daysOfStay !== undefined) supabaseUpdates.days_of_stay = updates.daysOfStay
    if (updates.status !== undefined) supabaseUpdates.status = updates.status
    if (updates.remarks !== undefined) supabaseUpdates.remarks = updates.remarks
    if (updates.roomRemarks !== undefined) supabaseUpdates.room_remarks = updates.roomRemarks
    if (updates.photoUrl !== undefined) supabaseUpdates.photo_url = updates.photoUrl
    // Handle language field carefully since column might not exist yet
    if (updates.language !== undefined) {
      try {
        supabaseUpdates.language = updates.language
      } catch (error) {
        console.warn('Language column might not exist yet:', error)
      }
    }

    updateResident(id, supabaseUpdates).catch(console.error)
  }

  const deleteFromDataMatchIt = (id: number) => {
    console.log('🔄 deleteFromDataMatchIt called - converting to deleteResident')
    // Save current state for undo
    setUndoStack(prev => [...prev, residents])
    setRedoStack([])
    deleteResident(id).catch(console.error)
  }

  const deleteMultipleFromDataMatchIt = (ids: number[]) => {
    console.log('🔄 deleteMultipleFromDataMatchIt called - converting to multiple deleteResident calls')
    // Save current state for undo
    setUndoStack(prev => [...prev, residents])
    setRedoStack([])
    ids.forEach(id => deleteResident(id).catch(console.error))
  }

  const clearAllData = () => {
    console.log('🔄 clearAllData called - not implemented for Supabase version')
    // In Supabase version, we don't want to delete all data from the database
    // This could be implemented to clear local state only if needed
  }

  const undoDelete = async () => {
    console.log('🔄 undoDelete called - restoring previous state')
    
    if (undoStack.length > 0) {
      // Get the previous state
      const previousState = undoStack[undoStack.length - 1]
      
      // Save current state to redo stack
      setRedoStack(prev => [...prev, residents])
      
      // Remove the last item from undo stack
      setUndoStack(prev => prev.slice(0, -1))
      
      try {
        // Find residents that were deleted (in previous state but not in current state)
        const currentIds = new Set(residents.map(r => r.id))
        const deletedResidents = previousState.filter((r: any) => !currentIds.has(r.id))
        
        if (deletedResidents.length > 0) {
          console.log(`🔄 Restoring ${deletedResidents.length} deleted residents`)
          
          // Restore deleted residents by re-creating them
          for (const resident of deletedResidents) {
            // Convert back to Supabase format
            const supabaseResident = {
              badge: resident.badge,
              first_name: resident.firstName || resident.first_name,
              last_name: resident.lastName || resident.last_name,
              room: resident.room,
              nationality: resident.nationality,
              ov_number: resident.ovNumber || resident.ov_number,
              register_number: resident.registerNumber || resident.register_number,
              date_of_birth: resident.dateOfBirth || resident.date_of_birth,
              age: resident.age,
              gender: resident.gender,
              reference_person: resident.referencePerson || resident.reference_person,
              date_in: resident.dateIn || resident.date_in,
              days_of_stay: resident.daysOfStay || resident.days_of_stay,
              status: resident.status || 'active',
              language: resident.language
            }
            
            await createResident(supabaseResident)
          }
          
          console.log('✅ Undo delete completed successfully')
        } else {
          console.log('ℹ️ No deleted residents found to restore')
        }
      } catch (error) {
        console.error('❌ Error during undo delete:', error)
        // Restore undo stack if error occurred
        setUndoStack(prev => [...prev, previousState])
        setRedoStack(prev => prev.slice(0, -1))
      }
    }
  }

  const redoDelete = async () => {
    console.log('🔄 redoDelete called - re-applying delete operation')
    
    if (redoStack.length > 0) {
      // Get the state to redo to
      const redoState = redoStack[redoStack.length - 1]
      
      // Save current state to undo stack
      setUndoStack(prev => [...prev, residents])
      
      // Remove the last item from redo stack
      setRedoStack(prev => prev.slice(0, -1))
      
      try {
        // Find residents that should be deleted (in current state but not in redo state)
        const redoIds = new Set(redoState.map((r: any) => r.id))
        const residentsToDelete = residents.filter(r => !redoIds.has(r.id))
        
        if (residentsToDelete.length > 0) {
          console.log(`🔄 Re-deleting ${residentsToDelete.length} residents`)
          
          // Delete the residents
          for (const resident of residentsToDelete) {
            await deleteResident(resident.id)
          }
          
          console.log('✅ Redo delete completed successfully')
        } else {
          console.log('ℹ️ No residents found to re-delete')
        }
      } catch (error) {
        console.error('❌ Error during redo delete:', error)
        // Restore redo stack if error occurred
        setRedoStack(prev => [...prev, redoState])
        setUndoStack(prev => prev.slice(0, -1))
      }
    }
  }

  const getStorageInfo = () => {
    console.log('🔄 getStorageInfo called - returning Supabase info')
    return {
      hasData: residents.length > 0,
      dataSize: JSON.stringify(residents).length,
      recordCount: residents.length,
      lastUpdated: new Date().toLocaleString(),
      source: 'Supabase Database'
    }
  }

  const setDataMatchIt = (newResidents: any[]) => {
    console.log('🔄 setDataMatchIt called - updating multiple residents')
    // For the Supabase version, we'll need to update each resident individually
    newResidents.forEach((resident, index) => {
      if (resident.id) {
        // Update existing resident
        updateInDataMatchIt(resident.id, resident)
      } else {
        // This is a new resident - we might need to create it
        console.warn('setDataMatchIt: Resident without ID found at index', index)
      }
    })
  }

  // Age verification status setter function
  const handleSetAgeVerificationStatus = (badge: number, status: 'Meerderjarig' | 'Minderjarig' | null) => {
    setAgeVerificationStatus(prev => ({
      ...prev,
      [badge]: status
    }))
  }

  // Move resident to OUT status while preserving all data in database
  const moveToOutAndDelete = async (residentId: number) => {
    console.log('🔄 moveToOutAndDelete called with residentId:', residentId)
    console.log('📋 Current residents count:', residents.length)
    console.log('🔍 Looking for resident with ID:', residentId)
    
    const resident = residents.find(r => r.id === residentId)
    console.log('👤 Found resident:', resident ? `${resident.first_name} ${resident.last_name} (Badge: ${resident.badge})` : 'NOT FOUND')
    
    if (resident) {
      console.log('✅ Updating resident status to OUT in database')
      
      try {
        // Update resident status in database to 'OUT' - this preserves all data
        await apiService.updateResident(residentId, {
          status: 'OUT',
          date_out: new Date().toISOString().split('T')[0] // Set OUT date
        })
        console.log('📝 Resident status updated to OUT in database')
        
        // Log the status change to database
        await apiService.createStatusHistoryEntry({
          resident_id: residentId,
          previous_status: resident.status || 'Actief',
          new_status: 'OUT',
          status_type: 'OUT',
          change_date: new Date().toISOString(),
          changed_by: 'System', // You can update this with actual user info
          reason: 'Moved via Administrative Documents page',
          notes: `Resident ${resident.first_name} ${resident.last_name} (Badge: ${resident.badge}) moved to OUT status`
        })
        console.log('📝 Status change logged to database')
        
        // Update local state: Add to out residents with OUT status
        const outResident = { ...resident, status: 'OUT', date_out: new Date().toISOString().split('T')[0] }
        setOutResidents(prev => {
          // Check if already in out residents to avoid duplicates
          const exists = prev.find(r => r.id === residentId)
          if (exists) {
            return prev.map(r => r.id === residentId ? outResident : r)
          }
          const newOutResidents = [...prev, outResident]
          console.log('📤 Updated outResidents count:', newOutResidents.length)
          return newOutResidents
        })
        
        // Remove from main residents list for UI purposes (but data stays in database)
        setResidents(prev => {
          const filteredResidents = prev.filter(r => r.id !== residentId)
          console.log('📉 Updated residents count:', filteredResidents.length)
          return filteredResidents
        })
        
        console.log('✅ Resident successfully moved to OUT status')
        console.log('💾 All resident data, documents, and history preserved in database')
        
      } catch (error) {
        console.error('❌ Failed to update resident status:', error)
        throw error // Re-throw to show error to user
      }
    } else {
      console.error('❌ Resident not found with ID:', residentId)
      console.log('📋 Available resident IDs:', residents.map(r => ({ id: r.id, badge: r.badge, name: `${r.first_name} ${r.last_name}` })))
      throw new Error('Resident not found')
    }
  }

  // Initial load - only load essential data to avoid overwhelming connections
  useEffect(() => {
    let isMounted = true
    
    const loadInitialData = async () => {
      if (isMounted) {
        await refreshEssential()
      }
    }
    
    loadInitialData()
    
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <DataContext.Provider
      value={{
        residents,
        rooms,
        appointments,
        staffAssignments,
        permissions,
        documents,
        mealSchedules,
        
        // Building-specific data computed from residents based on room number patterns
        noordData: residents.filter(resident => {
          // Noord rooms start with "1." (1.06, 1.07, 1.08, 1.09, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19)
          return resident.room && resident.room.startsWith('1.')
        }).map(transformResident),
        zuidData: residents.filter(resident => {
          // Zuid rooms start with "2." (2.06, 2.07, 2.08, 2.09, 2.14, 2.15, 2.16, 2.17, 2.18, 2.19)
          return resident.room && resident.room.startsWith('2.')
        }).map(transformResident),
        
        // Bed management data - create rooms based on the actual room numbers residents are assigned to
        bedOccupancy: (() => {
          // Define the actual room structure with correct bed counts as specified
          const roomStructure = [
            // Noord - Begane Grond
            { roomNumber: '1.06', building: 'noord', maxBeds: 4, floor: 'ground' },
            { roomNumber: '1.07', building: 'noord', maxBeds: 4, floor: 'ground' },
            { roomNumber: '1.08', building: 'noord', maxBeds: 5, floor: 'ground' },
            { roomNumber: '1.09', building: 'noord', maxBeds: 5, floor: 'ground' },
            // Noord - Eerste Verdieping
            { roomNumber: '1.14', building: 'noord', maxBeds: 1, floor: 'first', specialization: 'medical' }, // medical room
            { roomNumber: '1.15', building: 'noord', maxBeds: 3, floor: 'first' },
            { roomNumber: '1.16', building: 'noord', maxBeds: 3, floor: 'first' },
            { roomNumber: '1.17', building: 'noord', maxBeds: 3, floor: 'first' },
            { roomNumber: '1.18', building: 'noord', maxBeds: 3, floor: 'first' },
            { roomNumber: '1.19', building: 'noord', maxBeds: 3, floor: 'first' },
            // Zuid - Begane Grond
            { roomNumber: '2.06', building: 'zuid', maxBeds: 4, floor: 'ground' },
            { roomNumber: '2.07', building: 'zuid', maxBeds: 4, floor: 'ground' },
            { roomNumber: '2.08', building: 'zuid', maxBeds: 5, floor: 'ground' },
            { roomNumber: '2.09', building: 'zuid', maxBeds: 5, floor: 'ground' },
            // Zuid - Eerste Verdieping
            { roomNumber: '2.14', building: 'zuid', maxBeds: 3, floor: 'first' },
            { roomNumber: '2.15', building: 'zuid', maxBeds: 3, floor: 'first' },
            { roomNumber: '2.16', building: 'zuid', maxBeds: 3, floor: 'first' },
            { roomNumber: '2.17', building: 'zuid', maxBeds: 3, floor: 'first' },
            { roomNumber: '2.18', building: 'zuid', maxBeds: 3, floor: 'first' },
            { roomNumber: '2.19', building: 'zuid', maxBeds: 3, floor: 'first' }
          ]


          return roomStructure.map(roomConfig => {
            const roomResidents = residents.filter(resident => {
              const match = resident.room === roomConfig.roomNumber;
              return match;
            });
            
            return {
              roomNumber: roomConfig.roomNumber,
              building: roomConfig.building,
              maxBeds: roomConfig.maxBeds,
              occupiedBeds: roomResidents.length,
              occupancyRate: roomConfig.maxBeds > 0 ? (roomResidents.length / roomConfig.maxBeds) * 100 : 0,
              residents: roomResidents.map(r => ({
                id: r.id,
                name: `${r.first_name} ${r.last_name}`,
                badge: r.badge,
                bedNumber: 1 // Default bed number, can be calculated based on order
              }))
            }
          })
        })(),
        
        occupancyStats: (() => {
          // Calculate based on the actual bed counts:
          // Noord: 4+4+5+5+1+3+3+3+3+3 = 34 beds
          // Zuid: 4+4+5+5+3+3+3+3+3+3 = 36 beds
          // Total: 70 beds
          const totalBeds = 70
          const occupiedBeds = residents.length
          return {
            totalBeds,
            occupiedBeds,
            availableBeds: totalBeds - occupiedBeds,
            occupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0
          }
        })(),
        
        // Backward compatibility - both point to the same residents data
        bewonerslijst: residents,
        dataMatchIt: residents,
        outResidents,
        
        isLoading,
        loading: isLoading, // alias for backward compatibility
        error,
        dashboardStats,
        refreshResidents,
        refreshRooms,
        refreshAppointments,
        refreshStaffAssignments,
        refreshPermissions,
        refreshDocuments,
        refreshMealSchedules,
        refreshEssential,
        refreshAll,
        createResident,
        updateResident,
        batchUpdateResidents,
        deleteResident,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        createStaffAssignment,
        updateStaffAssignment,
        createPermission,
        updatePermission,
        uploadDocument,
        deleteDocument,
        
        // Legacy functions
        addToDataMatchIt,
        addMultipleToDataMatchIt,
        updateInDataMatchIt,
        deleteFromDataMatchIt,
        deleteMultipleFromDataMatchIt,
        clearAllData,
        undoDelete,
        redoDelete,
        canUndo,
        canRedo,
        getStorageInfo,
        setDataMatchIt,
        ageVerificationStatus,
        setAgeVerificationStatus: handleSetAgeVerificationStatus,
        moveToOutAndDelete
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}