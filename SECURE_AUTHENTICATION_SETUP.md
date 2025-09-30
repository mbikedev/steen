# Secure Authentication System - Setup Guide

## Overview

Your application now has an **invitation-only registration system** with email domain whitelisting to ensure only authorized center employees can access the system.

## Security Features Implemented

✅ **Invitation-Only Registration** - No public signup page
✅ **Email Domain Whitelist** - Only approved domains can register (e.g., @fedasil.be)
✅ **Token-Based Invitations** - Unique, time-limited invitation links
✅ **Auto-Approval** - Invited users are automatically approved
✅ **Role-Based Access Control** - Admin, Manager, Staff, Viewer roles

---

## Step 1: Database Setup

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/xxcbpsjefpogxgfellui
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20250930_create_invitation_system_v2.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run** to execute the migration

**Note:** This migration file is safe to run multiple times - it uses `CREATE TABLE IF NOT EXISTS` and `DROP POLICY IF EXISTS` to handle existing objects.

### Option B: Using psql Command Line

```bash
cd /Users/mbike/Documents/steen-main16
export PGPASSWORD=gvjJFAkpXtucaTXY
psql -h xxcbpsjefpogxgfellui.supabase.co -U postgres -d postgres < supabase/migrations/20250930_create_invitation_system_v2.sql
```

### What This Creates:

- **`allowed_email_domains`** - Whitelist of authorized email domains
- **`invitations`** - Pending invitations with unique tokens
- **`user_profiles`** - Extended user information with roles

---

## Step 2: Configure Allowed Email Domains

By default, only `fedasil.be` domain is whitelisted.

**Important:** All center members have email addresses in the format: `firstname.lastname@fedasil.be`

The system will automatically validate that invitation emails match this domain pattern.

### To Add More Domains (Optional):

1. Go to Supabase Dashboard → **Table Editor**
2. Select `allowed_email_domains` table
3. Click **Insert Row**
4. Enter:
   - **domain**: `example.be` (without @)
   - **description**: "Description of organization"
   - **is_active**: `true`

### To Remove a Domain:

Set `is_active` to `false` for that domain row.

---

## Step 3: Create Your First Admin User

Since this is a closed system, you need to manually create the first admin through Supabase:

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **Add User** → **Create new user**
3. Enter:
   - Email: your_admin@fedasil.be
   - Password: (create a strong password)
   - Confirm email: ✅ (check this box)
4. Click **Create user**
5. Copy the **User ID** from the users list
6. Go to **SQL Editor** and run:

```sql
INSERT INTO user_profiles (id, role, is_approved, approved_at)
VALUES
  ('YOUR_USER_ID_HERE', 'admin', true, NOW());
```

---

## Step 4: How to Invite New Employees

### Manual Method (Temporary - Until Admin Panel is Built)

For now, create invitations directly in Supabase:

1. Go to **Table Editor** → `invitations`
2. Click **Insert Row**
3. Fill in:
   - **email**: `firstname.lastname@fedasil.be` (use the employee's actual Fedasil email)
   - **token**: Generate a random token (use: https://www.uuidgenerator.net/)
   - **role**: `staff` (or `manager`, `admin`, `viewer`)
   - **expires_at**: 7 days from now (format: `2025-10-07 12:00:00+00`)
   - **is_active**: `true`
   - **created_by**: Your admin user ID
4. Click **Save**

5. Send this link to the employee:
```
https://your-app-url.com/signup?token=GENERATED_TOKEN&email=firstname.lastname@fedasil.be
```

**Example:**
- Employee: John Smith
- Email: `john.smith@fedasil.be`
- Invitation URL: `https://your-app.com/signup?token=abc-123-def&email=john.smith@fedasil.be`

### What Happens When Employee Clicks Link:

1. System validates invitation token and email
2. Checks if email domain is whitelisted
3. Checks if invitation hasn't expired or been used
4. Employee fills in name, phone, password
5. Account is created and automatically approved
6. Employee can immediately log in

---

## Step 5: Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxcbpsjefpogxgfellui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for admin operations
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` is needed for the invitation validation API routes.

### Where to Find Service Role Key:

1. Supabase Dashboard → **Settings** → **API**
2. Copy the `service_role` key (under "Project API keys")
3. Add to `.env.local`

---

## Step 6: Disable Old Public Registration (If Exists)

The new signup page **only works with invitation tokens**. Anyone trying to access `/signup` without a token will see an error message.

### Optional: Remove Old Signup Components

If you want to clean up old code:

```bash
# Backup first
mv components/auth/SignupForm.tsx components/auth/SignupForm.tsx.backup
mv app/api/auth/signup/route.ts app/api/auth/signup/route.ts.backup
```

---

## User Roles Explained

| Role | Permissions |
|------|------------|
| **Admin** | Full access - can invite users, manage all data, approve accounts |
| **Manager** | Can invite users, view all data, limited editing |
| **Staff** | Standard employee access - can view and edit assigned data |
| **Viewer** | Read-only access - can view data but not edit |

---

## Testing the System

### Test Invitation Flow:

1. Create a test invitation (see Step 4)
2. Open the invitation link in private/incognito window
3. Fill in registration form
4. Submit and verify redirection to login
5. Log in with new credentials
6. Verify you can access dashboard

### Test Security:

1. Try accessing `/signup` without token → Should show error
2. Try using an unauthorized email domain → Should be rejected
3. Try using an expired invitation → Should be rejected
4. Try using an already-used invitation → Should be rejected

---

## Next Steps (Future Improvements)

These features can be added later:

1. **Admin Panel for Invitations** - UI to create/manage invitations
2. **Email Integration** - Automatically send invitation emails
3. **Two-Factor Authentication (2FA)** - SMS or authenticator app
4. **Audit Logging** - Track who invited whom and when
5. **Bulk Invite** - Upload CSV of employees to invite many at once
6. **Invitation Templates** - Pre-set invitation messages

---

## Troubleshooting

### "Invalid invitation" error
- Check that token matches exactly
- Verify invitation hasn't expired
- Confirm invitation `is_active = true`
- Ensure email matches invitation record

### "Email domain not authorized" error
- Verify domain is in `allowed_email_domains` table
- Check `is_active = true` for that domain
- Ensure email is typed correctly (lowercase)

### User can't log in after registration
- Verify `user_profiles` record was created
- Check `is_approved = true` in user_profiles
- Confirm email is verified in Supabase Auth

### API routes not working
- Verify `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- Check console for error messages
- Ensure database tables were created successfully

---

## Security Best Practices

1. **Never share service role key** - Keep it secret, don't commit to Git
2. **Set short expiration times** - 7 days max for invitations
3. **Audit regularly** - Check who has access periodically
4. **Use strong passwords** - Enforce 8+ characters minimum
5. **Monitor failed login attempts** - Watch for suspicious activity
6. **Revoke unused invitations** - Set `is_active = false` for old invitations

---

## Database Schema Reference

### `allowed_email_domains`
```sql
id UUID PRIMARY KEY
domain TEXT UNIQUE NOT NULL          -- e.g., "fedasil.be"
description TEXT                     -- Optional description
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP
created_by UUID REFERENCES auth.users(id)
```

### `invitations`
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL           -- Employee email
token TEXT UNIQUE NOT NULL           -- Random UUID for URL
role TEXT NOT NULL DEFAULT 'staff'
expires_at TIMESTAMP NOT NULL
created_at TIMESTAMP
created_by UUID REFERENCES auth.users(id)
used_at TIMESTAMP                    -- When invitation was used
used_by UUID REFERENCES auth.users(id)
is_active BOOLEAN DEFAULT true
```

### `user_profiles`
```sql
id UUID PRIMARY KEY                  -- References auth.users(id)
full_name TEXT
phone_number TEXT
role TEXT NOT NULL DEFAULT 'staff'
is_approved BOOLEAN DEFAULT false
approved_by UUID REFERENCES auth.users(id)
approved_at TIMESTAMP
invitation_id UUID REFERENCES invitations(id)
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## Support

If you encounter issues:

1. Check Supabase logs in Dashboard → **Logs** → **API Logs**
2. Check browser console for JavaScript errors
3. Verify all environment variables are set
4. Ensure database migrations ran successfully

---

**System implemented:** September 30, 2025
**Migration file:** `supabase/migrations/20250930_create_invitation_system.sql`
