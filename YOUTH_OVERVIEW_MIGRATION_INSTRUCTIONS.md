# Youth Overview Table Migration Instructions

## Database Connection Details
- **Project URL**: https://xxcbpsjefpogxgfellui.supabase.co
- **Dashboard URL**: https://supabase.com/dashboard/project/xxcbpsjefpogxgfellui
- **SQL Editor URL**: https://supabase.com/dashboard/project/xxcbpsjefpogxgfellui/sql/new

## Steps to Apply Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Open the Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/xxcbpsjefpogxgfellui/sql/new

2. Copy the SQL migration script:
   - The migration file is located at: `/supabase/migrations/create_youth_overview_table.sql`

3. Paste the entire SQL content into the SQL Editor

4. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

1. Install Supabase CLI if not already installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref xxcbpsjefpogxgfellui
   ```

4. Run the migration:
   ```bash
   supabase db push
   ```

## Verification

After running the migration, verify the table was created:

1. Go to Table Editor in Supabase Dashboard
2. Look for the `youth_overview` table
3. Check that all columns are present

## What the Migration Does

The migration creates a `youth_overview` table with the following features:

- **Primary Key**: `id` (auto-incrementing)
- **Unique Index**: `badge` (for fast lookups and preventing duplicates)
- **Tab Location**: Tracks whether a youth is in 'IN' or 'OUT' tab
- **Timestamps**: Automatic `created_at` and `updated_at` fields
- **Row Level Security**: Enabled for secure access
- **Policies**: Allows authenticated users to read/write data

## Table Structure

The table includes all fields needed for the OVERZICHT JONGEREN page:
- Basic info: badge, naam, voornaam, geboortedatum, leeftijd
- Administrative: todos, aandachtspunten, intake, referent
- Staff assignments: gb, nb, back_up
- Legal: hr, procedure, voogd, advocaat
- Age verification: twijfel, uitnodiging, test, resultaat, opvolging_door
- Documents: Various version and document tracking fields
- Context and medical info
- Transfer tracking

## Testing the Implementation

1. Navigate to the OVERZICHT JONGEREN page in your application
2. Make some changes to the data (edit cells, add information)
3. Refresh the page
4. The data should persist and be loaded from the database

## Troubleshooting

If data is not persisting:

1. Check browser console for errors
2. Verify the table was created in Supabase
3. Check that environment variables are set correctly:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Ensure Row Level Security policies are correctly configured

## Next Steps

Once the migration is applied and verified:

1. The OVERZICHT JONGEREN page will automatically save all changes to the database
2. Data will persist across page refreshes and sessions
3. Multiple users can collaborate on the same data
4. The system will sync with the residents table for basic information