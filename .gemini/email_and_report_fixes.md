# Email & Report Dialog Fixes

## Status Update

### ✅ Email System is Working!

I ran the test email script and it successfully sent an email. The SMTP configuration is correct.

**Test Results:**
```
✅ SMTP connection verified!
✅ Email sent successfully!
📬 Check your inbox at: fh.developercommunity@gmail.com
```

### Why You Might Not See Emails

1. **Check Spam Folder** - Gmail might filter automated emails
2. **Check "All Mail"** - Sometimes emails bypass inbox
3. **Search for "HSM Developer Hub"** - Use Gmail search
4. **Check Promotions Tab** - If you have tabs enabled

### Email Verification

Run this command to test:
```bash
node test-email.cjs
```

You should receive a test email within seconds.

## Report Dialog - "Other" Option Textarea

### Current Issue
When user selects "Other" as the report reason, there's no textarea to provide additional details.

### Solution Needed

The report dialog needs to be updated to show a textarea when "Other" is selected:

```tsx
{/* Report Dialog - Needs to be added/updated */}
<Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Report Post</DialogTitle>
      <DialogDescription>
        Help us understand what's wrong with this post.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Reason Selection */}
      <div className="space-y-2">
        <Label>Reason</Label>
        <RadioGroup value={reportReason} onValueChange={setReportReason}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Spam or misleading" id="spam" />
            <Label htmlFor="spam">Spam or misleading</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Harassment or hate speech" id="harassment" />
            <Label htmlFor="harassment">Harassment or hate speech</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Inappropriate content" id="inappropriate" />
            <Label htmlFor="inappropriate">Inappropriate content</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Other" id="other" />
            <Label htmlFor="other">Other</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Conditional Textarea for "Other" */}
      {reportReason === 'Other' && (
        <div className="space-y-2">
          <Label htmlFor="custom-reason">Please provide more details *</Label>
          <Textarea
            id="custom-reason"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Describe the issue..."
            className="min-h-[100px]"
            required
          />
          <p className="text-xs text-muted-foreground">
            Please explain why you're reporting this post
          </p>
        </div>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => {
        setReportDialogOpen(false);
        setReportReason('');
        setCustomReason('');
      }}>
        Cancel
      </Button>
      <Button 
        onClick={submitReport}
        disabled={!reportReason || (reportReason === 'Other' && !customReason.trim())}
        className="bg-destructive hover:bg-destructive/90"
      >
        <Flag className="h-4 w-4 mr-2" />
        Submit Report
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Key Features

1. **Conditional Rendering:**
   ```tsx
   {reportReason === 'Other' && (
     <Textarea ... />
   )}
   ```

2. **Validation:**
   ```tsx
   disabled={!reportReason || (reportReason === 'Other' && !customReason.trim())}
   ```

3. **Required Indicator:**
   - Shows asterisk (*) when "Other" is selected
   - Helper text explains requirement

### State Variables Needed

```typescript
const [reportDialogOpen, setReportDialogOpen] = useState(false);
const [reportPostId, setReportPostId] = useState<string | null>(null);
const [reportReason, setReportReason] = useState('');
const [customReason, setCustomReason] = useState('');
```

### Submit Handler

```typescript
const submitReport = async () => {
  if (!reportPostId || !reportReason) return;
  
  // Validate "Other" requires custom reason
  if (reportReason === 'Other' && !customReason.trim()) {
    toast({
      title: "Additional details required",
      description: "Please provide more information about your report.",
      variant: "destructive"
    });
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/community/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        post_id: reportPostId,
        reason: reportReason,
        custom_reason: reportReason === 'Other' ? customReason : null
      })
    });

    if (response.ok) {
      toast({
        title: "Report Submitted",
        description: "Thank you. Our team will review this report shortly."
      });
      
      // Reset and close
      setReportDialogOpen(false);
      setReportReason('');
      setCustomReason('');
      setReportPostId(null);
    } else {
      throw new Error('Failed to submit report');
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to submit report. Please try again.",
      variant: "destructive"
    });
  }
};
```

### Where to Add Report Button

In the post dropdown menu (three dots):

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {/* Existing items (Edit, Delete for post author) */}
    
    {/* Report option for all users */}
    <DropdownMenuSeparator />
    <DropdownMenuItem 
      onClick={() => {
        setReportPostId(post.id);
        setReportDialogOpen(true);
      }}
      className="text-destructive"
    >
      <Flag className="h-4 w-4 mr-2" />
      Report
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Testing Checklist

### Email Testing
- [x] SMTP configuration verified
- [x] Test email sent successfully
- [ ] Check inbox for test email
- [ ] Check spam folder
- [ ] Submit actual report and verify email

### Report Dialog Testing
- [ ] Dialog opens when clicking "Report"
- [ ] Can select different reasons
- [ ] Textarea appears when "Other" is selected
- [ ] Textarea is hidden for other reasons
- [ ] Submit button disabled when "Other" selected but no details
- [ ] Submit button enabled when all required fields filled
- [ ] Success toast appears on submit
- [ ] Dialog closes after successful submit
- [ ] Email received with report details

## Next Steps

1. **Verify Email Receipt:**
   - Check `fh.developercommunity@gmail.com` inbox
   - Check spam folder
   - Search for "HSM Developer Hub"

2. **Add Textarea to Report Dialog:**
   - Update the report dialog component
   - Add conditional rendering for "Other" option
   - Add validation for custom reason

3. **Test Complete Flow:**
   - Submit report with predefined reason
   - Submit report with "Other" + custom reason
   - Verify both emails are received
   - Check database for report entries

## Files to Modify

### Frontend (To Add Textarea)
- `src/pages/Community.tsx` or wherever the report dialog is defined
  - Add `customReason` state
  - Add conditional Textarea
  - Update submit validation
  - Update submit handler

### Backend (Already Complete)
- ✅ `server/index.cjs` - Report endpoint with email
- ✅ `test-email.cjs` - Email testing script
- ✅ Email transporter configured

## Database Query

Check if reports are being saved:
```sql
SELECT r.*, 
       u.email as reporter_email,
       pr.full_name as reporter_name
FROM reports r
JOIN users u ON r.reporter_id = u.id
LEFT JOIN profiles pr ON u.id = pr.user_id
ORDER BY r.created_at DESC
LIMIT 5;
```

## Email Troubleshooting

If you still don't receive emails:

1. **Run test script:**
   ```bash
   node test-email.cjs
   ```

2. **Check server console** when submitting report:
   ```
   📧 Attempting to send report email...
   ✅ Report email sent successfully!
   ```

3. **Check Gmail settings:**
   - Filters
   - Forwarding
   - POP/IMAP settings

4. **Try different email:**
   - Update `SMTP_USER` to different Gmail account
   - Test with that account

## Success Indicators

When everything works:

✅ Test email received
✅ Report dialog shows textarea for "Other"
✅ Submit button validates correctly
✅ Report saved to database
✅ Email sent to admin
✅ Toast notification shown
✅ Dialog closes after submit

## Current Status

- ✅ Backend API complete
- ✅ Email system working
- ✅ Test script created
- ⏳ Frontend textarea for "Other" - needs implementation
- ⏳ Email receipt verification - check inbox
