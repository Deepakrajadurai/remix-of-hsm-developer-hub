# Comments Database Schema Fix

## Issue
Comments were not being added to the database due to a column name mismatch:
- **Error**: `Unknown column 'author_id' in 'field list'`
- **Root Cause**: Database table uses `user_id`, `user_name`, `user_avatar` but code was using `author_id`, `author_name`, `author_avatar`

## Database Schema (Actual)
```sql
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(255),
    user_avatar TEXT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT NOW()
)
```

## Changes Made

### Backend (`server/index.cjs`)

#### 1. Updated Table Creation (Line 886-899)
- Changed `author_id` → `user_id`
- Added `user_name VARCHAR(255)`
- Added `user_avatar TEXT`
- Updated foreign key to use `user_id`

#### 2. Updated GET Comments Query (Line 898-903)
- Simplified to `SELECT c.* FROM comments c`
- Removed JOIN with users/profiles (data is denormalized)

#### 3. Updated POST Comment (Line 920-940)
- Fetches user profile data before insert
- Inserts `user_id`, `user_name`, `user_avatar` into comments table
- Returns simple SELECT without JOINs

#### 4. Updated PUT Comment (Line 956-980)
- Changed authorization check: `author_id` → `user_id`
- Returns simple SELECT without JOINs

#### 5. Updated DELETE Comment (Line 987-1020)
- Changed authorization check: `author_id` → `user_id`
- Properly decrements post comment count

### Frontend (`src/pages/Community.tsx`)

#### Updated Comment Display (Lines 1202-1227)
- `comment.author_avatar` → `comment.user_avatar`
- `comment.author_name` → `comment.user_name`
- `comment.author_id` → `comment.user_id`
- Added fallback for missing user_name: `'Anonymous'`
- Added safe navigation for avatar fallback: `comment.user_name?.[0] || 'U'`

## Testing

### ✅ Add Comment
1. Navigate to community page
2. Click comment button on a post
3. Type "Test comment" and press Enter
4. **Expected**: Comment appears with your name and avatar

### ✅ Edit Comment
1. Find your comment
2. Click three-dot menu → Edit
3. Change text and click Save
4. **Expected**: Comment updates

### ✅ Delete Comment
1. Find your comment
2. Click three-dot menu → Delete
3. Confirm deletion
4. **Expected**: Comment disappears

## Database Verification

Check the comments table:
```sql
SELECT * FROM comments ORDER BY created_at DESC LIMIT 5;
```

You should see:
- `id` - UUID
- `post_id` - UUID of the post
- `user_id` - Your user UUID
- `user_name` - Your full name
- `user_avatar` - Your avatar URL
- `content` - Comment text
- `created_at` - Timestamp

## Files Modified
1. `server/index.cjs` - Fixed all comment queries
2. `src/pages/Community.tsx` - Updated field references

## Status
✅ **FIXED** - Comments now work correctly with the existing database schema
