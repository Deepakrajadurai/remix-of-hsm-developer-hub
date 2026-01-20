import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  channel_id: string;
  image_url: string | null;
  likes: number;
  comments_count: number;
  created_at: string;
  liked?: boolean;
  hashtags?: string[];
  is_system_post?: boolean;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  message: string;
  channel_id: string | null;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  type: string;
  description: string | null;
  created_by?: string;
  is_private?: boolean;
  is_system?: boolean;
}

export interface Hashtag {
  id: string;
  name: string;
  post_count: number;
}

export const useCommunity = (activeChannel: string = 'general') => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // Realtime subscriptions
  useEffect(() => {
    let postsChannel: RealtimeChannel;
    let chatChannel: RealtimeChannel;
    let presenceChannel: RealtimeChannel;

    const setupRealtime = async () => {
      // Subscribe to posts
      postsChannel = supabase
        .channel('posts-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'posts' },
          async (payload) => {
            const newPost = payload.new as Post;
            // Fetch hashtags for the new post
            const { data: hashtagData } = await supabase
              .from('post_hashtags')
              .select('hashtags(name)')
              .eq('post_id', newPost.id);

            newPost.hashtags = hashtagData?.map((h: any) => h.hashtags.name) || [];

            setPosts((current) => [newPost, ...current]);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'posts' },
          (payload) => {
            const updatedPost = payload.new as Post;
            setPosts((current) =>
              current.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post))
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'posts' },
          (payload) => {
            setPosts((current) => current.filter((post) => post.id !== payload.old.id));
          }
        )
        .subscribe();

      // Subscribe to chat messages
      chatChannel = supabase
        .channel('chat-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setChatMessages((current) => [...current, newMessage]);
          }
        )
        .subscribe();

      // Subscribe to presence for online users
      presenceChannel = supabase.channel('online-users', {
        config: { presence: { key: user?.id || 'anonymous' } },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          setOnlineUsers(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && user) {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupRealtime();

    return () => {
      postsChannel?.unsubscribe();
      chatChannel?.unsubscribe();
      presenceChannel?.unsubscribe();
    };
  }, [user]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch channels
      const { data: channelsData } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (channelsData) setChannels(channelsData);

      // Fetch posts with hashtags
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          post_hashtags(hashtags(name))
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsData) {
        const postsWithHashtags = postsData.map((post: any) => ({
          ...post,
          hashtags: post.post_hashtags?.map((ph: any) => ph.hashtags.name) || [],
        }));

        // Check which posts the user has liked
        if (user) {
          const { data: likesData } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);

          const likedPostIds = new Set(likesData?.map((l) => l.post_id) || []);

          setPosts(
            postsWithHashtags.map((post: Post) => ({
              ...post,
              liked: likedPostIds.has(post.id),
            }))
          );
        } else {
          setPosts(postsWithHashtags);
        }
      }

      // Fetch chat messages
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesData) setChatMessages(messagesData);

      // Fetch trending hashtags
      const { data: hashtagsData } = await supabase
        .from('hashtags')
        .select('*')
        .order('post_count', { ascending: false })
        .limit(10);

      if (hashtagsData) setTrendingHashtags(hashtagsData);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Create a new post
  const createPost = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to create posts',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        author_name: user.user_metadata?.full_name || 'Anonymous',
        author_avatar: user.user_metadata?.avatar_url || null,
        content,
        channel_id: activeChannel,
        image_url: imageUrl || null,
      });

      if (error) {
        toast({
          title: 'Error creating post',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Post published!',
          description: 'Your update is now live.',
        });
      }
    },
    [user, activeChannel, toast]
  );

  // Create a news post (appears from AI News Bot, not the user)
  const createNewsPost = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to sync news',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('posts').insert({
        author_id: null, // No specific author for news posts
        author_name: '🤖 AI News Bot',
        author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ainews',
        content,
        channel_id: activeChannel,
        image_url: imageUrl || null,
        is_system_post: true,
      });

      if (error) {
        console.error('Error creating news post:', error);
        throw error; // Let the caller handle the error
      }
    },
    [user, activeChannel, toast]
  );


  // Toggle like on a post
  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to like posts',
          variant: 'destructive',
        });
        return;
      }

      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.liked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (!error) {
          setPosts((current) =>
            current.map((p) =>
              p.id === postId ? { ...p, liked: false, likes: p.likes - 1 } : p
            )
          );
        }
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });

        if (!error) {
          setPosts((current) =>
            current.map((p) =>
              p.id === postId ? { ...p, liked: true, likes: p.likes + 1 } : p
            )
          );
        }
      }
    },
    [user, posts, toast]
  );

  // Send a chat message
  const sendMessage = useCallback(
    async (message: string) => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to send messages',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        user_name: user.user_metadata?.full_name?.split(' ')[0] || 'Anonymous',
        user_avatar: user.user_metadata?.avatar_url || null,
        message,
        channel_id: activeChannel,
      });

      if (error) {
        toast({
          title: 'Error sending message',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
    [user, activeChannel, toast]
  );

  // Create a new channel
  const createChannel = useCallback(
    async (name: string, type: string = 'text', description?: string) => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to create channels',
          variant: 'destructive',
        });
        return;
      }

      const id = name.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase.from('channels').insert({
        id,
        name,
        type,
        description: description || null,
        created_by: user.id,
      });

      if (error) {
        toast({
          title: 'Error creating channel',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Channel created!',
          description: `#${name} is ready.`,
        });
        // Refresh channels
        const { data } = await supabase.from('channels').select('*');
        if (data) setChannels(data);
      }
    },
    [user, toast]
  );

  // Delete Channel
  const deleteChannel = useCallback(
    async (channelId: string) => {
      if (!user) return;
      const { error } = await supabase.from('channels').delete().eq('id', channelId);
      if (error) {
        toast({ title: 'Error', description: 'Failed to delete channel', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Channel deleted' });
        // Optimistic update
        setChannels(prev => prev.filter(c => c.id !== channelId));
      }
    },
    [user, toast]
  );

  // Update Channel (Rename)
  const updateChannel = useCallback(
    async (channelId: string, newName: string) => {
      if (!user) return;
      const { error } = await supabase.from('channels').update({ name: newName }).eq('id', channelId);
      if (error) {
        toast({ title: 'Error', description: 'Failed to update channel', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Channel updated' });
        // Optimistic update
        setChannels(prev => prev.map(c => c.id === channelId ? { ...c, name: newName } : c));
      }
    },
    [user, toast]
  );

  // Filter posts by channel
  const filteredPosts = posts.filter((post) =>
    activeChannel === 'general' ? true : post.channel_id === activeChannel
  );

  return {
    posts: filteredPosts,
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
    deleteChannel,
    updateChannel
  };
};
