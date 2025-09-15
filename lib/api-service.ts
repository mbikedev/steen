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
        // Create a new object without the language field
        const residentPayload = { ...residentData }
        delete (residentPayload as any).language
        
        console.log('Retrying without language field, payload keys:', Object.keys(residentPayload))
        
        const { data, error: retryError } = await this.supabase
          .from('residents')
          .insert(residentPayload)
          .select()
          .single()

        if (retryError) {
          console.error('Retry also failed:', retryError)
          throw retryError
        }
        console.log('✅ createResident retry without language succeeded')
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
    // Validate input
    if (!id || typeof id !== 'number' || id <= 0) {
      const error = new Error(`Invalid resident ID: ${id}`);
      console.error('❌ updateResident called with invalid ID:', id);
      throw error;
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      console.warn('⚠️ updateResident called with no updates, skipping');
      // Return existing data without making a database call
      const { data } = await this.supabase
        .from('residents')
        .select('*')
        .eq('id', id)
        .single();
      return data;
    }
    
    // Create a copy of updates and sanitize fields
    const updateData: Partial<Resident> = { ...updates }
    
    // Remove any undefined or null fields (typed keys to satisfy TS)
    Object.keys(updateData).forEach((key) => {
      const typedKey = key as keyof Partial<Resident>
      if (updateData[typedKey] === undefined || updateData[typedKey] === null) {
        delete updateData[typedKey]
      }
    })
    
    // Log what we're updating for debugging
    console.log(`🔄 Updating resident ${id} with fields:`, Object.keys(updateData));
    
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
      // Properly serialize the error for logging
      const errorDetails = {
        message: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN',
        details: error?.details || null,
        hint: error?.hint || null,
        residentId: id,
        updateData: {
          ...updateData,
          // Truncate long fields for logging
          room: updateData.room?.substring(0, 30),
          nationality: updateData.nationality?.substring(0, 30),
          ov_number: updateData.ov_number?.substring(0, 30),
          register_number: updateData.register_number?.substring(0, 30),
          reference_person: updateData.reference_person?.substring(0, 30)
        }
      }
      
      console.error('❌ updateResident error:', error?.message || 'Unknown error')
      console.error('❌ Error details:', JSON.stringify(errorDetails, null, 2))

      // Handle specific database errors with migrations not applied
      if (error?.message?.includes('language')) {
        console.warn('🔧 Language column not found, retrying without language field')
        delete updateData.language
      } else if (error?.message?.includes('value too long') || error?.code === '22001') {
        console.warn('🔧 Data too long error detected, applying automatic truncation')
        // Truncate fields that commonly exceed limits
        if (updateData.room && updateData.room.length > 20) {
          updateData.room = updateData.room.substring(0, 20)
        }
        if (updateData.ov_number && updateData.ov_number.length > 50) {
          updateData.ov_number = updateData.ov_number.substring(0, 50)
        }
        if (updateData.register_number && updateData.register_number.length > 50) {
          updateData.register_number = updateData.register_number.substring(0, 50)
        }
        if (updateData.reference_person && updateData.reference_person.length > 200) {
          updateData.reference_person = updateData.reference_person.substring(0, 200)
        }
        if (updateData.nationality && updateData.nationality.length > 100) {
          updateData.nationality = updateData.nationality.substring(0, 100)
        }
      } else {
        // For other errors, don't retry
        throw error
      }
      
      try {
        console.log('🔄 Retrying updateResident with adjusted data:', {
          residentId: id,
          adjustedFields: Object.keys(updateData)
        })
        
        const { data, error: retryError } = await this.supabase
          .from('residents')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (retryError) {
          console.error('❌ Retry also failed:', retryError)
          throw retryError
        }
        
        console.log('✅ updateResident retry succeeded')
        return data
      } catch (retryError) {
        console.error('❌ Final retry failed, giving up:', retryError)
        throw retryError
      }
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
      this.supabase.from('residents').select('id, status'),
      this.supabase.from('rooms').select('id, occupied, capacity'),
      this.supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    if (residents.error) throw residents.error
    if (rooms.error) throw rooms.error

    // Count all residents regardless of status (since we want total count, not just active)
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

  private sanitizeFileName(fileName: string): string {
    // Replace special characters and normalize accented characters
    return fileName
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
  }

  async uploadAdministrativeDocument(file: File, metadata: {
    resident_id?: number
    document_type: 'IN' | 'OUT'
    description?: string
    uploaded_by?: string
  }): Promise<AdministrativeDocument> {
    // Upload file to Supabase Storage with sanitized filename
    const sanitizedName = this.sanitizeFileName(file.name)
    const fileName = `${metadata.document_type}/${Date.now()}_${sanitizedName}`
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
    try {
      const { data, error } = await this.supabase
        .from('toewijzingen_grid')
        .select('*')
        .eq('assignment_date', assignmentDate)
        .order('row_index')
        .order('col_index')

      if (error) {
        console.error('❌ getToewijzingenGrid error:', error)
        if (error.message?.includes('relation "public.toewijzingen_grid" does not exist')) {
          console.error('🚨 URGENT: toewijzingen_grid table does not exist! Please apply migration 002/003.')
        }
        throw error
      }
      
      console.log(`📥 getToewijzingenGrid: Found ${data?.length || 0} records for date ${assignmentDate}`)
      return data || []
    } catch (error) {
      console.error('❌ Exception in getToewijzingenGrid:', error)
      throw error
    }
  }

  async getToewijzingenStaff(assignmentDate: string) {
    try {
      const { data, error } = await this.supabase
        .from('toewijzingen_staff')
        .select('*')
        .eq('assignment_date', assignmentDate)
        .order('staff_index')

      if (error) {
        console.error('❌ getToewijzingenStaff error:', error)
        if (error.message?.includes('relation "public.toewijzingen_staff" does not exist')) {
          console.error('🚨 URGENT: toewijzingen_staff table does not exist! Please apply migration 009.')
        }
        throw error
      }
      
      console.log(`📥 getToewijzingenStaff: Found ${data?.length || 0} records for date ${assignmentDate}`)
      return data || []
    } catch (error) {
      console.error('❌ Exception in getToewijzingenStaff:', error)
      throw error
    }
  }

  async clearToewijzingenGrid(assignmentDate: string) {
    try {
      console.log(`🧹 Clearing toewijzingen data for date: ${assignmentDate}`)
      
      // Clear both grid and staff data for the date
      const { error: gridError } = await this.supabase
        .from('toewijzingen_grid')
        .delete()
        .eq('assignment_date', assignmentDate)

      if (gridError) {
        console.error('❌ Error clearing toewijzingen_grid:', gridError)
        throw gridError
      }

      const { error: staffError } = await this.supabase
        .from('toewijzingen_staff')
        .delete()
        .eq('assignment_date', assignmentDate)

      if (staffError) {
        console.error('❌ Error clearing toewijzingen_staff:', staffError)
        throw staffError
      }
      
      console.log('✅ Successfully cleared existing data')
    } catch (error) {
      console.error('❌ Exception in clearToewijzingenGrid:', error)
      throw error
    }
  }
  
  // Test function to verify database tables exist and are accessible
  async testToewijzingenTables() {
    try {
      console.log('🧪 Testing toewijzingen table access...')
      
      // Test toewijzingen_grid table
      const { data: gridData, error: gridError } = await this.supabase
        .from('toewijzingen_grid')
        .select('*')
        .limit(1)
      
      if (gridError) {
        console.error('❌ toewijzingen_grid table test failed:', gridError)
        return { success: false, error: `Grid table error: ${gridError.message}` }
      }
      
      // Test toewijzingen_staff table
      const { data: staffData, error: staffError } = await this.supabase
        .from('toewijzingen_staff')
        .select('*')
        .limit(1)
      
      if (staffError) {
        console.error('❌ toewijzingen_staff table test failed:', staffError)
        return { success: false, error: `Staff table error: ${staffError.message}` }
      }
      
      console.log('✅ Both tables accessible')
      return { 
        success: true, 
        gridRecords: gridData?.length || 0,
        staffRecords: staffData?.length || 0
      }
    } catch (error) {
      console.error('❌ Exception testing tables:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
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
      const { data: authData, error: authError } = await this.supabase.auth.getUser()
      if (authError) {
        console.error('🔒 Auth error:', authError)
        return gridCells.map(() => ({ error: `Auth error: ${authError.message}` }))
      }
      if (!authData?.user) {
        console.warn('🔒 Not authenticated - cannot write to toewijzingen_grid')
        console.log('🔒 Attempting to check session...')
        const { data: sessionData } = await this.supabase.auth.getSession()
        if (!sessionData?.session) {
          console.error('🔒 No session found - user needs to log in')
          return gridCells.map(() => ({ error: 'Not authenticated - please log in' }))
        }
      }
      console.log('✅ User authenticated:', authData?.user?.email || 'no email')
    } catch (e) {
      console.error('🔒 Auth check exception:', e)
      return gridCells.map(() => ({ error: 'Authentication check failed' }))
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
        console.log(`🔄 Attempting to save batch of ${batch.length} records to toewijzingen_grid`)
        console.log('📋 Sample records from batch:', batch.slice(0, 2))
        
        // Use upsert to handle both insert and update cases
        // This requires a unique constraint on (assignment_date, row_index, col_index) in the database
        const { data, error } = await this.supabase
          .from('toewijzingen_grid')
          .upsert(batch, { 
            onConflict: 'assignment_date,row_index,col_index',
            ignoreDuplicates: false 
          })
          .select() // Add select to see what was actually inserted

        if (error) {
          console.error('❌ Database error in grid batch:', error)
          console.error('❌ Error details:', { 
            code: error.code, 
            details: error.details, 
            hint: error.hint,
            message: error.message 
          })
          console.error('❌ Failed batch sample:', batch.slice(0, 2))
          batch.forEach(() => results.push({ error: error.message }))
        } else {
          console.log(`✅ Grid batch saved successfully: ${batch.length} records`)
          console.log('✅ Inserted data sample:', data?.slice(0, 2))
          console.log(`✅ Total records returned from database: ${data?.length || 0}`)
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

      // Test table access before proceeding
      const tableTest = await apiService.testToewijzingenTables()
      if (!tableTest.success) {
        console.error('🚨 Database tables not accessible:', tableTest.error)
        throw new Error(`Database not ready: ${tableTest.error}`)
      }
      console.log('✅ Database tables verified and accessible')

      const gridCells: any[] = []
      const staffData: any[] = []

      // Debug: Check structure of tableData
      console.log('🔍 DEBUG: tableData structure:', {
        rows: tableData.length,
        firstRow: tableData[0] ? {
          length: tableData[0].length,
          firstCell: tableData[0][0],
          type: typeof tableData[0][0]
        } : null
      })
      
      // Convert table data to grid cells - save only cells with resident names
      tableData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          // Debug first few cells
          if (rowIndex <= 2 && colIndex <= 2 && cell && cell.text?.trim()) {
            console.log(`🔍 DEBUG: Cell [${rowIndex}][${colIndex}]:`, {
              text: cell.text,
              type: typeof cell,
              structure: cell,
              staffName: staffNames[colIndex]
            })
          }
          
          if (cell && cell.text?.trim()) {
            const gridCell = {
              assignment_date: assignmentDate,
              row_index: rowIndex,
              col_index: colIndex,
              resident_full_name: cell.text.trim(),
              ib_name: staffNames[colIndex] || null
            };
            
            gridCells.push(gridCell);
            
            // Debug first few grid cells
            if (gridCells.length <= 3) {
              console.log(`📝 Grid Cell ${gridCells.length}:`, gridCell);
            }
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
      
      // Only proceed with database operations if there's actual data to save
      if (gridCells.length === 0) {
        console.log('ℹ️ No grid data to save, skipping database operations to preserve existing data')
        return {
          success: true,
          data: {
            grid: { successful: 0, failed: 0, total: 0 },
            staff: { successful: staffData.length, failed: 0, total: staffData.length },
            errors: [],
            message: 'No changes to save'
          }
        }
      }
      
      // Debug: Log sample grid cells
      console.log('📋 Sample grid cells:', gridCells.slice(0, 3))

      // Clear existing data only when we have new data to save
      console.log('🧹 Clearing existing data before saving new data...')
      await apiService.clearToewijzingenGrid(assignmentDate)
      console.log('✅ Cleared existing grid data for date:', assignmentDate)

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

// Weekend Permissions API
export const weekendPermissionsApi = {
  // Get permissions for a specific week
  getByWeek: async (week: string) => {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from('weekend_permissions')
        .select('*')
        .eq('week', week)
        .order('badge');
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching weekend permissions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch permissions' };
    }
  },

  // Save or update permissions for a specific week
  saveWeekPermissions: async (permissions: any[]) => {
    try {
      if (permissions.length === 0) {
        return { success: true, data: { saved: 0, errors: [] } };
      }

      const results = { saved: 0, errors: [] as any[] };

      for (const permission of permissions) {
        try {
          // Prepare the data for database
          const dbPermission = {
            resident_id: permission.residentId,
            badge: permission.badge,
            first_name: permission.firstName,
            last_name: permission.lastName,
            date_of_birth: permission.dateOfBirth,
            age: permission.age,
            week: permission.week,
            friday_type: permission.friday.type,
            saturday_type: permission.saturday.type,
            sunday_type: permission.sunday.type,
            monday_type: permission.monday?.type || null,
            notes: permission.notes || '',
            status: permission.status,
            actual_arrival_time: permission.actualArrivalTime || null,
            last_modified: permission.lastModified
          };

          // Use upsert (insert or update) based on resident_id and week
          const supabase = createClient() as any;
          const { error } = await supabase
            .from('weekend_permissions')
            .upsert(dbPermission, {
              onConflict: 'resident_id,week'
            });

          if (error) {
            console.error(`Error saving permission for resident ${permission.residentId}:`, error);
            results.errors.push({
              residentId: permission.residentId,
              error: error.message
            });
          } else {
            results.saved++;
          }
        } catch (error) {
          console.error(`Error processing permission for resident ${permission.residentId}:`, error);
          results.errors.push({
            residentId: permission.residentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return { success: true, data: results };
    } catch (error) {
      console.error('Error saving weekend permissions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save permissions' };
    }
  },

  // Delete permissions for a specific week
  deleteWeekPermissions: async (week: string) => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('weekend_permissions')
        .delete()
        .eq('week', week);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting weekend permissions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete permissions' };
    }
  },

  // Get permissions for a specific resident
  getByResident: async (residentId: number) => {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from('weekend_permissions')
        .select('*')
        .eq('resident_id', residentId)
        .order('week', { ascending: false });
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching resident permissions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch resident permissions' };
    }
  },

  // Update status of permissions (approve/reject)
  updatePermissionStatus: async (permissionIds: number[], status: 'approved' | 'rejected') => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('weekend_permissions')
        .update({ status, last_modified: new Date().toISOString() })
        .in('id', permissionIds);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating permission status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update status' };
    }
  }
}