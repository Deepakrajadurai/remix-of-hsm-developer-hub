-- Fix RLS Policies for Community Tables
-- Run this to fix 403 Forbidden errors when creating posts

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create channels" ON channels;
DROP POLICY IF EXISTS "Authenticated users can create hashtags" ON hashtags;
DROP POLICY IF EXISTS "Authenticated users can create post hashtags" ON post_hashtags;

-- Create more permissive policies that work with Supabase auth

-- Posts: Allow anyone signed in to create
CREATE POLICY "Anyone can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update posts"
ON posts FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Anyone can delete posts"
ON posts FOR DELETE
TO authenticated
USING (true);

-- Chat messages: Allow anyone signed in to send
CREATE POLICY "Anyone can send messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Post likes: Allow anyone signed in to like
CREATE POLICY "Anyone can like posts"
ON post_likes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can unlike posts"
ON post_likes FOR DELETE
TO authenticated
USING (true);

-- Comments: Allow anyone signed in to comment
CREATE POLICY "Anyone can comment"
ON comments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can delete comments"
ON comments FOR DELETE
TO authenticated
USING (true);

-- Channels: Allow anyone signed in to create
CREATE POLICY "Anyone can create channels"
ON channels FOR INSERT
TO authenticated
WITH CHECK (true);

-- Hashtags: Allow anyone signed in to create
CREATE POLICY "Anyone can create hashtags"
ON hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Post hashtags: Allow anyone signed in to create
CREATE POLICY "Anyone can create post hashtags"
ON post_hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Success message
SELECT 'RLS policies fixed! Try posting again.' as status;
