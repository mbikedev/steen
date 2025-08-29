import { supabase } from './supabase';

export async function fullDatabaseDiagnostic() {
  console.log('🔍 Starting comprehensive database diagnostic...');
  
  // Test 1: Check environment variables
  console.log('\n📋 Test 1: Environment Variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized - check environment variables');
    return false;
  }
  
  // Test 2: Basic connectivity
  console.log('\n🌐 Test 2: Basic Connectivity');
  try {
    const { data, error } = await supabase
      .from('residents')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error);
      
      // Check common error patterns
      if (error.message?.includes('JWT')) {
        console.error('🔑 Authentication issue - JWT token problem');
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.error('🏗️ Table does not exist - need to run migration');
      } else if (error.message?.includes('permission denied')) {
        console.error('🔒 Permission denied - RLS policy issue');
      } else if (error.message?.includes('network')) {
        console.error('🌐 Network connectivity issue');
      } else {
        console.error('❓ Unknown connection error');
      }
    } else {
      console.log('✅ Basic connectivity works');
      console.log(`📊 Found ${data || 0} residents in database`);
    }
  } catch (e) {
    console.error('❌ Connection test threw exception:', e);
  }
  
  // Test 3: Check if tables exist
  console.log('\n🏗️ Test 3: Table Structure');
  const tables = ['residents', 'data_match'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table}: exists`);
      }
    } catch (e) {
      console.error(`❌ Table ${table}: exception -`, e);
    }
  }
  
  // Test 4: Authentication status
  console.log('\n🔐 Test 4: Authentication');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('⚠️ Auth check failed:', error.message);
    }
    
    if (user) {
      console.log('✅ Authenticated as:', user.email || user.id);
      console.log('User role:', user.role || 'No role');
      console.log('User metadata:', user.user_metadata);
    } else {
      console.log('🔓 Not authenticated - using anonymous access');
    }
  } catch (e) {
    console.error('❌ Auth check threw exception:', e);
  }
  
  // Test 5: Simple insert test
  console.log('\n💾 Test 5: Insert Test');
  try {
    const testData = {
      first_name: 'Test',
      last_name: 'User',
      status: 'active'
    };
    
    console.log('Attempting to insert:', testData);
    
    const { data, error } = await supabase
      .from('residents')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Insert test failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Detailed error analysis
      if (error.code === '23505') {
        console.error('🔄 Unique constraint violation');
      } else if (error.code === '23503') {
        console.error('🔗 Foreign key constraint violation');
      } else if (error.code === '23514') {
        console.error('✅ Check constraint violation');
      } else if (error.code === '42501') {
        console.error('🔒 Insufficient privilege');
      } else if (error.code === '42P01') {
        console.error('🏗️ Table does not exist');
      }
    } else {
      console.log('✅ Insert test successful:', data);
      
      // Clean up test data
      await supabase
        .from('residents')
        .delete()
        .eq('id', data.id);
      
      console.log('🧹 Test data cleaned up');
    }
  } catch (e) {
    console.error('❌ Insert test threw exception:', e);
  }
  
  // Test 6: RLS Policy test (simplified)
  console.log('\n🔒 Test 6: RLS Policies');
  console.log('⚠️ RLS policy details check skipped (pg_policies not accessible)');
  
  console.log('\n🎯 Diagnostic complete. Check results above for issues.');
  return true;
}

// Simplified connection test for quick debugging
export async function quickConnectionTest() {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from('residents')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Quick test failed:', error.message);
      return false;
    } else {
      console.log('✅ Quick test passed');
      return true;
    }
  } catch (e) {
    console.error('❌ Quick test exception:', e);
    return false;
  }
}