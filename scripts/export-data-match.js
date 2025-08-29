// Export data_match table data to CSV
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function exportDataMatchToCsv() {
  console.log('🔄 Exporting data_match table to CSV...');
  
  try {
    // Fetch all data from data_match table
    const { data, error } = await supabase
      .from('data_match')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('📭 No data found in data_match table');
      return;
    }
    
    console.log(`📊 Found ${data.length} records`);
    
    // Get column headers from first row
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];
        
        // Handle different data types
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'object') {
          // JSON objects need to be stringified and escaped
          return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
        } else if (typeof value === 'string' && value.includes(',')) {
          // Escape strings containing commas
          return '"' + value.replace(/"/g, '""') + '"';
        } else {
          return value;
        }
      });
      
      csvContent += values.join(',') + '\n';
    });
    
    // Write to file
    fs.writeFileSync('data_match_rows.csv', csvContent);
    
    console.log('✅ Data exported successfully to data_match_rows.csv');
    console.log(`📁 File size: ${fs.statSync('data_match_rows.csv').size} bytes`);
    
    // Show preview of first few rows
    console.log('\n📋 Preview (first 3 rows):');
    console.log(csvContent.split('\n').slice(0, 4).join('\n'));
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.error('💡 The data_match table does not exist. Create it first using the Supabase dashboard.');
    } else if (error.message?.includes('permission denied')) {
      console.error('💡 Permission denied. Make sure your service role key has the correct permissions.');
    }
  }
}

exportDataMatchToCsv();