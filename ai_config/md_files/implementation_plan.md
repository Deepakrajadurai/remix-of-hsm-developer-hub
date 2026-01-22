# Migration Plan: Community Feature (Supabase -> MySQL)

## Goal
Migrate the Community features (Channels, Posts, Chat, Likes, Hashtags) from Supabase to the existing local MySQL database. The goal is to remove the dependency on Supabase for these features.

## User Review Required
> [!IMPORTANT]
> **Real-time functionality**: Supabase provided out-of-the-box real-time updates (WebSockets). Migrating to MySQL with Express means we lose this automatic capability.
> **Proposed Solution**: We will implement **polling** (fetching data every few seconds) for the Chat and Feed to simulate real-time updates. This is robust and simpler to implement without setting up a complex WebSocket server.

## Proposed Changes

### 1. Database Schema
We need to create the following tables in MySQL:
*   `channels`: Stores discussion channels (e.g., #general, #ai-news).
*   `posts`: Stores user posts/feeds.
*   `post_likes`: Stores likes on posts.
*   `chat_messages`: Stores live chat messages.
*   `hashtags`: Stores trending hashtags.
*   `post_hashtags`: Junction table linking posts to hashtags.

**Script**: Create `scripts/migrate_community_schema.cjs` to execute the SQL creation.

### 2. Backend API (`server/index.cjs`)
Implement the following endpoints:
*   `GET /api/community/channels`: List all channels.
*   `POST /api/community/channels`: Create a new channel.
*   `GET /api/community/posts`: Get feed posts (with pagination & hashtag filter).
*   `POST /api/community/posts`: Create a post (and extract hashtags).
*   `POST /api/community/posts/:id/like`: Like/Unlike toggle.
*   `GET /api/community/chat`: Get recent chat messages.
*   `POST /api/community/chat`: Send a message.
*   `GET /api/community/trending`: Get top hashtags.

### 3. Frontend Logic (`src/hooks/useCommunity.ts`)
*   **Remove Supabase Client**: Remove imports from `@/integrations/supabase/client`.
*   **Refactor `useCommunity`**:
    *   Replace `useEffect` subscription logic with `setInterval` polling (e.g., every 3s for chat, 10s for posts).
    *   Replace `supabase.from(...).select/insert` calls with `fetch('/api/community/...')`.
    *   Update types to match the MySQL response structure.

### 4. Cleanup
*   Remove direct Supabase calls from pages if any remain (most logic is in the hook).

## Verification Plan
### Automated Tests
*   Run the migration script to ensure tables are created without error.
*   Test each API endpoint using `curl` or Postman.

### Manual Verification
1.  **Channels**: Create a new channel -> specific column in DB.
2.  **Posting**: Create a post -> verify it appears in the feed.
3.  **Chat**: Send a message -> verify it appears for other users (simulated by a second tab).
4.  **Likes**: Like a post -> verify count updates.
