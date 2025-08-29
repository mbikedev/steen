# Asylum Center Database Setup

This directory contains the database schema and seed data for the Asylum Center Management System.

## Files

- **schema.sql** - Complete database schema with tables, views, triggers, and RLS policies
- **seed-data.sql** - Initial data extracted from PDF files
- **setup-database.sh** - Automated setup script

## Data Sources

The seed data is extracted from the following PDF files:
- **Bewonerlijst.pdf** - Residents list with 54 residents
- **keukenlijst.pdf** - Kitchen/meal schedules for all residents  
- **rooms-noord.pdf** - North building room assignments (Block 1)
- **rooms-zuid.pdf** - South building room assignments (Block 2)

## Database Structure

### Main Tables
- **residents** - Resident information (badge, name, nationality, etc.)
- **rooms** - Room details and occupancy
- **meal_schedules** - Meal preferences and dietary requirements
- **room_assignments** - Links residents to rooms
- **appointments** - Medical, legal, and other appointments

### Key Features
- Automatic room occupancy tracking via triggers
- Row-level security for data protection
- Optimized indexes for performance
- Views for common queries

## Setup Instructions

### Option 1: Using the Setup Script

1. Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://user:password@host:port/database
```

2. Run the setup script:
```bash
./supabase/setup-database.sh
```

### Option 2: Manual Setup via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the query
5. Copy and paste the contents of `seed-data.sql`
6. Run the query

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push schema.sql
supabase db push seed-data.sql
```

## Data Summary

After seeding, the database contains:
- **54 residents** from various countries (Eritrea, Afghanistan, Guinea, etc.)
- **20 rooms** across Noord and Zuid buildings
- **Room capacity**: Total of 76 beds
- **Meal schedules** for all residents
- **Sample appointments** for medical and legal meetings

## Updating Data

To update the seed data:
1. Modify the `seed-data.sql` file
2. Use `ON CONFLICT` clauses to handle existing records
3. Re-run the seed script

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Policies require authentication for data access
- Adjust policies in `schema.sql` based on your auth setup

## Troubleshooting

If you encounter issues:
1. Ensure PostgreSQL client is installed for script execution
2. Verify DATABASE_URL is correct in `.env.local`
3. Check Supabase dashboard for any error logs
4. Ensure your Supabase project has the uuid-ossp extension enabled