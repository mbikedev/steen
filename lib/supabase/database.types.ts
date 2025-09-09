export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      residents: {
        Row: {
          id: number
          badge: number
          first_name: string
          last_name: string
          room: string | null
          nationality: string | null
          ov_number: string | null
          register_number: string | null
          date_of_birth: string | null
          age: number | null
          gender: 'M' | 'F' | 'X' | null
          reference_person: string | null
          date_in: string | null
          date_out: string | null
          days_of_stay: number | null
          status: string | null
          remarks: string | null
          room_remarks: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          badge: number
          first_name: string
          last_name: string
          room?: string | null
          nationality?: string | null
          ov_number?: string | null
          register_number?: string | null
          date_of_birth?: string | null
          age?: number | null
          gender?: 'M' | 'F' | 'X' | null
          reference_person?: string | null
          date_in?: string | null
          date_out?: string | null
          days_of_stay?: number | null
          status?: string | null
          remarks?: string | null
          room_remarks?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          badge?: number
          first_name?: string
          last_name?: string
          room?: string | null
          nationality?: string | null
          ov_number?: string | null
          register_number?: string | null
          date_of_birth?: string | null
          age?: number | null
          gender?: 'M' | 'F' | 'X' | null
          reference_person?: string | null
          date_in?: string | null
          date_out?: string | null
          days_of_stay?: number | null
          status?: string | null
          remarks?: string | null
          room_remarks?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: number
          room_number: string
          building: 'Noord' | 'Zuid'
          floor: number
          capacity: number
          occupied: number
          available: number
          gender_restriction: 'M' | 'F' | 'X' | null
          age_restriction: string | null
          remarks: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          room_number: string
          building: 'Noord' | 'Zuid'
          floor: number
          capacity: number
          occupied?: number
          available?: number
          gender_restriction?: 'M' | 'F' | 'X' | null
          age_restriction?: string | null
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          room_number?: string
          building?: 'Noord' | 'Zuid'
          floor?: number
          capacity?: number
          occupied?: number
          available?: number
          gender_restriction?: 'M' | 'F' | 'X' | null
          age_restriction?: string | null
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      room_assignments: {
        Row: {
          id: number
          resident_id: number
          room_id: number
          bed_number: number
          assigned_date: string
          released_date: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          resident_id: number
          room_id: number
          bed_number: number
          assigned_date: string
          released_date?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          resident_id?: number
          room_id?: number
          bed_number?: number
          assigned_date?: string
          released_date?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: number
          resident_id: number
          appointment_type: string
          appointment_date: string
          appointment_time: string
          location: string | null
          notes: string | null
          status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          resident_id: number
          appointment_type: string
          appointment_date: string
          appointment_time: string
          location?: string | null
          notes?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          resident_id?: number
          appointment_type?: string
          appointment_date?: string
          appointment_time?: string
          location?: string | null
          notes?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meal_schedules: {
        Row: {
          id: number
          resident_id: number
          meal_date: string
          breakfast: boolean
          lunch: boolean
          dinner: boolean
          dietary_restrictions: string | null
          special_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          resident_id: number
          meal_date: string
          breakfast?: boolean
          lunch?: boolean
          dinner?: boolean
          dietary_restrictions?: string | null
          special_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          resident_id?: number
          meal_date?: string
          breakfast?: boolean
          lunch?: boolean
          dinner?: boolean
          dietary_restrictions?: string | null
          special_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      staff_assignments: {
        Row: {
          id: number
          staff_name: string
          assignment_type: string
          shift: 'morning' | 'afternoon' | 'night'
          building: 'Noord' | 'Zuid' | 'Both'
          assignment_date: string
          notes: string | null
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          staff_name: string
          assignment_type: string
          shift: 'morning' | 'afternoon' | 'night'
          building: 'Noord' | 'Zuid' | 'Both'
          assignment_date: string
          notes?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          staff_name?: string
          assignment_type?: string
          shift?: 'morning' | 'afternoon' | 'night'
          building?: 'Noord' | 'Zuid' | 'Both'
          assignment_date?: string
          notes?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: number
          resident_id: number
          permission_type: string
          start_date: string
          end_date: string
          reason: string | null
          approved_by: string | null
          status: 'pending' | 'approved' | 'denied' | 'expired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          resident_id: number
          permission_type: string
          start_date: string
          end_date: string
          reason?: string | null
          approved_by?: string | null
          status?: 'pending' | 'approved' | 'denied' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          resident_id?: number
          permission_type?: string
          start_date?: string
          end_date?: string
          reason?: string | null
          approved_by?: string | null
          status?: 'pending' | 'approved' | 'denied' | 'expired'
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: number
          resident_id: number | null
          document_type: string
          document_name: string
          file_url: string
          file_size: number
          mime_type: string
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          resident_id?: number | null
          document_type: string
          document_name: string
          file_url: string
          file_size: number
          mime_type: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          resident_id?: number | null
          document_type?: string
          document_name?: string
          file_url?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      toewijzingen_grid: {
        Row: {
          id: number
          assignment_date: string
          row_index: number
          col_index: number
          resident_full_name: string | null
          ib_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          assignment_date: string
          row_index: number
          col_index: number
          resident_full_name?: string | null
          ib_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          assignment_date?: string
          row_index?: number
          col_index?: number
          resident_full_name?: string | null
          ib_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      toewijzingen_staff: {
        Row: {
          id: number
          assignment_date: string
          staff_name: string
          staff_index: number
          assignment_count: number | null
          annotations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          assignment_date: string
          staff_name: string
          staff_index: number
          assignment_count?: number | null
          annotations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          assignment_date?: string
          staff_name?: string
          staff_index?: number
          assignment_count?: number | null
          annotations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: number
          user_id: string | null
          action: string
          entity_type: string
          entity_id: number | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: number | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: number | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}