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
          language: string | null
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
          language?: string | null
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
          language?: string | null
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
      administrative_documents: {
        Row: {
          id: number
          resident_id: number | null
          document_type: 'IN' | 'OUT'
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          description: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          resident_id?: number | null
          document_type: 'IN' | 'OUT'
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          resident_id?: number | null
          document_type?: 'IN' | 'OUT'
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      administrative_documents_in: {
        Row: {
          id: number
          resident_id: number | null
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          description: string | null
          document_category: string | null
          uploaded_by: string | null
          is_required: boolean | null
          verification_status: 'pending' | 'verified' | 'rejected' | null
          verified_by: string | null
          verified_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          resident_id?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          document_category?: string | null
          uploaded_by?: string | null
          is_required?: boolean | null
          verification_status?: 'pending' | 'verified' | 'rejected' | null
          verified_by?: string | null
          verified_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          resident_id?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          document_category?: string | null
          uploaded_by?: string | null
          is_required?: boolean | null
          verification_status?: 'pending' | 'verified' | 'rejected' | null
          verified_by?: string | null
          verified_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      administrative_documents_out: {
        Row: {
          id: number
          resident_id: number | null
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          description: string | null
          document_category: string | null
          uploaded_by: string | null
          is_required: boolean | null
          completion_status: 'pending' | 'completed' | 'cancelled' | null
          completed_by: string | null
          completed_at: string | null
          exit_date: string | null
          forwarding_address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          resident_id?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          document_category?: string | null
          uploaded_by?: string | null
          is_required?: boolean | null
          completion_status?: 'pending' | 'completed' | 'cancelled' | null
          completed_by?: string | null
          completed_at?: string | null
          exit_date?: string | null
          forwarding_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          resident_id?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          document_category?: string | null
          uploaded_by?: string | null
          is_required?: boolean | null
          completion_status?: 'pending' | 'completed' | 'cancelled' | null
          completed_by?: string | null
          completed_at?: string | null
          exit_date?: string | null
          forwarding_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_categories: {
        Row: {
          id: number
          name: string
          description: string | null
          document_type: 'IN' | 'OUT'
          is_required: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          document_type: 'IN' | 'OUT'
          is_required?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          document_type?: 'IN' | 'OUT'
          is_required?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      resident_status_history: {
        Row: {
          id: number
          resident_id: number | null
          previous_status: string | null
          new_status: string
          status_type: 'IN' | 'OUT'
          change_date: string
          changed_by: string | null
          reason: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          resident_id?: number | null
          previous_status?: string | null
          new_status: string
          status_type: 'IN' | 'OUT'
          change_date?: string
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          resident_id?: number | null
          previous_status?: string | null
          new_status?: string
          status_type?: 'IN' | 'OUT'
          change_date?: string
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string
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
      resident_photos: {
        Row: {
          id: number
          badge_number: string
          photo_url: string
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          badge_number: string
          photo_url: string
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          badge_number?: string
          photo_url?: string
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      youth_overview: {
        Row: {
          id: number
          badge: string
          naam: string | null
          voornaam: string | null
          geboortedatum: string | null
          leeftijd: string | null
          todos: string | null
          aandachtspunten: string | null
          datum_in: string | null
          intake: string | null
          referent: string | null
          gb: string | null
          nb: string | null
          back_up: string | null
          hr: string | null
          procedure: string | null
          voogd: string | null
          advocaat: string | null
          twijfel: string | null
          uitnodiging: string | null
          test: string | null
          resultaat: string | null
          opvolging_door: string | null
          betekening: string | null
          wijziging_match_it: string | null
          scan_dv: string | null
          versie: string | null
          voorlopige_versie_klaar: string | null
          voorlopige_versie_verzonden: string | null
          definitieve_versie: string | null
          procedureles: string | null
          og: string | null
          mdo: string | null
          mdo2: string | null
          bxl_uitstap: string | null
          context: string | null
          opbouw_context: string | null
          specificaties: string | null
          stavaza: string | null
          autonomie: string | null
          context2: string | null
          medisch: string | null
          pleegzorg: string | null
          aanmelding_nodig: string | null
          vist_adoc: string | null
          datum_transfer: string | null
          transferdossier_verzonden: string | null
          out_status: string | null
          tab_location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          badge: string
          naam?: string | null
          voornaam?: string | null
          geboortedatum?: string | null
          leeftijd?: string | null
          todos?: string | null
          aandachtspunten?: string | null
          datum_in?: string | null
          intake?: string | null
          referent?: string | null
          gb?: string | null
          nb?: string | null
          back_up?: string | null
          hr?: string | null
          procedure?: string | null
          voogd?: string | null
          advocaat?: string | null
          twijfel?: string | null
          uitnodiging?: string | null
          test?: string | null
          resultaat?: string | null
          opvolging_door?: string | null
          betekening?: string | null
          wijziging_match_it?: string | null
          scan_dv?: string | null
          versie?: string | null
          voorlopige_versie_klaar?: string | null
          voorlopige_versie_verzonden?: string | null
          definitieve_versie?: string | null
          procedureles?: string | null
          og?: string | null
          mdo?: string | null
          mdo2?: string | null
          bxl_uitstap?: string | null
          context?: string | null
          opbouw_context?: string | null
          specificaties?: string | null
          stavaza?: string | null
          autonomie?: string | null
          context2?: string | null
          medisch?: string | null
          pleegzorg?: string | null
          aanmelding_nodig?: string | null
          vist_adoc?: string | null
          datum_transfer?: string | null
          transferdossier_verzonden?: string | null
          out_status?: string | null
          tab_location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          badge?: string
          naam?: string | null
          voornaam?: string | null
          geboortedatum?: string | null
          leeftijd?: string | null
          todos?: string | null
          aandachtspunten?: string | null
          datum_in?: string | null
          intake?: string | null
          referent?: string | null
          gb?: string | null
          nb?: string | null
          back_up?: string | null
          hr?: string | null
          procedure?: string | null
          voogd?: string | null
          advocaat?: string | null
          twijfel?: string | null
          uitnodiging?: string | null
          test?: string | null
          resultaat?: string | null
          opvolging_door?: string | null
          betekening?: string | null
          wijziging_match_it?: string | null
          scan_dv?: string | null
          versie?: string | null
          voorlopige_versie_klaar?: string | null
          voorlopige_versie_verzonden?: string | null
          definitieve_versie?: string | null
          procedureles?: string | null
          og?: string | null
          mdo?: string | null
          mdo2?: string | null
          bxl_uitstap?: string | null
          context?: string | null
          opbouw_context?: string | null
          specificaties?: string | null
          stavaza?: string | null
          autonomie?: string | null
          context2?: string | null
          medisch?: string | null
          pleegzorg?: string | null
          aanmelding_nodig?: string | null
          vist_adoc?: string | null
          datum_transfer?: string | null
          transferdossier_verzonden?: string | null
          out_status?: string | null
          tab_location?: string | null
          created_at?: string
          updated_at?: string
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