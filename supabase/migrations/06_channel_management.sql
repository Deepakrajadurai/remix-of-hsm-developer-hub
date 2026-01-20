-- CHANNEL MANAGEMENT
-- 1. Add columns for privacy and system protection
ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- 2. RLS Policies
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all channels (for now, to avoid breaking feed)
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON channels;
CREATE POLICY "Public channels are viewable by everyone"
ON channels FOR SELECT
USING (true);

-- Allow authenticated creation
DROP POLICY IF EXISTS "Authenticated users can create channels" ON channels;
CREATE POLICY "Authenticated users can create channels"
ON channels FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow owners to update their channels
DROP POLICY IF EXISTS "Users can update own channels" ON channels;
CREATE POLICY "Users can update own channels"
ON channels FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Allow owners to delete their channels (protected system channels cannot be deleted)
DROP POLICY IF EXISTS "Users can delete own channels" ON channels;
CREATE POLICY "Users can delete own channels"
ON channels FOR DELETE
TO authenticated
USING (auth.uid() = created_by AND is_system = false);

-- 3. Initial Data Fixes (Optional)
-- Mark 'ai-news' and 'general' as system if they exist
UPDATE channels SET is_system = true WHERE id IN ('ai-news', 'general', 'announcements');
