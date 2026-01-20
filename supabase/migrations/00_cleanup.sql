-- Clean up existing community tables and policies
-- Run this FIRST if you get "already exists" errors

-- Drop existing policies
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

DROP POLICY IF EXISTS "Hashtags are viewable by everyone" ON hashtags;
DROP POLICY IF EXISTS "Authenticated users can create hashtags" ON hashtags;

DROP POLICY IF EXISTS "Post hashtags are viewable by everyone" ON post_hashtags;
DROP POLICY IF EXISTS "Authenticated users can create post hashtags" ON post_hashtags;

DROP POLICY IF EXISTS "Channels are viewable by everyone" ON channels;
DROP POLICY IF EXISTS "Authenticated users can create channels" ON channels;

DROP POLICY IF EXISTS "Chat messages are viewable by everyone" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;

DROP POLICY IF EXISTS "Post likes are viewable by everyone" ON post_likes;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Drop existing triggers
DROP TRIGGER IF EXISTS post_likes_count_trigger ON post_likes;
DROP TRIGGER IF EXISTS comments_count_trigger ON comments;
DROP TRIGGER IF EXISTS extract_hashtags_trigger ON posts;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_post_likes_count();
DROP FUNCTION IF EXISTS update_comments_count();
DROP FUNCTION IF EXISTS extract_hashtags();

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS post_hashtags CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS hashtags CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS channels CASCADE;

-- Success message
SELECT 'Cleanup complete! Now run the main migration.' as status;
