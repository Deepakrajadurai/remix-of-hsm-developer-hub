# Community Features Fixes - Implementation Plan

## Issues Identified

### 1. Token Storage Inconsistency ❌
**Problem**: Mixed usage of `localStorage.getItem('token')` and `localStorage.getItem('authToken')`
**Location**: `src/pages/Community.tsx` lines 269, 369, 401, 437
**Impact**: Report, comments, and channel edit/delete features fail due to missing auth token
**Fix**: Change all instances to use `'authToken'` consistently

### 2. Comments Edit/Delete Missing ❌
**Problem**: No edit or delete functionality for comments
**Location**: Comments display section (lines 1057-1073)
**Impact**: Users cannot edit or delete their own comments
**Fix**: 
- Add backend API endpoints for comment edit/delete
- Add dropdown menu to each comment for author
- Implement edit and delete handlers

### 3. Channel Edit/Delete UI Missing ❌
**Problem**: No UI controls for channel creators to edit/delete their channels
**Location**: Channel list (lines 737-749)
**Impact**: Even though backend exists, users cannot access edit/delete functionality
**Fix**: Add dropdown menu to each channel for the creator/admin

## Implementation Steps

### Step 1: Fix Token Inconsistency
Replace all `localStorage.getItem('token')` with `localStorage.getItem('authToken')` in:
- Line 269 (submitReport)
- Line 369 (submitComment)
- Line 401 (handleEditChannel)
- Line 437 (handleDeleteChannel)

### Step 2: Add Comment Edit/Delete Backend
Add to `server/index.cjs`:
- `PUT /api/community/comments/:commentId` - Edit comment
- `DELETE /api/community/comments/:commentId` - Delete comment

### Step 3: Add Comment Edit/Delete Frontend
In `src/pages/Community.tsx`:
- Add state for editing comments
- Add dropdown menu to each comment
- Add edit and delete handlers
- Update comment display to show edit/delete options for comment author

### Step 4: Add Channel Edit/Delete UI
In `src/pages/Community.tsx`:
- Add dropdown menu to each channel item
- Show edit/delete options only for channel creator or admin
- Add edit channel dialog
- Connect to existing backend handlers

## Files to Modify

1. **server/index.cjs** - Add comment edit/delete endpoints
2. **src/pages/Community.tsx** - Fix token keys, add UI for comments and channels
