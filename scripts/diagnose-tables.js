// Diagnose table existence and connection
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Diagnosing table connections...\n');
console.log('Environment check:');
console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('- SERVICE_KEY:', supabaseServiceKey ? '✅ Present' : '❌ Missing');
console.log('- ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
console.log('');

async function testConnection(client, clientType) {
  console.log(`\n🔗 Testing ${clientType} client:`);
  
  try {
    // Test basic connectivity
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError && !authError.message.includes('session_not_found')) {
      console.log(`⚠️ Auth check: ${authError.message}`);
    } else {
      console.log(`✅ Client initialized successfully`);
    }
    
    // Test table access
    const tables = ['residents', 'data_match'];
    
    for (const tableName of tables) {
      try {
        const { data, error, count } = await client
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
          if (error.code) {
            console.log(`   Error code: ${error.code}`);
          }
        } else {
          console.log(`✅ ${tableName}: Found ${count || 0} records`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: Exception - ${e.message}`);
      }
    }
    
    // Test insert capability
    try {
      const testData = {
        first_name: 'Test',
        last_name: 'User',
        status: 'active'
      };
      
      console.log(`\n🧪 Testing insert to residents table:`);
      const { data, error } = await client
        .from('residents')
        .insert(testData)
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Insert failed: ${error.message}`);
        if (error.code) {
          console.log(`   Error code: ${error.code}`);
        }
      } else {
        console.log(`✅ Insert successful: ${data.id}`);
        
        // Clean up test data
        await client
          .from('residents')
          .delete()
          .eq('id', data.id);
        console.log(`🧹 Test data cleaned up`);
      }
    } catch (e) {
      console.log(`❌ Insert test exception: ${e.message}`);
    }
    
  } catch (e) {
    console.log(`❌ ${clientType} client failed: ${e.message}`);
  }
}

async function diagnose() {
  // Test with anonymous key (what the app uses)
  if (supabaseUrl && supabaseAnonKey) {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    await testConnection(anonClient, 'Anonymous');
  }
  
  // Test with service key (what the script uses)  
  if (supabaseUrl && supabaseServiceKey) {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    await testConnection(serviceClient, 'Service Role');
  }
}

diagnose().catch(console.error);