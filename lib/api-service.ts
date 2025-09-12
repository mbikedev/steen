import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']
type Resident = Tables['residents']['Row']
type Room = Tables['rooms']['Row']
type Appointment = Tables['appointments']['Row']
type StaffAssignment = Tables['staff_assignments']['Row']
type Permission = Tables['permissions']['Row']
type Document = Tables['documents']['Row']
type MealSchedule = Tables['meal_schedules']['Row']
type RoomAssignment = Tables['room_assignments']['Row']
type AdministrativeDocument = Tables['administrative_documents']['Row']
type DocumentCategory = Tables['document_categories']['Row']
type ResidentStatusHistory = Tables['resident_status_history']['Row']

export class ApiService {
  private supabase = createClient() as any

  // Residents
  async getResidents() {
    const { data, error } = await this.supabase
      .from('residents')
      .select('*')
      .order('badge', { ascending: true })

    if (error) throw error
    return data
  }

  async getResident(id: number) {
    const { data, error } = await this.supabase
      .from('residents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createResident(resident: Omit<Resident, 'id' | 'created_at' | 'updated_at'>): Promise<Resident> {
    // Create a copy of resident data without language field if it might cause issues
    const residentData = { ...resident }
    
    try {
      const { data, error } = await this.supabase
        .from('residents')
        .insert(residentData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('createResident error details:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        residentData: {
          badge: residentData.badge,
          first_name: residentData.first_name?.substring(0, 20) + '...',
          last_name: residentData.last_name?.substring(0, 20) + '...',
          room: residentData.room,
          room_length: residentData.room?.length
        }
      })
      
      // If error mentions language column, try again without it
      if (error?.message?.includes('language')) {
        console.warn('Language column not found, retrying without language field')
        delete residentData.language
        
        const { data, error: retryError } = await this.supabase
          .from('residents')
          .insert(residentData)
          .select()
          .single()

        if (retryError) {
          console.error('Retry also failed:', retryError)
          throw retryError
        }
        return data
      }
      
      // If error mentions column length, try truncating fields
      if (error?.code === '22001' || error?.message?.includes('too long')) {
        console.warn('Data too long error, attempting to truncate fields')
        
        // Truncate string fields that might be too long
        const truncatedData = {
          ...residentData,
          room: residentData.room?.substring(0, 20) || '', // Original DB limit
          ov_number: residentData.ov_number?.substring(0, 50) || '',
          register_number: residentData.register_number?.substring(0, 50) || '',
          reference_person: residentData.reference_person?.substring(0, 200) || ''
        }
        
        console.log('Retrying with truncated data:', {
          original_room_length: residentData.room?.length,
          truncated_room_length: truncatedData.room?.length,
          original_room: residentData.room,
          truncated_room: truncatedData.room
        })
        
        const { data, error: retryError } = await this.supabase
          .from('residents')
          .insert(truncatedData)
          .select()
          .single()

        if (retryError) {
          console.error('Truncation retry also failed:', retryError)
          throw retryError
        }
        return data
      }
      
      throw error
    }
  }

  async updateResident(id: number, updates: Partial<Resident>) {
    // Create a copy of updates without language field if it might cause issues
    const updateData = { ...updates }
    
    try {
      const { data, error } = await this.supabase
        .from('residents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      // If error mentions language column, try again without it
      if (error?.message?.includes('language')) {
        console.warn('Language column not found, retrying without language field')
        delete updateData.language
        
        const { data, error: retryError } = await this.supabase
          .from('residents')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (retryError) throw retryError
        return data
      }
      throw error
    }
  }

  async deleteResident(id: number) {
    const { error } = await this.supabase
      .from('residents')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Rooms
  async getRooms() {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .order('building', { ascending: true })
      .order('floor', { ascending: true })
      .order('room_number', { ascending: true })

    if (error) throw error
    return data
  }

  async getRoom(id: number) {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateRoom(id: number, updates: Partial<Room>) {
    const { data, error } = await this.supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Room Assignments
  async getRoomAssignments(roomId?: number, residentId?: number) {
    let query = this.supabase
      .from('room_assignments')
      .select(`
        *,
        resident:residents(*),
        room:rooms(*)
      `)

    if (roomId) {
      query = query.eq('room_id', roomId)
    }

    if (residentId) {
      query = query.eq('resident_id', residentId)
    }

    query = query.eq('status', 'active')

    const { data, error } = await query

    if (error) throw error
    return data
  }

  async createRoomAssignment(assignment: Omit<RoomAssignment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('room_assignments')
      .insert(assignment)
      .select()
      .single()

    if (error) throw error

    // Update room occupancy
    await this.updateRoomOccupancy(assignment.room_id)

    return data
  }

  async releaseRoomAssignment(id: number) {
    const { data: assignment, error: getError } = await this.supabase
      .from('room_assignments')
      .select('room_id')
      .eq('id', id)
      .single()

    if (getError) throw getError

    const { error } = await this.supabase
      .from('room_assignments')
      .update({
        status: 'inactive',
        released_date: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    // Update room occupancy
    if (assignment) {
      await this.updateRoomOccupancy(assignment.room_id)
    }
  }

  private async updateRoomOccupancy(roomId: number) {
    const { data: assignments, error: countError } = await this.supabase
      .from('room_assignments')
      .select('id')
      .eq('room_id', roomId)
      .eq('status', 'active')

    if (countError) throw countError

    const occupied = assignments?.length || 0

    const { error: updateError } = await this.supabase
      .from('rooms')
      .update({ occupied })
      .eq('id', roomId)

    if (updateError) throw updateError
  }

  // Appointments
  async getAppointments(residentId?: number, date?: string) {
    let query = this.supabase
      .from('appointments')
      .select(`
        *,
        resident:residents(*)
      `)

    if (residentId) {
      query = query.eq('resident_id', residentId)
    }

    if (date) {
      query = query.eq('appointment_date', date)
    }

    const { data, error } = await query.order('appointment_date', { ascending: true })

    if (error) throw error
    return data
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAppointment(id: number, updates: Partial<Appointment>) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAppointment(id: number) {
    const { error } = await this.supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Staff Assignments
  async getStaffAssignments(date?: string) {
    let query = this.supabase
      .from('staff_assignments')
      .select('*')

    if (date) {
      query = query.eq('assignment_date', date)
    }

    const { data, error } = await query.order('assignment_date', { ascending: false })

    if (error) throw error
    return data
  }

  async createStaffAssignment(assignment: Omit<StaffAssignment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('staff_assignments')
      .insert(assignment)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateStaffAssignment(id: number, updates: Partial<StaffAssignment>) {
    const { data, error } = await this.supabase
      .from('staff_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteStaffAssignments(date: string) {
    const { error } = await this.supabase
      .from('staff_assignments')
      .delete()
      .eq('assignment_date', date)

    if (error) throw error
  }

  async bulkCreateStaffAssignments(assignments: any[]) {
    // Check authentication first
    const { data: { user } } = await this.supabase.auth.getUser()
    console.log('🔐 Authentication check:', { user: user ? user.email : 'No user' })

    const results = await Promise.all(
      assignments.map(async (assignment, index) => {
        try {
          const result = await this.createStaffAssignment(assignment)
          console.log(`✅ Saved assignment ${index + 1}:`, result)
          return result
        } catch (err) {
          console.error(`❌ Failed to save assignment ${index + 1}:`, err)
          return { error: err }
        }
      })
    )

    return results
  }

  // Permissions
  async getPermissions(residentId?: number) {
    let query = this.supabase
      .from('permissions')
      .select(`
        *,
        resident:residents(*)
      `)

    if (residentId) {
      query = query.eq('resident_id', residentId)
    }

    const { data, error } = await query.order('start_date', { ascending: false })

    if (error) throw error
    return data
  }

  async createPermission(permission: Omit<Permission, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('permissions')
      .insert(permission)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updatePermission(id: number, updates: any) {
    const { data, error } = await this.supabase
      .from('permissions')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Meal Schedules
  async getMealSchedules(date: string) {
    const { data, error } = await this.supabase
      .from('meal_schedules')
      .select(`
        *,
        resident:residents(*)
      `)
      .eq('meal_date', date)

    if (error) throw error
    return data
  }

  async createOrUpdateMealSchedule(schedule: Omit<MealSchedule, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('meal_schedules')
      .insert(schedule as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Documents
  async getDocuments(residentId?: number) {
    let query = this.supabase
      .from('documents')
      .select('*')

    if (residentId) {
      query = query.eq('resident_id', residentId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async uploadDocument(file: File, metadata: {
    resident_id?: number
    document_type: string
    uploaded_by?: string
  }): Promise<Document> {
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // Create document record
    const { data, error } = await this.supabase
      .from('documents')
      .insert({
        ...metadata,
        document_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteDocument(id: number) {
    // Get document to find file URL
    const { data: doc, error: getError } = await this.supabase
      .from('documents')
      .select('file_url')
      .eq('id', id)
      .single()

    if (getError) throw getError

    // Extract file name from URL and delete from storage
    if (doc?.file_url) {
      const fileName = doc.file_url.split('/').pop()
      if (fileName) {
        await this.supabase.storage
          .from('documents')
          .remove([fileName])
      }
    }

    // Delete document record
    const { error } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Dashboard Stats
  async getDashboardStats() {
    const [residents, rooms, recentActivities] = await Promise.all([
      this.supabase.from('residents').select('id, status').eq('status', 'active'),
      this.supabase.from('rooms').select('id, occupied, capacity'),
      this.supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    if (residents.error) throw residents.error
    if (rooms.error) throw rooms.error

    const totalResidents = residents.data?.length || 0
    const occupiedRooms = rooms.data?.filter((r: any) => r.occupied > 0).length || 0
    const availableRooms = rooms.data?.filter((r: any) => r.occupied === 0).length || 0
    const totalRooms = rooms.data?.length || 0
    const totalCapacity = rooms.data?.reduce((sum: number, room: any) => sum + room.capacity, 0) || 0
    const totalOccupied = rooms.data?.reduce((sum: number, room: any) => sum + room.occupied, 0) || 0
    const occupancyRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0

    return {
      totalResidents,
      occupiedRooms,
      availableRooms,
      totalRooms,
      occupancyRate: Math.round(occupancyRate),
      recentActivities: recentActivities.data || []
    }
  }

  // Administrative Documents
  async getAdministrativeDocuments(residentId?: number, documentType?: 'IN' | 'OUT') {
    let query = this.supabase
      .from('administrative_documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (residentId) {
      query = query.eq('resident_id', residentId)
    }

    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    const { data, error } = await query
    if (error) {
      console.error('Database error in getAdministrativeDocuments:', error)
      throw error
    }
    return data || []
  }

  async uploadAdministrativeDocument(file: File, metadata: {
    resident_id?: number
    document_type: 'IN' | 'OUT'
    description?: string
    uploaded_by?: string
  }): Promise<AdministrativeDocument> {
    // Upload file to Supabase Storage
    const fileName = `${metadata.document_type}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('administrative-documents')
      .upload(fileName, file)

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found')) {
        throw new Error('Storage bucket "administrative-documents" not found. Please create it in Supabase dashboard under Storage.')
      }
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('administrative-documents')
      .getPublicUrl(fileName)

    // Create document record
    const { data, error } = await this.supabase
      .from('administrative_documents')
      .insert({
        ...metadata,
        file_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAdministrativeDocument(id: number) {
    // Get document to find file path
    const { data: doc, error: getError } = await this.supabase
      .from('administrative_documents')
      .select('file_path')
      .eq('id', id)
      .single()

    if (getError) throw getError

    // Extract file name from URL and delete from storage
    if (doc?.file_path) {
      const fileName = doc.file_path.split('/').pop()
      if (fileName) {
        await this.supabase.storage
          .from('administrative-documents')
          .remove([fileName])
      }
    }

    // Delete document record
    const { error } = await this.supabase
      .from('administrative_documents')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Document Categories
  async getDocumentCategories(documentType?: 'IN' | 'OUT') {
    let query = this.supabase
      .from('document_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async createDocumentCategory(category: Omit<DocumentCategory, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('document_categories')
      .insert(category)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Resident Status History
  async getResidentStatusHistory(residentId?: number, statusType?: 'IN' | 'OUT') {
    let query = this.supabase
      .from('resident_status_history')
      .select(`
        *,
        resident:residents(*)
      `)
      .order('change_date', { ascending: false })

    if (residentId) {
      query = query.eq('resident_id', residentId)
    }

    if (statusType) {
      query = query.eq('status_type', statusType)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async createStatusHistoryEntry(entry: Omit<ResidentStatusHistory, 'id' | 'created_at'>) {
    const { data, error } = await this.supabase
      .from('resident_status_history')
      .insert(entry)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Activity Logging - temporarily disabled to prevent resource exhaustion
  async logActivity(activity: {
    action: string
    entity_type: string
    entity_id?: number
    details?: any
    user_id?: string
  }) {
    // Temporarily disabled to prevent ERR_INSUFFICIENT_RESOURCES
    console.log('📝 Activity (not logged to DB):', activity.action, activity.entity_type)
    return
    
    /* Original implementation - re-enable when database issues are resolved
    const { error } = await this.supabase
      .from('activity_logs')
      .insert(activity)

    if (error) console.error('Failed to log activity:', error)
    */
  }

  // Toewijzingen Grid methods
  async getToewijzingenGrid(assignmentDate: string) {
    const { data, error } = await this.supabase
      .from('toewijzingen_grid')
      .select('*')
      .eq('assignment_date', assignmentDate)
      .order('row_index')
      .order('col_index')

    if (error) throw error
    return data || []
  }

  async getToewijzingenStaff(assignmentDate: string) {
    const { data, error } = await this.supabase
      .from('toewijzingen_staff')
      .select('*')
      .eq('assignment_date', assignmentDate)
      .order('staff_index')

    if (error) throw error
    return data || []
  }

  async clearToewijzingenGrid(assignmentDate: string) {
    // Clear both grid and staff data for the date
    const { error: gridError } = await this.supabase
      .from('toewijzingen_grid')
      .delete()
      .eq('assignment_date', assignmentDate)

    if (gridError) throw gridError

    const { error: staffError } = await this.supabase
      .from('toewijzingen_staff')
      .delete()
      .eq('assignment_date', assignmentDate)

    if (staffError) throw staffError
  }

  async bulkCreateToewijzingenGrid(gridCells: Array<{
    assignment_date: string;
    row_index: number;
    col_index: number;
    resident_full_name: string;
    ib_name: string | null;
  }>) {
    if (gridCells.length === 0) {
      console.log('⚠️ No grid cells to save')
      return []
    }

    console.log('🔍 DEBUG: Sample grid cell data:', JSON.stringify(gridCells[0], null, 2))

    // Check table structure first
    try {
      const { data: tableInfo, error: tableError } = await this.supabase
        .from('toewijzingen_grid')
        .select('*')
        .limit(1)
      
      if (tableError) {
        console.error('❌ Table structure check failed:', tableError)
        return gridCells.map(() => ({ error: `Table check failed: ${tableError.message}` }))
      }
      console.log('✅ Table toewijzingen_grid exists and is accessible')
    } catch (e) {
      console.error('❌ Exception checking table:', e)
      return gridCells.map(() => ({ error: 'Table check exception' }))
    }

    // Ensure the user is authenticated (RLS requires it)
    try {
      const { data: authData } = await this.supabase.auth.getUser()
      if (!authData?.user) {
        console.warn('🔒 Not authenticated - cannot write to toewijzingen_grid')
        return gridCells.map(() => ({ error: 'Not authenticated' }))
      }
      console.log('✅ User authenticated:', authData.user.email || 'no email')
    } catch (e) {
      console.warn('🔒 Auth check failed - proceeding may fail due to RLS', e)
    }

    console.log(`🔄 Processing ${gridCells.length} grid cells in batches...`)
    const results: Array<{ data?: any; error?: string }> = []
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 50 // Smaller batch size for debugging
    for (let i = 0; i < gridCells.length; i += batchSize) {
      const batch = gridCells.slice(i, i + batchSize)
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.length} items`)
      console.log('🔍 DEBUG: First item in batch:', JSON.stringify(batch[0], null, 2))
      
      try {
        const { data, error } = await this.supabase
          .from('toewijzingen_grid')
          .upsert(batch, { onConflict: 'assignment_date,row_index,col_index' })
          .select() // Add select to see what was actually inserted

        if (error) {
          console.error('❌ Database error in grid batch:', error)
          batch.forEach(() => results.push({ error: error.message }))
        } else {
          console.log(`✅ Grid batch saved successfully: ${batch.length} records`)
          console.log('✅ Sample inserted data:', data?.[0])
          batch.forEach((item) => results.push({ data: item }))
        }
      } catch (err) {
        console.error('❌ Exception in grid batch save:', err)
        batch.forEach(() => results.push({ error: err instanceof Error ? err.message : 'Unknown error' }))
      }
    }

    console.log(`📊 Grid save complete: ${results.filter(r => r.data).length} successful, ${results.filter(r => r.error).length} failed`)
    return results
  }

  async bulkCreateToewijzingenStaff(staffData: Array<{
    assignment_date: string;
    staff_name: string;
    staff_index: number;
    assignment_count: number;
    annotations: string;
  }>) {
    if (staffData.length === 0) return []

    const results: Array<{ data?: any; error?: string }> = []
    
    try {
      const { data, error } = await this.supabase
        .from('toewijzingen_staff')
        .insert(staffData)
        .select()

      if (error) {
        staffData.forEach(() => results.push({ error: error.message }))
      } else {
        data.forEach((item: any) => results.push({ data: item }))
      }
    } catch (err) {
      staffData.forEach(() => results.push({ error: err instanceof Error ? err.message : 'Unknown error' }))
    }

    return results
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Toewijzingen Grid API - New database-backed implementation
export const toewijzingenGridApi = {
  async saveGrid(tableData: any[][], assignmentDate: string, staffNames: string[]) {
    try {
      console.log('🔍 toewijzingenGridApi.saveGrid called with:', {
        tableDataRows: tableData.length,
        assignmentDate,
        staffNames
      })

      // First, clear existing data for this date
      await apiService.clearToewijzingenGrid(assignmentDate)
      console.log('✅ Cleared existing grid data for date:', assignmentDate)

      const gridCells: any[] = []
      const staffData: any[] = []

      // Convert table data to grid cells - save only cells with resident names
      tableData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell && cell.text?.trim()) {
            gridCells.push({
              assignment_date: assignmentDate,
              row_index: rowIndex,
              col_index: colIndex,
              resident_full_name: cell.text.trim(),
              ib_name: staffNames[colIndex] || null
            })
          }
        })
      })

      // Create staff data records
      staffNames.forEach((staffName, staffIndex) => {
        const assignmentCount = gridCells.filter(cell => 
          cell.col_index === staffIndex && cell.resident_full_name?.trim()
        ).length

        staffData.push({
          assignment_date: assignmentDate,
          staff_name: staffName,
          staff_index: staffIndex,
          assignment_count: assignmentCount,
          annotations: '' // Can be enhanced later
        })
      })

      console.log(`📊 Total grid cells to save: ${gridCells.length}`)
      console.log(`👥 Total staff records to save: ${staffData.length}`)
      
      // Debug: Log sample grid cells
      if (gridCells.length > 0) {
        console.log('📋 Sample grid cells:', gridCells.slice(0, 3))
      }

      // Save grid cells and staff data
      console.log('💾 Starting grid cells save...')
      const gridResults = await apiService.bulkCreateToewijzingenGrid(gridCells)
      console.log('💾 Starting staff data save...')
      const staffResults = await apiService.bulkCreateToewijzingenStaff(staffData)

      const gridSuccessful = gridResults.filter(r => !r.error).length
      const gridFailed = gridResults.filter(r => r.error).length
      const staffSuccessful = staffResults.filter(r => !r.error).length
      const staffFailed = staffResults.filter(r => r.error).length

      console.log(`✅ Grid save completed: ${gridSuccessful} cells successful, ${gridFailed} failed`)
      console.log(`✅ Staff save completed: ${staffSuccessful} records successful, ${staffFailed} failed`)

      return {
        success: gridFailed === 0 && staffFailed === 0,
        data: {
          grid: { successful: gridSuccessful, failed: gridFailed, total: gridCells.length },
          staff: { successful: staffSuccessful, failed: staffFailed, total: staffData.length },
          errors: [
            ...gridResults.filter(r => r.error).map(r => r.error),
            ...staffResults.filter(r => r.error).map(r => r.error)
          ]
        }
      }

    } catch (error) {
      console.error('❌ toewijzingenGridApi.saveGrid error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  async loadGrid(assignmentDate: string) {
    try {
      console.log('🔍 toewijzingenGridApi.loadGrid called for date:', assignmentDate)

      const [gridData, staffData] = await Promise.all([
        apiService.getToewijzingenGrid(assignmentDate),
        apiService.getToewijzingenStaff(assignmentDate)
      ])

      console.log(`📥 Loaded ${gridData.length} grid cells and ${staffData.length} staff records`)

      return {
        success: true,
        data: {
          gridData,
          staffData
        }
      }

    } catch (error) {
      console.error('❌ toewijzingenGridApi.loadGrid error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Staff assignments API for Toewijzingen page compatibility (legacy - redirects to new API)
export const staffAssignmentsApi = {
  async saveBulk(tableData: any[][], assignmentDate: string, staffNames: string[]) {
    console.log('⚠️ staffAssignmentsApi.saveBulk is deprecated, redirecting to toewijzingenGridApi.saveGrid')
    return await toewijzingenGridApi.saveGrid(tableData, assignmentDate, staffNames)
  },

  async getAll(assignmentDate: string) {
    try {
      const assignments = await apiService.getStaffAssignments(assignmentDate)
      return {
        success: true,
        data: {
          assignments: assignments || []
        }
      }
    } catch (error) {
      console.error('Error in staffAssignmentsApi.getAll:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async deleteAll(assignmentDate: string) {
    try {
      await apiService.deleteStaffAssignments(assignmentDate)
      return { success: true }
    } catch (error) {
      console.error('Error in staffAssignmentsApi.deleteAll:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Resident Photos API
export const residentPhotosApi = {
  getAll: async () => {
    try {
      const supabase = createClient() as any
      
      // Get all photos from database
      const { data, error } = await supabase
        .from('resident_photos')
        .select('*')
      
      if (error) throw error
      
      // Convert to object format expected by frontend
      const photosObject: Record<string, string> = {}
      if (data) {
        data.forEach((photo: any) => {
          photosObject[photo.badge_number] = photo.photo_url
        })
      }
      
      return { success: true, data: photosObject }
    } catch (error) {
      console.error('Error fetching resident photos:', error)
      return { success: false, error: 'Failed to fetch photos' }
    }
  },
  
  upload: async (badgeNumber: number, file: File) => {
    try {
      const supabase = createClient() as any
      const badgeStr = badgeNumber.toString()
      
      // First check if photo already exists for this badge
      const { data: existingPhoto } = await supabase
        .from('resident_photos')
        .select('photo_url')
        .eq('badge_number', badgeStr)
        .maybeSingle()
      
      // If exists, delete old file from storage
      if (existingPhoto?.photo_url) {
        const oldPath = existingPhoto.photo_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('resident-photos')
            .remove([oldPath])
        }
      }
      
      // Upload new file to storage
      const fileName = `${badgeStr}_${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resident-photos')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resident-photos')
        .getPublicUrl(fileName)
      
      // Upsert photo record in database
      const { error: dbError } = await supabase
        .from('resident_photos')
        .upsert({
          badge_number: badgeStr,
          photo_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'badge_number'
        })
      
      if (dbError) throw dbError
      
      return { success: true, data: { photoUrl: publicUrl } }
    } catch (error) {
      console.error('Error uploading resident photo:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Photo upload failed' }
    }
  },
  
  delete: async (badgeNumber: number) => {
    try {
      const supabase = createClient() as any
      const badgeStr = badgeNumber.toString()
      
      // Get photo URL first
      const { data: photo, error: fetchError } = await supabase
        .from('resident_photos')
        .select('photo_url')
        .eq('badge_number', badgeStr)
        .maybeSingle()
      
      if (fetchError) throw fetchError
      
      if (photo?.photo_url) {
        // Extract file name from URL and delete from storage
        const fileName = photo.photo_url.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('resident-photos')
            .remove([fileName])
        }
        
        // Delete from database
        const { error: deleteError } = await supabase
          .from('resident_photos')
          .delete()
          .eq('badge_number', badgeStr)
        
        if (deleteError) throw deleteError
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error deleting resident photo:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Photo delete failed' }
    }
  }
}