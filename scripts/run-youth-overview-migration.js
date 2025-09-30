#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running youth_overview table migration...');

    // Read the migration SQL file
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/create_youth_overview_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    }).single();

    // If the RPC doesn't exist, try executing SQL statements one by one
    if (error && error.message.includes('exec_sql')) {
      console.log('Executing SQL statements directly...');

      // Split SQL statements (simple split on semicolon - may need improvement for complex SQL)
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);

        // Since we can't execute raw SQL directly via the JS client,
        // we'll need to use the Supabase dashboard or CLI
        console.log('Please execute the following SQL in your Supabase dashboard:');
        console.log('Navigate to: https://supabase.com/dashboard/project/xxcbpsjefpogxgfellui/sql/new');
        console.log('And run the SQL from:', migrationPath);
      }

      console.log('\n=== IMPORTANT ===');
      console.log('The migration SQL has been created at:');
      console.log(migrationPath);
      console.log('\nPlease go to your Supabase dashboard and:');
      console.log('1. Navigate to the SQL Editor');
      console.log('2. Copy and paste the contents of the migration file');
      console.log('3. Execute the SQL to create the youth_overview table');
      console.log('\nSupabase Dashboard URL:');
      console.log('https://supabase.com/dashboard/project/xxcbpsjefpogxgfellui/sql/new');

      return;
    }

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Test connection first
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('residents').select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }

    console.log('Connection successful!');
    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
}

// Main execution
(async () => {
  const connected = await testConnection();

  if (connected) {
    await runMigration();
  } else {
    console.error('Could not connect to Supabase. Please check your credentials.');
    process.exit(1);
  }
})();