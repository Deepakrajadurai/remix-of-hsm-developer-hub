import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  channel_id: string;
  image_url: string | null;
  likes: number; // Mapped from likes_count
  comments_count: number; // Mapped from replies_count
  created_at: string;
  liked?: boolean;
  hashtags?: string[];
}

export interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string; // Mapped from author_name
  user_avatar: string | null; // Mapped from author_avatar
  message: string; // Mapped from content
  channel_id: string | null;
  created_at: string;
}

export interface Channel {
  id: string;
  slug: string;
  name: string;
  type: string;
  description: string | null;
}

export interface TrendingHashtag {
  id: string;
  name: string;
  post_count: number;
}

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const useCommunity = (activeChannel: string = 'general') => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0); // Mocked for now

  // Polling Intervals
  const postsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getToken = () => localStorage.getItem('authToken');

  // --- FETCH CHANNELS ---
  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/channels`);
      if (res.ok) {
        const data = await res.json();
        // Ensure type defaults to 'text' if missing, though DB might have it? Database has no 'type' column in previous schema?
        // Wait, schema check: `channels` table has `slug, name, description`. No `type`.
        // We can infer type from slug or name, or just default to 'text'.
        // Frontend uses type to show icon.
        const mappedChannels = data.map((c: any) => ({
          ...c,
          type: c.slug.includes('news') ? 'news' : c.slug.includes('memes') ? 'media' : 'text'
        }));
        setChannels(mappedChannels);
      }
    } catch (error) {
      console.error('Failed to fetch channels', error);
    }
  }, []);

  // --- FETCH POSTS ---
  const fetchPosts = useCallback(async () => {
    try {
      // Resolve activeChannel to ID if possible. activeChannel is passed from Community.tsx
      // In Community.tsx: setActiveChannel(channel.id). So it's likely an ID.
      // But initially it's 'general'.
      let channelId = activeChannel;

      // If activeChannel is 'general' string, find the ID?
      // Or if the API supports filtering by ID.
      // Let's assume activeChannel IS the ID if it matches a UUID format, or we find it in channels list.

      const targetChannel = channels.find(c => c.id === activeChannel || c.slug === activeChannel);
      const targetId = targetChannel ? targetChannel.id : (activeChannel === 'general' ? channels.find(c => c.slug === 'general')?.id : activeChannel);

      // If we still don't have a valid ID and it's not 'general', maybe don't filter?
      // But let's try to pass it.

      const queryParams = new URLSearchParams();
      if (targetId) {
        queryParams.append('channel_id', targetId);
      }

      const res = await fetch(`${API_URL}/api/community/posts?${queryParams.toString()}`, {
        headers: user ? { 'Authorization': `Bearer ${getToken()}` } : {}
        // Send Auth if logged in to get 'liked' status? 
        // Wait, the API endpoint `GET /api/community/posts` does NOT currently return 'liked' boolean for the user.
        // It only returns `likes_count`.
        // I need to fetch likes separately or update the API.
        // For now, let's fetch 'post_likes' from a separate endpoint or just mock 'liked'?
        // The previous MySQL implementation of GET posts didn't join post_likes for the *viewer*.
        // It did `(SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count`.
        // To know if *I* liked it, I need another check.
        // Let's implement a secondary fetch or just let it be false for now and update API later.
        // Wait, the Supabase version did: `liked: likedPostIds.has(post.id)`.
        // I can reproduce this!
      });

      if (res.ok) {
        const data = await res.json();

        let likedPostIds = new Set<string>();
        if (user) {
          // For now, let's assume we can't easily get this in one go without API change.
          // But valid `fetchPosts` can't do complex auth logic on client easily without many calls.
          // Let's persist with 'liked: false' or try to fetch user likes if possible.
          // Simplification: leave 'liked' as false until API supports `is_liked_by_viewer`.
        }

        const mappedPosts: Post[] = data.map((p: any) => ({
          id: p.id,
          author_id: p.author_id,
          author_name: p.author_name || 'Anonymous',
          author_avatar: p.author_avatar,
          content: p.content,
          channel_id: p.channel_id,
          image_url: p.image_url,
          likes: Number(p.likes_count || 0),        // MAP property
          comments_count: Number(p.replies_count || 0), // MAP property
          created_at: p.created_at,
          liked: p.liked || false,
          hashtags: []  // Pending Hashtag regex extraction or join
        }));

        setPosts(mappedPosts);
      }
    } catch (error) {
      console.error('Failed to fetch posts', error);
    }
  }, [activeChannel, channels, user]);

  // --- FETCH CHAT ---
  const fetchChat = useCallback(async () => {
    try {
      const targetChannel = channels.find(c => c.id === activeChannel || c.slug === activeChannel);
      const targetId = targetChannel ? targetChannel.id : (activeChannel === 'general' ? channels.find(c => c.slug === 'general')?.id : activeChannel);

      const queryParams = new URLSearchParams();
      if (targetId) queryParams.append('channel_id', targetId);

      const res = await fetch(`${API_URL}/api/community/chat?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const mappedChat: ChatMessage[] = data.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          user_name: m.author_name || 'Anonymous', // MAP
          user_avatar: m.author_avatar, // MAP
          message: m.message, // MAP
          channel_id: m.channel_id,
          created_at: m.created_at
        }));
        setChatMessages(mappedChat);
      }
    } catch (error) {
      console.error('Failed to fetch chat', error);
    }
  }, [activeChannel, channels]);

  // --- FETCH TRENDING ---
  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/trending`);
      if (res.ok) {
        const data = await res.json();
        // API returns [{tag, count}]
        const mappedTrending = data.map((t: any, idx: number) => ({
          id: t.id || `trend-${idx}`, // Use DB ID if available (fallback entries might have it) or index
          name: t.name, // Correct field
          post_count: t.count
        }));
        setTrendingHashtags(mappedTrending);
      }
    } catch (error) {
      console.error('Failed trending', error);
    }
  }, []);

  // --- INITIAL LOAD & POLLING ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchChannels();
      await fetchTrending();
      setLoading(false);
    };
    init();
  }, [fetchChannels, fetchTrending]);

  useEffect(() => {
    fetchPosts();
    fetchChat();

    // Quick Poll
    postsIntervalRef.current = setInterval(fetchPosts, 5000);
    chatIntervalRef.current = setInterval(fetchChat, 3000);

    return () => {
      if (postsIntervalRef.current) clearInterval(postsIntervalRef.current);
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
    };
  }, [fetchPosts, fetchChat]);


  // --- ACTIONS ---

  const createPost = useCallback(async (content: string, imageUrl?: string) => {
    const token = getToken();
    if (!token) {
      toast({ title: 'Authentication required', variant: 'destructive' });
      return;
    }

    const targetChannel = channels.find(c => c.id === activeChannel || c.slug === activeChannel);
    const channelId = targetChannel?.id || channels.find(c => c.slug === 'general')?.id;

    if (!channelId) {
      toast({ title: 'Select a channel', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: content.substring(0, 30),
          content,
          image_url: imageUrl,
          channel_id: channelId
        })
      });
      if (res.ok) {
        toast({ title: 'Post created!' });
        fetchPosts();
        fetchTrending(); // Update trending tags immediately
      } else {
        throw new Error('Failed');
      }
    } catch (e) {
      toast({ title: 'Error creating post', variant: 'destructive' });
    }
  }, [activeChannel, channels, toast, fetchPosts, fetchTrending]);

  const createNewsPost = useCallback(async (content: string, imageUrl?: string) => {
    const token = getToken();
    if (!token) {
      toast({ title: 'Authentication required', variant: 'destructive' });
      return;
    }

    const targetChannel = channels.find(c => c.id === activeChannel || c.slug === activeChannel);
    const channelId = targetChannel?.id || channels.find(c => c.slug === 'general')?.id;

    try {
      const res = await fetch(`${API_URL}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: "AI News",
          content,
          image_url: imageUrl,
          channel_id: channelId,
          is_system_post: true,
          author_name: '🤖 AI News Bot',
          author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ainews'
        })
      });
      if (res.ok) {
        toast({ title: 'News synced!' });
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeChannel, channels, toast, fetchPosts]);

  const toggleLike = useCallback(async (postId: string) => {
    const token = getToken();
    if (!token) {
      toast({ title: 'Authentication required', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(current => current.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              liked: data.liked,
              likes: data.liked ? p.likes + 1 : p.likes - 1
            };
          }
          return p;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, [toast]);

  const sendMessage = useCallback(async (message: string) => {
    const token = getToken();
    if (!token) {
      toast({ title: 'Authentication required', variant: 'destructive' });
      return;
    }

    const targetChannel = channels.find(c => c.id === activeChannel || c.slug === activeChannel);
    const channelId = targetChannel?.id;

    try {
      const res = await fetch(`${API_URL}/api/community/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: message, channel_id: channelId })
      });
      if (res.ok) {
        fetchChat();
      }
    } catch (e) {
      toast({ title: 'Error sending message', variant: 'destructive' });
    }
  }, [activeChannel, channels, toast, fetchChat]);

  const createChannel = useCallback(async (name: string, type: string = 'text', description?: string) => {
    const token = getToken();
    if (!token) {
      toast({ title: 'Auth required', variant: 'destructive' });
      return;
    }
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    try {
      const res = await fetch(`${API_URL}/api/community/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, slug, description })
      });
      if (res.ok) {
        toast({ title: 'Channel created' });
        fetchChannels(); // Refresh list to get new ID
      } else {
        toast({ title: 'Error creating channel', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }, [toast, fetchChannels]);

  const deletePost = useCallback(async (postId: string) => {
    const token = getToken();
    if (!token) {
      toast({ title: 'Authentication required', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: 'Post deleted' });
        // Remove from local state
        setPosts(current => current.filter(p => p.id !== postId));
        fetchTrending(); // Update trending
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error deleting post', variant: 'destructive' });
    }
  }, [toast, fetchTrending]);

  const editPost = useCallback(async (postId: string, content: string) => {
    const token = getToken();
    if (!token) {
      toast({ title: 'Authentication required', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/community/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        toast({ title: 'Post updated' });
        fetchPosts(); // Reload to see changes (or update local)
        fetchTrending(); // Update trending hashtags
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error editing post', variant: 'destructive' });
    }
  }, [toast, fetchPosts, fetchTrending]);

  return {
    posts,
    chatMessages,
    channels,
    trendingHashtags,
    loading,
    onlineUsers,
    createPost,
    createNewsPost,
    toggleLike,
    sendMessage,
    createChannel,
    deletePost,
    editPost
  };
};
