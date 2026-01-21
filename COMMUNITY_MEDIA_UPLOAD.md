# Community Media Upload Feature

## ✨ What's New

The Community section now supports **direct file uploads** for images, videos, and GIFs instead of just URL inputs!

## 📦 Features Added

### 1. **File Upload Support**
- Upload images (JPEG, PNG, GIF, WebP)
- Upload videos (MP4, WebM)
- Maximum file size: 10MB
- Files are stored in Supabase Storage

### 2. **Enhanced UI**
- File picker with drag-and-drop support
- Live upload progress indicator
- Preview of selected media before posting
- Option to use URL or upload file

### 3. **Validation**
- File type validation
- File size validation (max 10MB)
- User-friendly error messages

## 🚀 Setup Instructions

### 1. Run the Migration
Execute the new migration to create the storage bucket:

```bash
# Option 1: Via Supabase Dashboard
# Go to SQL Editor and paste the contents of:
# supabase/migrations/09_community_media_storage.sql

# Option 2: Via CLI (if using local dev)
npx supabase db push
```

### 2. Verify Storage Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. You should see a new bucket called `community-media`
4. It should be marked as **Public**

## 🎯 How to Use

### For Users:
1. Go to the Community page
2. Click the **"Media"** button when creating a post
3. Choose to either:
   - **Upload a file** using the file picker
   - **Paste a URL** in the input field
4. See a preview of your media
5. Click **"Post"** to share

### Upload Process:
- Select a file → Preview appears
- Click "Post" → File uploads to Supabase Storage
- Progress bar shows upload status
- Once complete, post is created with the uploaded media URL

## 🔒 Security

The storage bucket has Row Level Security (RLS) policies:
- ✅ Authenticated users can upload files
- ✅ Everyone can view files (public bucket)
- ✅ Users can only delete their own uploads

## 📁 File Organization

Files are organized by user:
```
community-media/
  └── {user_id}/
      ├── 1234567890.jpg
      ├── 1234567891.mp4
      └── 1234567892.gif
```

## 🐛 Troubleshooting

### "Upload Failed" Error
- Check that the migration has been run
- Verify the `community-media` bucket exists
- Ensure you're logged in

### File Too Large
- Maximum size is 10MB
- Compress images/videos before uploading

### Invalid File Type
- Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM) are supported
