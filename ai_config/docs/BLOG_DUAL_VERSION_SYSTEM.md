# Blog Dual-Version System Documentation

## Overview
The blog system now implements a **dual-version architecture** that separates draft content from published content, allowing authors to work on updates without affecting the live version that readers see.

## Database Schema

### Columns in `blogs` table:

**Draft Version (Working Copy)**
- `title` - Draft title (what the author is currently working on)
- `content` - Draft content
- `cover_image_url` - Draft cover image

**Published Version (Live/Frozen)**
- `published_title` - The title that readers see
- `published_content` - The content that readers see  
- `published_cover_image_url` - The cover image that readers see

**Control**
- `published` (BOOLEAN) - Controls visibility to public

## How It Works

### Creating a New Blog

**Scenario 1: Create as Draft** (`published = false`)
```javascript
{
  title: "My Draft Title",
  content: "Draft content...",
  published: false
}
```
Result:
- Draft columns are populated
- Published columns are `NULL`
- `published = FALSE`
- Only the author can see it

**Scenario 2: Publish Immediately** (`published = true`)
```javascript
{
  title: "My Published Title",
  content: "Published content...",
  published: true
}
```
Result:
- Draft columns are populated
- Published columns are populated with same content
- `published = TRUE`
- Everyone can see it

### Editing an Existing Blog

**Scenario 1: Save as Draft** (`published = false`)
- Updates ONLY the draft columns (`title`, `content`, `cover_image_url`)
- Published columns remain FROZEN
- `published` boolean stays as-is
- Readers continue to see the old published version
- Author sees the new draft version

**Scenario 2: Publish Changes** (`published = true`)
- Updates BOTH draft AND published columns
- Sets `published = TRUE`
- Syncs the live version with the current draft
- Readers now see the updated content

### Viewing a Blog

**As the Owner (Author)**
- Always sees the DRAFT version
- Can continue editing even if a published version exists
- Sees the latest changes immediately

**As a Public Reader**
- Only sees blogs where `published = TRUE`
- Sees the PUBLISHED version (frozen snapshot)
- Does NOT see draft changes until author clicks "Publish"

## Example Workflow

1. **Author creates a blog post and publishes it**
   - Draft: "Hello World v1"
   - Published: "Hello World v1"
   - Readers see: "Hello World v1"

2. **Author edits and saves as draft**
   - Draft: "Hello World v2 (with updates)"
   - Published: "Hello World v1" (unchanged)
   - Readers still see: "Hello World v1"
   - Author sees: "Hello World v2 (with updates)"

3. **Author clicks "Publish"**
   - Draft: "Hello World v2 (with updates)"
   - Published: "Hello World v2 (with updates)" (synced)
   - Readers now see: "Hello World v2 (with updates)"

## Benefits

✅ **Safe Editing**: Authors can work on updates without breaking the live version
✅ **Preview**: Authors can see exactly what they're working on
✅ **Controlled Publishing**: Changes only go live when explicitly published
✅ **Version History**: The published version acts as a stable snapshot

## API Endpoints

### POST /api/blogs
Creates a new blog post
- `published: true` → Creates and publishes immediately
- `published: false` → Creates as draft only

### PUT /api/blogs/:id
Updates an existing blog post
- `published: true` → Updates and publishes (syncs both versions)
- `published: false` → Updates draft only (published version stays frozen)

### GET /api/blogs/:id
Retrieves a blog post
- **Owner**: Gets draft version
- **Public**: Gets published version (or 404 if not published)

### GET /api/blogs
Lists all published blogs (public feed)
- Only returns blogs where `published = TRUE`
- Returns published versions
