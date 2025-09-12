'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '@/lib/api-service'
import { getOfficialLanguageByNationality } from './language-utils'
import type { Database } from '@/lib/supabase/database.types'
import { ALL_ROOMS, CAPACITY } from '@/lib/bedConfig'

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
  syncWithToewijzingen: () => void
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
    } catch (err) {
      console.error('Error fetching residents:', err)
      setError('Failed to load residents')
      // Don't retry automatically to prevent infinite loops
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
      // Only load essential data for bed management
      await refreshResidents()
      await new Promise(resolve => setTimeout(resolve, 100))
      await refreshRooms()
      
      // Calculate dashboard stats
      try {
        const stats = await apiService.getDashboardStats()
        setDashboardStats(stats)
      } catch (err) {
        console.log('⚠️ Dashboard stats failed, using fallback values')
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
    } catch (err) {
      console.error('❌ Error loading essential data:', err)
      setError('Failed to load essential data')
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
      await apiService.logActivity({
        action: 'create',
        entity_type: 'resident',
        entity_id: newResident.id,
        details: { badge: resident.badge, name: `${resident.first_name} ${resident.last_name}` }
      })
      return newResident
    } catch (error: any) {
      // Handle duplicate key errors gracefully
      if (error?.code === '23505' || error?.message?.includes('duplicate') || error?.message?.includes('409')) {
        console.warn(`⚠️ Resident with badge ${resident.badge} already exists in database - skipping`)
        return null
      }
      // Re-throw other errors
      throw error
    }
  }

  const updateResident = async (id: number, updates: Partial<Resident>) => {
    const updatedResident = await apiService.updateResident(id, updates)
    await refreshResidents()
    await apiService.logActivity({
      action: 'update',
      entity_type: 'resident',
      entity_id: id,
      details: updates
    })
    return updatedResident
  }

  const deleteResident = async (id: number) => {
    await apiService.deleteResident(id)
    await refreshResidents()
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
  const syncWithToewijzingen = () => {
    console.log('📋 syncWithToewijzingen called - using Supabase staff assignments instead')
    // In Supabase version, this would sync with staff_assignments table
    // For now, just log that it was called
  }

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
        // Duplicate was skipped
        console.log(`ℹ️ Resident with badge ${resident.badge} was skipped (already exists)`)
        return false
      }
      return true
    } catch (error: any) {
      // For unexpected errors, log and continue (don't break the whole import)
      console.error('Error in addToDataMatchIt:', {
        error,
        message: error?.message,
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

  const undoDelete = () => {
    console.log('🔄 undoDelete called - limited implementation for Supabase version')
    // Limited implementation - would need more complex logic to restore deleted records
    if (undoStack.length > 0) {
      setUndoStack(prev => prev.slice(0, -1))
    }
  }

  const redoDelete = () => {
    console.log('🔄 redoDelete called - limited implementation for Supabase version')
    // Limited implementation
    if (redoStack.length > 0) {
      setRedoStack(prev => prev.slice(0, -1))
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
              if (match) {
                console.log(`✅ Found resident ${resident.first_name} ${resident.last_name} in room ${roomConfig.roomNumber}`);
              }
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
        syncWithToewijzingen,
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