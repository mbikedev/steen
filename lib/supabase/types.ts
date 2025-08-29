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
          id: string
          badge_number: number
          first_name: string
          last_name: string
          nationality: string | null
          language: string | null
          gender: string | null
          birth_date: string | null
          registration_number: string | null
          ov_number: string | null
          room_number: string | null
          reference_person: string | null
          check_in_date: string | null
          days_stayed: number | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          badge_number: number
          first_name: string
          last_name: string
          nationality?: string | null
          language?: string | null
          gender?: string | null
          birth_date?: string | null
          registration_number?: string | null
          ov_number?: string | null
          room_number?: string | null
          reference_person?: string | null
          check_in_date?: string | null
          days_stayed?: number | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          badge_number?: number
          first_name?: string
          last_name?: string
          nationality?: string | null
          language?: string | null
          gender?: string | null
          birth_date?: string | null
          registration_number?: string | null
          ov_number?: string | null
          room_number?: string | null
          reference_person?: string | null
          check_in_date?: string | null
          days_stayed?: number | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          room_number: string
          building: string | null
          floor: number | null
          capacity: number
          current_occupancy: number
          is_available: boolean
          room_type: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_number: string
          building?: string | null
          floor?: number | null
          capacity?: number
          current_occupancy?: number
          is_available?: boolean
          room_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_number?: string
          building?: string | null
          floor?: number | null
          capacity?: number
          current_occupancy?: number
          is_available?: boolean
          room_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meal_schedules: {
        Row: {
          id: string
          resident_id: string | null
          badge_number: number | null
          breakfast: boolean
          lunch: boolean
          snack_16h: boolean
          dinner: boolean
          snack_21h: boolean
          special_diet: string | null
          medication_notes: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id?: string | null
          badge_number?: number | null
          breakfast?: boolean
          lunch?: boolean
          snack_16h?: boolean
          dinner?: boolean
          snack_21h?: boolean
          special_diet?: string | null
          medication_notes?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string | null
          badge_number?: number | null
          breakfast?: boolean
          lunch?: boolean
          snack_16h?: boolean
          dinner?: boolean
          snack_21h?: boolean
          special_diet?: string | null
          medication_notes?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      room_assignments: {
        Row: {
          id: string
          resident_id: string | null
          room_id: string | null
          assigned_date: string
          unassigned_date: string | null
          bed_number: number | null
          is_current: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id?: string | null
          room_id?: string | null
          assigned_date?: string
          unassigned_date?: string | null
          bed_number?: number | null
          is_current?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string | null
          room_id?: string | null
          assigned_date?: string
          unassigned_date?: string | null
          bed_number?: number | null
          is_current?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          resident_id: string | null
          appointment_type: string | null
          appointment_date: string | null
          appointment_time: string | null
          location: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id?: string | null
          appointment_type?: string | null
          appointment_date?: string | null
          appointment_time?: string | null
          location?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string | null
          appointment_type?: string | null
          appointment_date?: string | null
          appointment_time?: string | null
          location?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      current_room_occupancy: {
        Row: {
          room_number: string | null
          building: string | null
          capacity: number | null
          current_occupancy: number | null
          available_beds: number | null
        }
      }
      resident_details: {
        Row: {
          id: string | null
          badge_number: number | null
          first_name: string | null
          last_name: string | null
          nationality: string | null
          language: string | null
          gender: string | null
          birth_date: string | null
          registration_number: string | null
          ov_number: string | null
          room_number: string | null
          reference_person: string | null
          check_in_date: string | null
          days_stayed: number | null
          status: string | null
          notes: string | null
          assigned_room: string | null
          building: string | null
          breakfast: boolean | null
          lunch: boolean | null
          dinner: boolean | null
          special_diet: string | null
          medication_notes: string | null
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}