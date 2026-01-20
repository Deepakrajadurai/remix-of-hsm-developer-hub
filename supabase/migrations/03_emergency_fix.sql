-- EMERGENCY FIX for Hashtags RLS Error
-- Run this script in Supabase SQL Editor to unblock news posting

-- 1. Reset Hashtags Policy
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hashtags_insert_policy" ON hashtags;
DROP POLICY IF EXISTS "hashtags_update_policy" ON hashtags;
DROP POLICY IF EXISTS "hashtags_select_policy" ON hashtags;
DROP POLICY IF EXISTS "Authenticated users can create hashtags" ON hashtags;
DROP POLICY IF EXISTS "Hashtags are viewable by everyone" ON hashtags;

-- Allow EVERYONE (public) to read hashtags
CREATE POLICY "hashtags_select_policy"
ON hashtags FOR SELECT
TO public
USING (true);

-- Allow Authenticated users to INSERT
CREATE POLICY "hashtags_insert_policy"
ON hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow Authenticated users to UPDATE (Critical for count increment)
CREATE POLICY "hashtags_update_policy"
ON hashtags FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Reset Post Hashtags Policy
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_hashtags_insert_policy" ON post_hashtags;
DROP POLICY IF EXISTS "post_hashtags_select_policy" ON post_hashtags;
DROP POLICY IF EXISTS "Post hashtags are viewable by everyone" ON post_hashtags;
DROP POLICY IF EXISTS "Authenticated users can create post hashtags" ON post_hashtags;

-- Allow EVERYONE to read junction table
CREATE POLICY "post_hashtags_select_policy"
ON post_hashtags FOR SELECT
TO public
USING (true);

-- Allow Authenticated users to INSERT into junction table
CREATE POLICY "post_hashtags_insert_policy"
ON post_hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Ensure Posts Policy is correct (Just in case)
DROP POLICY IF EXISTS "posts_insert_policy" ON posts;
CREATE POLICY "posts_insert_policy"
ON posts FOR INSERT
TO authenticated
WITH CHECK (true);
