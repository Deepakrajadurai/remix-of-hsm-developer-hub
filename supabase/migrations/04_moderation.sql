-- MODERATION SYSTEM SETUP
-- 1. Create table for storing reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id), -- Optional: track who reported
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add moderation flags to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- 3. Enable RLS on reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create reports
CREATE POLICY "Authenticated users can submit reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only admins/moderators should view reports (Using a placeholder check or just service role for now)
-- For now, we won't allow public select.

-- 4. Update Posts Visibility Logic
-- Filter out hidden posts for everyone
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;

CREATE POLICY "Public posts are viewable by everyone"
ON posts FOR SELECT
USING (is_hidden = false);

-- 5. Trigger to Auto-Hide posts with many reports (Optional but requested "how to restrict")
CREATE OR REPLACE FUNCTION increment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment report count on the post
  UPDATE posts
  SET report_count = report_count + 1,
      is_hidden = CASE WHEN (report_count + 1) >= 5 THEN true ELSE is_hidden END -- Auto-hide after 5 reports
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_report_created ON reports;
CREATE TRIGGER on_report_created
AFTER INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION increment_report_count();
