# Supabase Setup Instructions

## Database Setup Complete! ✅

Your Supabase integration has been successfully configured with all necessary files and database tables.

## What Has Been Set Up

### 1. **Supabase Client Configuration**
- ✅ Browser client (`lib/supabase/client.ts`)
- ✅ Server client (`lib/supabase/server.ts`)
- ✅ Middleware for session management (`lib/supabase/middleware.ts`)
- ✅ Authentication middleware (`middleware.ts`)

### 2. **Database Schema**
Created the following tables with proper relationships:
- ✅ **residents** - Main resident information
- ✅ **rooms** - Room configuration and capacity
- ✅ **room_assignments** - Bed assignments
- ✅ **appointments** - Appointment scheduling
- ✅ **meal_schedules** - Meal planning
- ✅ **staff_assignments** - Staff duty roster
- ✅ **permissions** - Leave tracking
- ✅ **documents** - Document storage
- ✅ **activity_logs** - Audit trail

### 3. **Authentication System**
- ✅ **AuthContext** - Complete authentication flow
- ✅ Login/Logout functionality
- ✅ Password reset capability
- ✅ Session management

### 4. **API Service Layer**
- ✅ Complete CRUD operations for all entities
- ✅ File upload support
- ✅ Activity logging
- ✅ Dashboard statistics

### 5. **Data Context**
- ✅ Global state management
- ✅ Real-time data synchronization
- ✅ Optimistic updates

## Environment Variables Configured

Your `.env.local` file has been created with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxcbpsjefpogxgfellui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_PROJECT_ID=xxcbpsjefpogxgfellui
```

## Next Steps

### 1. Run Database Migration

Go to your Supabase dashboard and run the SQL migration:

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/xxcbpsjefpogxgfellui)
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run**

### 2. Configure Storage Bucket

In your Supabase dashboard:

1. Go to **Storage**
2. Create a new bucket called `documents`
3. Set it to **Public** if you want documents to be publicly accessible
4. Or keep it **Private** and documents will require authentication

### 3. Set Up Authentication

In your Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates if needed
4. Set up redirect URLs:
   - Site URL: `http://localhost:3000` (for development)
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Create Initial User

You can create users in two ways:

**Option A: Via Supabase Dashboard**
1. Go to **Authentication** → **Users**
2. Click **Invite User**
3. Enter email and password

**Option B: Via the Application**
1. Start your application: `npm run dev`
2. Navigate to `/signup`
3. Create a new account

### 5. Test the Integration

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Try logging in with your created user

4. Test basic operations:
   - View dashboard
   - Add a resident
   - Assign a room
   - Upload a document

## Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check that your `.env.local` file contains the correct keys
   - Restart the development server after changing environment variables

2. **"Permission denied" errors**
   - Make sure Row Level Security (RLS) policies are correctly set
   - Check that the user is authenticated

3. **"Table does not exist"**
   - Run the migration script in the SQL editor
   - Verify all tables were created successfully

4. **Storage upload fails**
   - Create the `documents` bucket in Storage settings
   - Check bucket permissions

## Security Notes

- The anon key in `.env.local` is safe to expose in the browser
- Never expose your service role key
- Row Level Security (RLS) is enabled on all tables
- Current policies allow all operations for authenticated users
- Consider implementing more granular permissions based on user roles

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- Project ID: `xxcbpsjefpogxgfellui`

## Database Connection Details

- **Project URL**: https://xxcbpsjefpogxgfellui.supabase.co
- **Database Password**: gvjJFAkpXtucaTXY (keep this secure!)

Your Supabase integration is now ready to use! 🎉