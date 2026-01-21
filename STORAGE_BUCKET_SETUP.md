# Storage Bucket Setup Guide

## The Issue
You're getting a **400 Bad Request** when trying to access uploaded images because the `community-media` storage bucket doesn't exist yet.

## Quick Fix (Via Dashboard - Recommended)

### Step 1: Create the Bucket
1. Go to your **Supabase Dashboard**
2. Click **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter bucket name: `community-media`
5. **Check "Public bucket"** ✅
6. Click **"Create bucket"**

### Step 2: Set Up Policies (Optional - already handled if public)
If you created a public bucket, you're done! If not, add these policies:

1. Go to **Storage** → Click on `community-media` bucket → **Policies** tab
2. Click **"New Policy"**
3. Add these 3 policies:

**Policy 1: Allow Upload**
- Name: `Authenticated users can upload`
- Operation: `INSERT`
- Target roles: `authenticated`
- Policy definition:
  ```sql
  bucket_id = 'community-media'
  ```

**Policy 2: Allow Public Read**
- Name: `Public can view`
- Operation: `SELECT`
- Target roles: `public`
- Policy definition:
  ```sql
  bucket_id = 'community-media'
  ```

**Policy 3: Allow Delete Own Files**
- Name: `Users can delete own files`
- Operation: `DELETE`
- Target roles: `authenticated`
- Policy definition:
  ```sql
  bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

## Alternative: SQL Migration

If you prefer SQL, run this in **SQL Editor**:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-media', 'community-media', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-media');

CREATE POLICY IF NOT EXISTS "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-media');

CREATE POLICY IF NOT EXISTS "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Verify It Works

1. Go to **Storage** → `community-media`
2. Try manually uploading a test image
3. If you can upload and see the image, it's working!
4. Go back to your app and try posting with an image

## Troubleshooting

### Still getting 400?
- Make sure the bucket is marked as **Public**
- Check that RLS is enabled on `storage.objects`
- Verify policies are created correctly

### Can upload but can't view?
- The bucket needs to be **Public**
- Or you need the "Public can view" policy

### Upload fails?
- Make sure you're logged in
- Check the "Authenticated users can upload" policy exists
