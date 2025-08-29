import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables not found:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    anonKey: supabaseAnonKey ? 'Present' : 'Missing'
  });
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

// Log connection status
if (supabase) {
  console.log('✅ Supabase client initialized successfully');
  console.log('🔗 Connected to:', supabaseUrl);
  console.log('🔑 Using anon key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing');
} else {
  console.error('❌ Failed to initialize Supabase client');
  console.error('Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'MISSING');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'MISSING');
}

// Type definitions for database tables
export interface DataMatchRecord {
  id: string;
  resident_id: string;
  external_id: string;
  external_system: string;
  match_status: 'matched' | 'pending' | 'unmatched' | 'conflict';
  match_confidence?: number;
  last_sync?: string;
  sync_status: 'success' | 'failed' | 'pending';
  data_payload: any;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Resident {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'M' | 'V';
  status: 'active' | 'inactive' | 'pending';
  admission_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Accommodation {
  id: string;
  room_number: string;
  building?: string;
  floor?: number;
  room_type?: 'single' | 'double' | 'suite' | 'ward';
  capacity?: number;
  current_occupancy?: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  amenities?: any;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Bed {
  id: string;
  accommodation_id?: string;
  bed_number: string;
  bed_type?: 'standard' | 'adjustable' | 'hospital' | 'special';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  resident_id?: string;
  location?: 'noord' | 'zuid' | 'other';
  notes?: string;
  last_cleaned?: string;
  next_maintenance?: string;
  created_at?: string;
  updated_at?: string;
}

// Test database connection and permissions
export async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return false;
  }
  
  try {
    // Test 1: Check if we can query the residents table
    console.log('📊 Test 1: Checking residents table access...');
    const { data: residents, error: readError } = await supabase
      .from('residents')
      .select('id')
      .limit(1);
    
    if (readError) {
      console.error('❌ Cannot read residents table:', readError);
      if (readError.message?.includes('relation') && readError.message?.includes('does not exist')) {
        console.error('❌ Table does not exist. Please run the migration SQL first.');
      }
    } else {
      console.log('✅ Can read residents table');
    }
    
    // Test 2: Check auth status
    console.log('📊 Test 2: Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️ Not authenticated - using anonymous access');
      
      // Test anonymous insert capability
      console.log('📊 Test 3: Testing anonymous insert...');
      const testResident = {
        first_name: 'Test',
        last_name: 'User',
        status: 'active'
      };
      
      const { data: testInsert, error: insertError } = await supabase
        .from('residents')
        .insert(testResident)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Cannot insert as anonymous:', insertError);
        console.error('Hint: You may need to update RLS policies to allow anonymous inserts');
      } else {
        console.log('✅ Anonymous insert successful, cleaning up test data...');
        
        // Clean up test data
        await supabase
          .from('residents')
          .delete()
          .eq('id', testInsert.id);
      }
    } else {
      console.log('✅ Authenticated as:', user.email || user.id);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Helper functions for database operations
export const dbOperations = {
  // Add resident and related data
  async addResident(residentData: any) {
    // Check if Supabase client is initialized
    if (!supabase) {
      console.error('❌ Cannot add resident: Supabase client not initialized');
      return { 
        success: false, 
        error: 'Database connection not available. Please check environment configuration.' 
      };
    }

    try {
      console.log('🔄 Adding resident to database:', {
        firstName: residentData.firstName,
        lastName: residentData.lastName,
        badge: residentData.badge
      });

      // First, create the resident
      const residentPayload = {
        first_name: residentData.firstName || '',
        last_name: residentData.lastName || '',
        date_of_birth: residentData.dateOfBirth || null,
        gender: residentData.gender === 'V' ? 'V' : 'M',
        status: residentData.status || 'active',
        admission_date: residentData.dateIn || null
      };

      console.log('📤 Sending resident data:', residentPayload);

      const { data: resident, error: residentError } = await supabase
        .from('residents')
        .insert(residentPayload)
        .select()
        .single();

      if (residentError) {
        console.error('❌ Resident insert error:', {
          error: residentError,
          message: residentError?.message || 'No message',
          code: residentError?.code || 'No code',
          details: residentError?.details || 'No details',
          hint: residentError?.hint || 'No hint',
          stringified: JSON.stringify(residentError)
        });
        
        // Check for common issues
        if (residentError?.message?.includes('violates foreign key constraint')) {
          console.error('❌ Foreign key constraint error - check if related tables exist');
        } else if (residentError?.message?.includes('permission denied')) {
          console.error('❌ Permission denied - check RLS policies');
        } else if (residentError?.message?.includes('JWT')) {
          console.error('❌ Authentication error - check API keys');
        }
        
        throw residentError;
      }

      console.log('✅ Resident created:', resident);

      // Then create the data match record
      const dataMatchPayload = {
        resident_id: resident.id,
        external_id: String(residentData.badge),
        external_system: 'legacy_system',
        match_status: 'matched',
        sync_status: 'success',
        data_payload: {
          badge: residentData.badge,
          room: residentData.room,
          nationality: residentData.nationality,
          ovNumber: residentData.ovNumber,
          registerNumber: residentData.registerNumber,
          age: residentData.age,
          referencePerson: residentData.referencePerson,
          daysOfStay: residentData.daysOfStay
        }
      };

      console.log('📤 Sending data match record:', dataMatchPayload);

      const { data: dataMatch, error: matchError } = await supabase
        .from('data_match')
        .insert(dataMatchPayload)
        .select()
        .single();

      if (matchError) {
        console.error('❌ Data match insert error:', matchError);
        throw matchError;
      }

      console.log('✅ Data match record created:', dataMatch);
      
      // Room/accommodation management is optional and can be added later
      if (residentData.room) {
        console.log(`📍 Room ${residentData.room} recorded in data payload (accommodation tables not configured)`);
      }

      return { success: true, resident, dataMatch };
    } catch (error: any) {
      console.error('❌ Error adding resident to database:', {
        error,
        message: error?.message || 'Unknown error',
        details: error?.details || 'No details available',
        hint: error?.hint || 'No hint available',
        code: error?.code || 'No error code'
      });
      
      // Check if it's a connection error
      if (!supabase) {
        console.error('❌ Supabase client not initialized');
      }
      
      return { success: false, error: error?.message || 'Database operation failed' };
    }
  },

  // Add multiple residents in batch
  async addMultipleResidents(residents: any[]) {
    const results = [];
    for (const resident of residents) {
      const result = await this.addResident(resident);
      results.push(result);
    }
    return results;
  },

  // Delete resident and related data
  async deleteResident(residentId: string) {
    try {
      // Delete will cascade to related tables due to foreign keys
      const { error } = await supabase
        .from('residents')
        .delete()
        .eq('id', residentId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting resident from database:', error);
      return { success: false, error };
    }
  },

  // Update resident data
  async updateResident(residentId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('residents')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          date_of_birth: updates.dateOfBirth,
          gender: updates.gender === 'V' ? 'V' : 'M',
          status: updates.status
        })
        .eq('id', residentId)
        .select()
        .single();

      if (error) throw error;

      // Also update data_match payload
      const { error: matchError } = await supabase
        .from('data_match')
        .update({
          data_payload: {
            badge: updates.badge,
            room: updates.room,
            nationality: updates.nationality,
            ovNumber: updates.ovNumber,
            registerNumber: updates.registerNumber,
            age: updates.age,
            referencePerson: updates.referencePerson,
            daysOfStay: updates.daysOfStay
          },
          last_sync: new Date().toISOString()
        })
        .eq('resident_id', residentId);

      if (matchError) console.error('Error updating data match:', matchError);

      return { success: true, data };
    } catch (error) {
      console.error('Error updating resident in database:', error);
      return { success: false, error };
    }
  },

  // Fetch all residents with data match information
  async fetchAllResidents() {
    try {
      const { data, error } = await supabase
        .from('data_match')
        .select(`
          *,
          residents (
            id,
            first_name,
            last_name,
            date_of_birth,
            gender,
            status,
            admission_date
          )
        `)
        .eq('external_system', 'legacy_system')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching residents from database:', error);
      return { success: false, error };
    }
  }
};