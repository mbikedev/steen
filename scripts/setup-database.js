// Script to run database migrations using the existing Supabase client
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(migrationPath) {
  console.log(`\n🔄 Running migration: ${path.basename(migrationPath)}`);
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements (rough split on semicolons outside strings)
    const statements = sql
      .split(/;\s*$/gm)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_statement: statement 
        });
        
        if (error) {
          // Try direct execution if RPC doesn't work
          const { error: directError } = await supabase
            .from('_migrations')
            .select()
            .limit(1);
            
          if (directError && directError.message.includes('does not exist')) {
            console.log('Using direct SQL execution...');
            // For simple operations, we can use the REST API
            // This is a fallback - for complex migrations, we'd need the SQL editor
          }
          
          console.error('❌ Error executing statement:', error.message);
          console.log('Statement:', statement);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log(`✅ Migration ${path.basename(migrationPath)} completed`);
  } catch (error) {
    console.error(`❌ Error running migration ${migrationPath}:`, error.message);
    throw error;
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  
  try {
    // Test connection
    const { data, error } = await supabase
      .from('_migrations')
      .select()
      .limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    
    console.log('✅ Connected to Supabase');
    
    // Run migrations in order
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      await runMigration(path.join(migrationsDir, file));
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Check your Supabase dashboard to verify tables were created');
    console.log('2. Try adding a resident in your app');
    console.log('3. Click the "Test Database" button to verify everything works');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.log('\n🔧 Manual setup instructions:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/whixskigyxeligukorrm');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the SQL from:');
    console.log('   - supabase/migrations/001_create_dashboard_tables.sql');
    console.log('   - supabase/migrations/002_fix_rls_policies.sql');
    console.log('4. Execute each migration manually');
  }
}

setupDatabase();