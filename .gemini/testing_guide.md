# Community Features Testing Guide

## 🎯 Quick Test Checklist

### Before Testing
1. ✅ Make sure the development server is running (`npm run dev`)
2. ✅ Navigate to http://localhost:5173/community
3. ✅ Make sure you're logged in

---

## Test 1: Comments Edit & Delete

### Add a Comment
1. Click on any post's comment button (💬 icon)
2. Type a comment in the input field
3. Press Enter or click the Send button
4. ✅ **Expected**: Comment appears immediately below the post

### Edit Your Comment
1. Find a comment you wrote
2. Look for the three-dot menu (⋮) in the top-right of your comment
3. Click "Edit"
4. ✅ **Expected**: Comment changes to edit mode with textarea
5. Modify the text
6. Click "Save"
7. ✅ **Expected**: Comment updates with new text

### Delete Your Comment
1. Find a comment you wrote
2. Click the three-dot menu (⋮)
3. Click "Delete"
4. Confirm the deletion
5. ✅ **Expected**: Comment disappears and comment count decreases

### Verify Authorization
1. Look at comments from other users
2. ✅ **Expected**: No three-dot menu appears (you can't edit others' comments)

---

## Test 2: Channel Edit & Delete

### Create a Channel
1. In the left sidebar, click the "+" button next to "Channels"
2. Enter a channel name (e.g., "test-channel")
3. Click "Create Channel"
4. ✅ **Expected**: New channel appears in the list

### Edit Your Channel
1. Find a channel you created
2. Look for the three-dot menu (⋮) next to the channel name
3. Click "Edit Channel"
4. ✅ **Expected**: Edit dialog opens with name and description fields
5. Change the name or description
6. Click "Save Changes"
7. ✅ **Expected**: Channel updates and page refreshes

### Delete Your Channel
1. Find a channel you created
2. Click the three-dot menu (⋮)
3. Click "Delete Channel"
4. Confirm the deletion
5. ✅ **Expected**: Channel is removed and you're redirected to "general"

### Verify Authorization
1. Look at default channels (general, ai-news, tech-memes)
2. ✅ **Expected**: No three-dot menu appears (you didn't create them)

---

## Test 3: Report Function

### Report a Post
1. Find a post that's NOT yours
2. Click the three-dot menu (⋮) in the top-right of the post
3. Click "Report"
4. ✅ **Expected**: Report dialog opens
5. Select a reason (e.g., "Spam or misleading")
6. ✅ **Expected**: Toast notification says "Report Submitted"

### Verify Authorization
1. Look at your own posts
2. ✅ **Expected**: "Report" option should NOT appear in the dropdown

---

## Common Issues & Solutions

### Issue: "Authentication required" error
**Solution**: Make sure you're logged in. Check that localStorage has 'authToken'

### Issue: Edit/Delete buttons don't appear
**Solution**: 
- For comments: Make sure you're the comment author
- For channels: Make sure you created the channel
- Refresh the page to ensure user data is loaded

### Issue: "Failed to update/delete" error
**Solution**: 
- Check browser console for errors
- Verify the backend server is running
- Check that the token is valid

### Issue: Page doesn't update after edit
**Solution**: 
- For channels: Page should refresh automatically
- For comments: Should update in real-time
- If not, try refreshing manually

---

## Visual Indicators

### Comments
- **Three-dot menu (⋮)**: Appears in top-right of YOUR comments only
- **Edit mode**: Textarea with Save/Cancel buttons
- **Normal mode**: Gray background with author name and content

### Channels
- **Three-dot menu (⋮)**: Appears next to YOUR channels only
- **Edit dialog**: Modal with name and description inputs
- **Active channel**: Highlighted with secondary background

---

## Expected Behavior Summary

| Feature | User Action | Expected Result |
|---------|-------------|-----------------|
| Add Comment | Type + Send | Comment appears immediately |
| Edit Comment | Menu → Edit → Save | Comment updates in place |
| Delete Comment | Menu → Delete → Confirm | Comment removed, count decreases |
| Edit Channel | Menu → Edit → Save | Dialog closes, page refreshes |
| Delete Channel | Menu → Delete → Confirm | Redirect to general, page refreshes |
| Report Post | Menu → Report → Select reason | Toast notification appears |

---

## Screenshots to Take (Optional)

1. Comment with three-dot menu visible
2. Comment in edit mode
3. Channel with three-dot menu visible
4. Edit channel dialog
5. Report dialog
6. Success toast notifications

---

## If Everything Works ✅

You should be able to:
- ✅ Add, edit, and delete your own comments
- ✅ Edit and delete channels you created
- ✅ Report inappropriate posts
- ✅ See proper authorization (no edit/delete for others' content)
- ✅ Get clear feedback via toast notifications

---

## Next Steps After Testing

1. **If issues found**: Check browser console for errors
2. **If all works**: Features are ready for production!
3. **Optional improvements**:
   - Add comment reactions
   - Add nested replies
   - Add admin moderation panel
   - Add real-time updates via WebSocket

---

## Contact Points

- Backend API: http://localhost:3001/api/community/*
- Frontend: http://localhost:5173/community
- Database: MySQL (check server/index.cjs for connection details)

---

## Quick Debug Commands

```bash
# Check if server is running
curl http://localhost:3001/api/community/channels

# Check browser localStorage
localStorage.getItem('authToken')

# Check user info
localStorage.getItem('user')
```

---

Happy Testing! 🎉
