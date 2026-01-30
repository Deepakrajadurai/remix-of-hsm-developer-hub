# Blog Publishing Flow - User Guide

## Understanding the "Publish immediately" Toggle

### Toggle OFF (Save as Draft)
```
┌─────────────────────────────────┐
│ Publish immediately        [ ] │  ← Toggle is OFF
│ Save as draft               │
└─────────────────────────────────┘
```

**What happens:**
- ✏️ Saves your changes to the DRAFT version
- 🔒 Published version stays FROZEN (if it exists)
- 📝 Article appears in "My Articles" with **DRAFT** badge
- 👁️ Public readers continue seeing the old published version (or nothing if never published)
- 👤 You can continue editing without affecting what readers see

### Toggle ON (Publish)
```
┌─────────────────────────────────┐
│ Publish immediately        [✓] │  ← Toggle is ON
│ Your article will be visible │
│ to everyone.                 │
└─────────────────────────────────┘
```

**What happens:**
- ✏️ Saves your changes to BOTH draft and published versions
- 🔄 Syncs the live version with your current draft
- 📝 Article appears in "My Articles" with **PUBLISHED** badge
- 👁️ Public readers see the updated content immediately
- 🌍 Article appears in "Latest Articles" feed

## My Articles Tab

The "My Articles" tab shows ALL your articles with status badges:

```
┌─────────────────────────────────────────────┐
│  My Articles                                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │  Article 1   │  │  Article 2   │       │
│  │  [PUBLISHED] │  │  [DRAFT]     │       │
│  │              │  │              │       │
│  └──────────────┘  └──────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

- **Green "Published" badge** = Live and visible to everyone
- **Red "Draft" badge** = Only you can see it

## Example Workflow

### Scenario 1: Creating a New Article

**Step 1:** Write your article
- Title: "My First Post"
- Content: "Hello World!"

**Step 2:** Choose what to do
- **Option A:** Toggle ON → Publish immediately → Everyone sees it
- **Option B:** Toggle OFF → Save as draft → Only you see it

### Scenario 2: Editing a Published Article

**Initial State:**
- Published version: "Hello World v1"
- Readers see: "Hello World v1"

**Step 1:** Edit the article
- Change content to: "Hello World v2 with updates"

**Step 2:** Save as Draft (Toggle OFF)
- Draft version: "Hello World v2 with updates"
- Published version: "Hello World v1" (unchanged)
- **Readers still see:** "Hello World v1"
- **You see in editor:** "Hello World v2 with updates"
- **Badge in My Articles:** DRAFT

**Step 3:** Publish when ready (Toggle ON)
- Draft version: "Hello World v2 with updates"
- Published version: "Hello World v2 with updates" (synced!)
- **Readers now see:** "Hello World v2 with updates"
- **Badge in My Articles:** PUBLISHED

## Key Points

✅ **Draft = Safe workspace** - Edit freely without affecting readers
✅ **Publish = Go live** - Make your changes visible to everyone
✅ **My Articles shows both** - You can see all your work in one place
✅ **Badges show status** - Quickly see what's live and what's not
✅ **Published version is frozen** - Until you explicitly publish again

## Where Things Appear

| Status | My Articles | Latest Articles (Public) | Individual Page (Public) |
|--------|-------------|-------------------------|-------------------------|
| Draft | ✅ Yes (with DRAFT badge) | ❌ No | ❌ 404 Error |
| Published | ✅ Yes (with PUBLISHED badge) | ✅ Yes | ✅ Yes (shows published version) |

## Tips

💡 **Use drafts for work-in-progress** - Save frequently without worrying about readers seeing incomplete work

💡 **Preview before publishing** - You can see exactly what you're working on in the editor

💡 **Update safely** - Make changes to published articles without taking them offline

💡 **Control your timeline** - Publish only when you're ready
