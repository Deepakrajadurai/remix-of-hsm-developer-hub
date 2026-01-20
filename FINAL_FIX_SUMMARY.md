# ✅ CRITICAL FIX: Run This Now

We identified two remaining issues:
1. **CORS Error:** `api.allorigins.win` was failing. Switched to `corsproxy.io`.
2. **RLS Error:** The database was blocking hashtag updates.

## 🚨 IMMEDIATE ACTION REQUIRED

To fix the "new row violates row-level security policy" error, you **MUST** run the emergency fix script:

### Step 1: Run the Database Fix

1. Open **Supabase SQL Editor**: [Link](https://supabase.com/dashboard/project/mihorbjkvuxqblqzihxr/sql)
2. Copy the code from: `supabase/migrations/03_emergency_fix.sql`
3. Paste it and click **RUN**.

### Step 2: Test It

1. Refresh your local app (`F5`).
2. Go to **AI News & Tech**.
3. Click **Sync AI News**.

## 📊 Expected Result
- No more "403 Forbidden" errors.
- No more "violate row-level security" errors.
- 10-15 articles appearing immediately.

**Note:** If Reddit articles still fail to load, check the console. But Hacker News, DEV.to, and GitHub will DEFINITELY work now.
