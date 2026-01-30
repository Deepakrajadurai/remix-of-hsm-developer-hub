-- Add published version columns to blogs table
-- These columns store the "live" version that readers see
-- while the main columns (title, content, cover_image_url) store the draft version

ALTER TABLE blogs 
ADD COLUMN IF NOT EXISTS published_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS published_content TEXT,
ADD COLUMN IF NOT EXISTS published_cover_image_url TEXT;

-- For existing published blogs, copy current data to published columns
UPDATE blogs 
SET 
    published_title = title,
    published_content = content,
    published_cover_image_url = cover_image_url
WHERE published = TRUE AND published_title IS NULL;
