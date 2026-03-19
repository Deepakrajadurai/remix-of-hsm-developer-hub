import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, Users, TrendingUp, ExternalLink, Hash, Star,
  Image as ImageIcon, Send, Plus, Video, Radio, Newspaper,
  Share2, Heart, MessageCircle, MoreHorizontal, Search, RefreshCw, Loader2,
  Trash2, Edit2, Flag, Copy, Twitter, Facebook, Linkedin, MoreVertical, Pencil, User, Link
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Assuming it exists, or use Input
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCommunity, Post, ChatMessage } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import { fetchAITechNews, formatNewsForPost } from '@/services/newsService';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [activeChannel, setActiveChannel] = useState('general');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  // Edit/Delete/Comment State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [commentingPost, setCommentingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 8;

  // Category Filter State
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ai-news' | 'community' | 'my-posts'>('all');

  // Hashtag Autocomplete
  const [hashtagSuggestions, setHashtagSuggestions] = useState<{ name: string; count: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionCursorIndex, setSuggestionCursorIndex] = useState(0);

  // Create Channel State
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');

  // Report State
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showCustomReasonInput, setShowCustomReasonInput] = useState(false);


  // Share State
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  // Comments State
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Channel Edit State
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelDialogOpen, setEditChannelDialogOpen] = useState(false);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');

  // Channel Delete State
  const [activeDeleteChannelId, setActiveDeleteChannelId] = useState<string | null>(null);
  const [deleteChannelDialogOpen, setDeleteChannelDialogOpen] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const postInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Upload immediately
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Authentication required", description: "Please log in to upload images.", variant: "destructive" });
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setNewPostImage(data.url);
        } else {
          console.error("Upload failed");
          toast({ title: "Upload failed", variant: "destructive" });
        }
      } catch (error) {
        console.error("Upload error", error);
        toast({ title: "Upload error", variant: "destructive" });
      }
    }
  };

  const onMediaClick = () => {
    fileInputRef.current?.click();
  };

  // Use the real-time community hook
  const {
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
  } = useCommunity(activeChannel);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    await createPost(newPostContent, newPostImage || undefined);
    setNewPostContent('');
    setNewPostImage('');
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    await createChannel(newChannelName, newChannelType, newChannelDescription);
    setNewChannelName('');
    setNewChannelDescription('');
    setNewChannelType('text');
    setIsCreateChannelOpen(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like posts.",
        variant: "destructive"
      });
      return;
    }
    await toggleLike(postId);
  };

  const handleCommentClick = (post: Post) => {
    setCommentingPost(post);
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/community/post/${postId}`);
    toast({
      title: "Shared!",
      description: "Post link copied to clipboard.",
    });
  };

  const handleProfileClick = (authorId: string, authorName: string) => {
    if (authorId === user?.id) {
      navigate('/profile');
    } else {
      toast({
        title: `${authorName}'s Profile`,
        description: `Viewing profile for ${authorName}. (Full profiles coming soon!)`,
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
    setChatInput('');
  };

  const handleHashtagClick = (hashtag: string) => {
    setSelectedHashtag(selectedHashtag === hashtag ? null : hashtag);
  };

  // Edit/Delete Handlers
  const confirmDelete = async () => {
    if (deletingPostId) {
      await deletePost(deletingPostId);
      setDeletingPostId(null);
    }
  };

  const startEdit = (post: Post) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const saveEdit = async () => {
    if (editingPost && editContent.trim()) {
      await editPost(editingPost.id, editContent);
      setEditingPost(null);
    }
  };

  // Report Handler
  const handleReport = (postId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to report content.",
        variant: "destructive"
      });
      return;
    }
    setReportPostId(postId);
    setReportDialogOpen(true);
  };

  const submitReport = async (reason: string) => {
    if (!reportPostId || !user) return;

    // If "other" is selected, show the custom reason input
    if (reason === 'other') {
      setReportReason('Other');
      setShowCustomReasonInput(true);
      return; // Don't submit yet, wait for custom reason
    }

    // Map reason codes to user-friendly text
    const reasonMap: Record<string, string> = {
      'spam': 'Spam or misleading',
      'harassment': 'Harassment or hate speech',
      'inappropriate': 'Inappropriate content'
    };

    const finalReason = reasonMap[reason] || reason;

    try {
      const response = await fetch(`${API_URL}/api/community/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          post_id: reportPostId,
          reason: finalReason,
          custom_reason: null
        })
      });

      if (response.ok) {
        toast({
          title: "Report Submitted",
          description: "Thank you for helping keep our community safe.",
        });
        setReportDialogOpen(false);
        setReportPostId(null);
        setReportReason('');
        setCustomReason('');
        setShowCustomReasonInput(false);
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

  // Submit Custom Report (for "Other" option)
  const submitCustomReport = async () => {
    if (!reportPostId || !customReason.trim()) {
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
          reason: 'Other',
          custom_reason: customReason
        })
      });

      if (response.ok) {
        toast({
          title: "Report Submitted",
          description: "Thank you for helping keep our community safe.",
        });
        setReportDialogOpen(false);
        setReportPostId(null);
        setReportReason('');
        setCustomReason('');
        setShowCustomReasonInput(false);
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

  // Share Dialog Handler
  const handleShareDialog = (postId: string) => {
    const url = `${window.location.origin}/community/post/${postId}`;
    setShareUrl(url);
    setSharePostId(postId);
    setShareDialogOpen(true);
  };

  const shareToSocial = (platform: string) => {
    const text = "Check out this post from HSM Developer Hub!";
    let url = '';

    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Post link copied to clipboard.",
    });
  };

  // Comments Handlers
  const toggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      setActiveComments([]);
    } else {
      setActiveCommentsPostId(postId);
      setCommentsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/community/posts/${postId}/comments`);
        if (response.ok) {
          const comments = await response.json();
          setActiveComments(comments);
        }
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const submitComment = async (postId: string) => {
    if (!commentInput.trim() || !user) return;

    try {
      const response = await fetch(`${API_URL}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          content: commentInput
        })
      });

      if (response.ok) {
        const newComment = await response.json();
        setActiveComments([...activeComments, newComment]);
        setCommentInput('');
        toast({
          title: "Comment Posted",
          description: "Your comment has been added.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Edit Comment Handler
  const startEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const saveEditComment = async () => {
    if (!editingCommentId || !editingCommentContent.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/community/comments/${editingCommentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          content: editingCommentContent
        })
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setActiveComments(activeComments.map(c => c.id === editingCommentId ? updatedComment : c));
        setEditingCommentId(null);
        setEditingCommentContent('');
        toast({
          title: "Comment Updated",
          description: "Your comment has been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openDeleteCommentDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteCommentDialogOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/community/comments/${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setActiveComments(activeComments.filter(c => c.id !== commentToDelete));
        toast({
          title: "Comment Deleted",
          description: "Your comment has been deleted.",
        });
        setDeleteCommentDialogOpen(false);
        setCommentToDelete(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Channel Edit/Delete Handlers
  const openEditChannelDialog = (channel: any) => {
    setEditingChannelId(channel.id);
    setEditChannelName(channel.name);
    setEditChannelDescription(channel.description || '');
    setEditChannelDialogOpen(true);
  };

  const handleEditChannel = async () => {
    if (!editingChannelId || !editChannelName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/community/channels/${editingChannelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          name: editChannelName,
          description: editChannelDescription
        })
      });

      if (response.ok) {
        toast({
          title: "Channel Updated",
          description: "Channel has been updated successfully.",
        });
        setEditChannelDialogOpen(false);
        setEditingChannelId(null);
        // Refresh channels
        window.location.reload();
      } else {
        throw new Error('Failed to update channel');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update channel. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChannel = (channelId: string) => {
    setActiveDeleteChannelId(channelId);
    setDeleteChannelDialogOpen(true);
  };

  const confirmDeleteChannel = async () => {
    if (!activeDeleteChannelId) return;

    try {
      const response = await fetch(`${API_URL}/api/community/channels/${activeDeleteChannelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Channel Deleted",
          description: "Channel has been deleted successfully.",
        });
        setDeleteChannelDialogOpen(false);
        setActiveDeleteChannelId(null);
        // Redirect to general channel if deleted active one
        if (activeChannel === activeDeleteChannelId) {
          setActiveChannel('general');
        }
        window.location.reload();
      } else {
        throw new Error('Failed to delete channel');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete channel. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Hashtag Autocomplete Logic
  const handlePostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewPostContent(val);

    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/#[\w-]*$/);

    if (match) {
      const query = match[0].slice(1);
      setShowSuggestions(true);
      setSuggestionCursorIndex(cursor); // Track where we are

      // Debounce or just fetch
      fetch(`${API_URL}/api/community/hashtags?search=${query}`)
        .then(res => res.json())
        .then(data => setHashtagSuggestions(data))
        .catch(console.error);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (tagName: string) => {
    // Find the # before the cursor
    const cursor = postInputRef.current?.selectionStart || 0;
    const textBeforeCursor = newPostContent.slice(0, cursor);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');

    // If we are completing an existing # tag
    if (lastHashIndex >= 0 && (cursor - lastHashIndex) < 20) {
      const prefix = newPostContent.slice(0, lastHashIndex);
      const suffix = newPostContent.slice(cursor);
      const newText = `${prefix}#${tagName} ${suffix}`;
      setNewPostContent(newText);
    } else {
      // Just inserting a new tag (e.g. from Topic button)
      const prefix = newPostContent.slice(0, cursor);
      const suffix = newPostContent.slice(cursor);
      // Add space if needed
      const space = (prefix.length > 0 && !prefix.endsWith(' ')) ? ' ' : '';
      const newText = `${prefix}${space}#${tagName} ${suffix}`;
      setNewPostContent(newText);
    }

    setShowSuggestions(false);

    setTimeout(() => {
      postInputRef.current?.focus();
    }, 0);
  };

  // Filter posts by category and hashtag
  let displayPosts = posts;

  // Apply category filter
  if (categoryFilter === 'ai-news') {
    // Filter for AI News Bot posts or posts in ai-news channel
    const aiNewsChannel = channels.find(c => c.slug === 'ai-news');
    displayPosts = displayPosts.filter(post =>
      post.author_name === '🤖 AI News Bot' ||
      (aiNewsChannel && post.channel_id === aiNewsChannel.id)
    );
  } else if (categoryFilter === 'community') {
    // Filter out AI News Bot posts
    displayPosts = displayPosts.filter(post => post.author_name !== '🤖 AI News Bot');
  } else if (categoryFilter === 'my-posts') {
    // Filter for user's own posts
    displayPosts = displayPosts.filter(post => post.author_id === user?.id);
  }
  // 'all' shows everything, no additional filter needed

  // Apply hashtag filter if selected
  if (selectedHashtag) {
    displayPosts = displayPosts.filter((post) => {
      // Check database tags (case-insensitive)
      const hasDbTag = post.hashtags?.some(t => t.toLowerCase() === selectedHashtag.toLowerCase());

      // Fallback: Check content text (for old posts w/o DB link)
      const regex = new RegExp(`#${selectedHashtag}(?:$|[^\\w-])`, 'i');
      const hasContentTag = regex.test(post.content);

      return hasDbTag || hasContentTag;
    });
  }

  // Pagination calculations
  const totalPages = Math.ceil(displayPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedPosts = displayPosts.slice(startIndex, endIndex);

  // Reset to page 1 when changing channels, hashtags, or category
  useEffect(() => {
    setCurrentPage(1);
  }, [activeChannel, selectedHashtag, categoryFilter]);

  // Extract hashtags, links, and bold text for display
  const renderContentWithHashtags = (content: string) => {
    if (!content) return null;

    // Split by URLs, Hashtags (#word), and Bold (**text**)
    // Using capturing groups to include the separators in the result
    const parts = content.split(/(https?:\/\/[^\s]+)|(#\w+)|(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      // Filter out undefined parts from regex capturing groups
      if (!part) return null;

      // 1. Handle URLs (Linkify)
      if (part.match(/^https?:\/\//)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }

      // 2. Handle Hashtags
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <span
            key={index}
            className="text-accent font-semibold cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              handleHashtagClick(tag);
            }}
          >
            {part}
          </span>
        );
      }

      // 3. Handle Bold Text (**text**)
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // 4. Regular Text
      return <span key={index}>{part}</span>;
    });
  };

  // News fetching state
  const [fetchingNews, setFetchingNews] = useState(false);

  // Fetch and post AI news
  const handleFetchNews = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to fetch news",
        variant: "destructive"
      });
      return;
    }

    setFetchingNews(true);

    try {
      console.log('🔄 Starting news fetch...');
      const articles = await fetchAITechNews();

      console.log(`📰 Received ${articles.length} articles`);

      if (articles.length === 0) {
        toast({
          title: "No news found",
          description: "Unable to fetch news at this time. Please try again later.",
          variant: "destructive"
        });
        setFetchingNews(false);
        return;
      }

      // Post 8-12 articles for a rich feed
      const numArticles = Math.min(articles.length, Math.floor(Math.random() * 5) + 8);
      const selectedArticles = articles.slice(0, numArticles);

      console.log(`📝 Posting ${numArticles} articles...`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedArticles.length; i++) {
        const article = selectedArticles[i];
        try {
          const { content, imageUrl } = formatNewsForPost(article);
          console.log(`  ${i + 1}/${numArticles}: Posting "${article.title.substring(0, 50)}..."`);

          await createNewsPost(content, imageUrl);
          successCount++;

          // Small delay between posts
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (postError) {
          console.error(`  ❌ Error posting article ${i + 1}:`, postError);
          errorCount++;
        }
      }

      console.log(`✅ Posted ${successCount} articles successfully`);
      if (errorCount > 0) {
        console.log(`⚠️ ${errorCount} articles failed to post`);
      }

      toast({
        title: "News synced!",
        description: `Posted ${successCount} latest AI & tech news articles.`,
      });
    } catch (error) {
      console.error('News fetch error:', error);
      toast({
        title: "Error fetching news",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFetchingNews(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-12 container mx-auto px-4 h-full min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

          {/* Left Sidebar: Channels & Navigation */}
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <Card className="glass border-border/50 h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Channels</CardTitle>
                  {user && (
                    <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Channel</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Channel Name</Label>
                            <Input
                              value={newChannelName}
                              onChange={(e) => setNewChannelName(e.target.value)}
                              placeholder="e.g. react-discussions"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Description (Optional)</Label>
                            <Textarea
                              value={newChannelDescription}
                              onChange={(e) => setNewChannelDescription(e.target.value)}
                              placeholder="Channel description..."
                              className="mt-2"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateChannelOpen(false)}>Cancel</Button>
                          <Button onClick={handleCreateChannel}>Create Channel</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Edit Channel Dialog */}
                  <Dialog open={editChannelDialogOpen} onOpenChange={setEditChannelDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Channel</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Channel Name</Label>
                          <Input
                            value={editChannelName}
                            onChange={(e) => setEditChannelName(e.target.value)}
                            placeholder="e.g. react-discussions"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Description (Optional)</Label>
                          <Textarea
                            value={editChannelDescription}
                            onChange={(e) => setEditChannelDescription(e.target.value)}
                            placeholder="Channel description..."
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditChannelDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditChannel}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {channels.map(channel => (
                  <div key={channel.id} className="flex items-center gap-1">
                    <Button
                      variant={activeChannel === channel.id ? "secondary" : "ghost"}
                      className="flex-1 justify-start gap-2"
                      onClick={() => setActiveChannel(channel.id)}
                    >
                      {channel.type === 'news' ? <Newspaper className="h-4 w-4" /> :
                        channel.type === 'media' ? <ImageIcon className="h-4 w-4" /> :
                          <Hash className="h-4 w-4" />}
                      {channel.name}
                    </Button>
                    {channel.created_by === user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditChannelDialog(channel)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Channel
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteChannel(channel.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Channel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Live Session Card */}
            <Card className="glass border-border/50 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-red-500 animate-pulse">
                  <Radio className="h-4 w-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">Live Now</span>
                </div>
                <CardTitle className="text-base">Tech Talks Weekly</CardTitle>
                <CardDescription>Discussing the future of AI Agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-white">
                        <AvatarImage src="https://github.com/shadcn.png" />
                      </Avatar>
                      <span className="text-white text-xs font-medium">Host: David</span>
                    </div>
                  </div>
                  <Video className="h-8 w-8 text-white opacity-80 group-hover:scale-110 transition-transform" />
                </div>
                <Button className="w-full mt-4" variant="outline" size="sm">Join Session</Button>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column: Feed */}
          <div className="lg:col-span-6 space-y-6">

            {/* Channel Header & Refresh */}
            <div className="flex items-center justify-between bg-card/30 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-8 w-8 rounded-full p-0 flex items-center justify-center bg-accent/10 border-accent/20">
                  {channels.find(c => c.id === activeChannel)?.type === 'news' ? <Newspaper className="h-4 w-4 text-accent" /> : <Hash className="h-4 w-4 text-accent" />}
                </Badge>
                <div>
                  <h2 className="text-xl font-bold">#{channels.find(c => c.id === activeChannel)?.name}</h2>
                  <p className="text-xs text-muted-foreground">Community & Tech Feed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedHashtag && (
                  <Badge variant="secondary" className="gap-2">
                    Filtering by #{selectedHashtag}
                    <button onClick={() => setSelectedHashtag(null)} className="ml-1 hover:text-accent">
                      ×
                    </button>
                  </Badge>
                )}
                {channels.find(c => c.id === activeChannel)?.type === 'news' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleFetchNews}
                    disabled={fetchingNews}
                  >
                    <RefreshCw className={`h-4 w-4 ${fetchingNews ? 'animate-spin' : ''}`} />
                    {fetchingNews ? 'Syncing...' : 'Sync AI News'}
                  </Button>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="gap-2 whitespace-nowrap"
                onClick={() => setCategoryFilter('all')}
              >
                <Hash className="h-4 w-4" />
                All
              </Button>
              <Button
                variant={categoryFilter === 'ai-news' ? 'default' : 'outline'}
                size="sm"
                className="gap-2 whitespace-nowrap"
                onClick={() => setCategoryFilter('ai-news')}
              >
                <Newspaper className="h-4 w-4" />
                AI News
              </Button>
              <Button
                variant={categoryFilter === 'community' ? 'default' : 'outline'}
                size="sm"
                className="gap-2 whitespace-nowrap"
                onClick={() => setCategoryFilter('community')}
              >
                <Users className="h-4 w-4" />
                Community
              </Button>
              {user && (
                <Button
                  variant={categoryFilter === 'my-posts' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                  onClick={() => setCategoryFilter('my-posts')}
                >
                  <Star className="h-4 w-4" />
                  My Posts
                </Button>
              )}
            </div>

            {/* Create Post Widget */}
            {user && (
              <Card className="glass border-border/50 relative z-20">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/profile')}>
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <div className="relative" ref={suggestionsRef}>
                        <Input
                          ref={postInputRef}
                          placeholder={`What's happening in #${channels.find(c => c.id === activeChannel)?.name}?`}
                          className="bg-transparent border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/70 text-lg"
                          value={newPostContent}
                          onChange={handlePostChange}
                        />
                        {showSuggestions && hashtagSuggestions.length > 0 && (
                          <div className="absolute top-full mt-1 left-0 z-50 w-64 bg-background border rounded-md shadow-lg overflow-hidden">
                            <div className="p-2 text-xs text-muted-foreground border-b">Suggested Topics</div>
                            {hashtagSuggestions.map(tag => (
                              <div
                                key={tag.name}
                                className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                                onClick={() => selectSuggestion(tag.name)}
                              >
                                <span className="font-medium">#{tag.name}</span>
                                <span className="text-xs text-muted-foreground">{tag.count} posts</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* PREVIEW */}
                      {newPostImage && (
                        <div className="relative rounded-lg overflow-hidden h-48 bg-muted">
                          <img src={newPostImage} className="w-full h-full object-cover" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => setNewPostImage('')}
                          >
                            x
                          </Button>
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {/* Hidden Input */}
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-accent gap-2"
                            onClick={onMediaClick}
                          >
                            <ImageIcon className="h-4 w-4" /> Media
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-accent gap-2"
                            onClick={() => {
                              fetch(`${API_URL}/api/community/hashtags`)
                                .then(res => res.json())
                                .then(data => {
                                  setHashtagSuggestions(data);
                                  setShowSuggestions(true);
                                  setTimeout(() => postInputRef.current?.focus(), 0);
                                });
                            }}
                          >
                            <HashtagIcon className="h-4 w-4" /> Topic
                          </Button>
                        </div>
                        <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feed */}
            <div className="space-y-4">
              {paginatedPosts.map((post) => (
                <Card key={post.id} className="glass border-border/50 hover:bg-muted/10 transition-colors">
                  <CardHeader className="flex flex-row items-start gap-4 pb-2">
                    <div
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleProfileClick(post.author_id, post.author_name)}
                    >
                      <Avatar>
                        <AvatarImage src={post.author_avatar || undefined} />
                        <AvatarFallback>{post.author_name[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div
                          className="cursor-pointer group"
                          onClick={() => handleProfileClick(post.author_id, post.author_name)}
                        >
                          <p className="font-semibold text-sm group-hover:text-accent transition-colors">{post.author_name}</p>
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                        </div>
                        {user?.id === post.author_id ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEdit(post)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => setDeletingPostId(post.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleReport(post.id)}>
                                <Flag className="mr-2 h-4 w-4" /> Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                      {renderContentWithHashtags(post.content)}
                    </p>
                    {post.image_url && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-border/50">
                        <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex w-full justify-between text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-2 ${post.liked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} /> {post.likes}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-2 ${activeCommentsPostId === post.id ? 'text-blue-500' : 'hover:text-blue-500'}`}
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageCircle className="h-4 w-4" /> {post.comments_count}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 hover:text-green-500"
                        onClick={() => handleShareDialog(post.id)}
                      >
                        <Share2 className="h-4 w-4" /> Share
                      </Button>
                    </div>
                  </CardFooter>

                  {/* Comments Section */}
                  {activeCommentsPostId === post.id && (
                    <div className="border-t border-border/50 px-6 py-4 space-y-4">
                      {commentsLoading ? (
                        <div className="text-center text-muted-foreground">Loading comments...</div>
                      ) : (
                        <>
                          {activeComments.length > 0 ? (
                            <div className="space-y-3">
                              {activeComments.map((comment: any) => (
                                <div key={comment.id} className="flex gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={comment.user_avatar} />
                                    <AvatarFallback>{comment.user_name?.[0] || 'U'}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    {editingCommentId === comment.id ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={editingCommentContent}
                                          onChange={(e) => setEditingCommentContent(e.target.value)}
                                          className="min-h-[60px]"
                                        />
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={saveEditComment}>Save</Button>
                                          <Button size="sm" variant="outline" onClick={() => {
                                            setEditingCommentId(null);
                                            setEditingCommentContent('');
                                          }}>Cancel</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="bg-muted rounded-lg px-3 py-2">
                                          <div className="flex items-start justify-between">
                                            <p className="font-semibold text-sm">{comment.user_name || 'Anonymous'}</p>
                                            {comment.user_id === user?.id && (
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                                                    <MoreHorizontal className="h-3 w-3" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onClick={() => startEditComment(comment)}>
                                                    <Edit2 className="h-4 w-4 mr-2" />Edit
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem onClick={() => openDeleteCommentDialog(comment.id)} className="text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            )}
                                          </div>
                                          <p className="text-sm">{comment.content}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 ml-3">
                                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground text-sm">No comments yet. Be the first!</p>
                          )}

                          {user ? (
                            <div className="flex gap-2 pt-2">
                              <Input
                                placeholder="Write a comment..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    submitComment(post.id);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => submitComment(post.id)}
                                disabled={!commentInput.trim()}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center pt-2 pb-1">
                              <p className="text-sm text-muted-foreground">
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-normal text-accent hover:text-accent/80"
                                  onClick={() => navigate('/auth')}
                                >
                                  Sign in
                                </Button>
                                {' '}to comment
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </Card>
              ))}

              {displayPosts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No posts yet in this channel. Be the first to share something!</p>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-10"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar: Chat & Trending */}
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">

            {/* Live Chat */}
            <Card className="glass border-border/50 flex flex-col h-[500px]">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <CardTitle className="text-base">Community Chat</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {onlineUsers} users online
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4" ref={chatScrollRef}>
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className="flex gap-2 items-start text-sm">
                        <span className="font-bold text-accent shrink-0">{msg.user_name}:</span>
                        <span className="text-muted-foreground break-words">{msg.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-background/80 backdrop-blur-md border-t border-border/50">
                  {user ? (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Say hi..."
                        className="h-8 text-sm"
                      />
                      <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
                        <Send className="h-3 w-3" />
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground p-1">
                      Login to chat
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trending Tags */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Trending
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : trendingHashtags.length > 0 ? (
                  trendingHashtags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex justify-between items-center text-sm cursor-pointer hover:text-accent transition-colors"
                      onClick={() => handleHashtagClick(tag.name)}
                    >
                      <span className="font-medium text-muted-foreground">#{tag.name}</span>
                      <span className="text-xs text-muted-foreground/50">{tag.post_count} posts</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No trending hashtags yet</p>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      {/* Modals */}

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] mb-4"
            />
            {/* Note: Multi-line support would be better with Textarea, using Input for now to match current imports unless I import Textarea */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Channel Alert */}
      <AlertDialog open={deleteChannelDialogOpen} onOpenChange={setDeleteChannelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this channel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChannel} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Alert */}
      <AlertDialog open={deleteCommentDialogOpen} onOpenChange={setDeleteCommentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteComment} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={(open) => {
        setReportDialogOpen(open);
        if (!open) {
          setShowCustomReasonInput(false);
          setCustomReason('');
          setReportReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Help us understand what's wrong with this post.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!showCustomReasonInput ? (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => submitReport('spam')}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Spam or misleading
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => submitReport('harassment')}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Harassment or hate speech
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => submitReport('inappropriate')}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Inappropriate content
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => submitReport('other')}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Other
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="custom-reason" className="text-sm font-medium">
                    Please provide more details *
                  </Label>
                  <Textarea
                    id="custom-reason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe the issue with this post..."
                    className="min-h-[120px] mt-2"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Please explain why you're reporting this post so our team can review it properly.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {showCustomReasonInput && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomReasonInput(false);
                  setCustomReason('');
                  setReportReason('');
                }}
              >
                Back
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setReportDialogOpen(false);
                setShowCustomReasonInput(false);
                setCustomReason('');
                setReportReason('');
              }}
            >
              Cancel
            </Button>
            {showCustomReasonInput && (
              <Button
                onClick={submitCustomReport}
                disabled={!customReason.trim()}
                className="bg-destructive hover:bg-destructive/90"
              >
                <Flag className="mr-2 h-4 w-4" />
                Submit Report
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
            <DialogDescription>
              Share this post with your network
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => shareToSocial('whatsapp')}
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => shareToSocial('telegram')}
              >
                <Send className="h-4 w-4 text-blue-400" />
                Telegram
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => shareToSocial('twitter')}
              >
                <Share2 className="h-4 w-4 text-blue-500" />
                Twitter
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => shareToSocial('facebook')}
              >
                <Share2 className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => shareToSocial('linkedin')}
              >
                <Share2 className="h-4 w-4 text-blue-700" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={copyShareLink}
              >
                <Link className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
            <div className="pt-2">
              <Input
                value={shareUrl}
                readOnly
                className="text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <CommentsDialog
        open={!!commentingPost}
        onOpenChange={(open) => !open && setCommentingPost(null)}
        post={commentingPost}
      />

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={deleteCommentDialogOpen} onOpenChange={setDeleteCommentDialogOpen}>
        <AlertDialogContent className="glass border-border/50">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl">Delete Comment</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground mt-1">
                  This action cannot be undone
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this comment? This will permanently remove your comment from the conversation.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Comment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

// Comments Dialog Component
function CommentsDialog({ open, onOpenChange, post }: { open: boolean, onOpenChange: (open: boolean) => void, post: Post | null }) {
  const [comments, setComments] = useState<ChatMessage[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!post) return;
    try {
      const res = await fetch(`${API_URL}/api/community/chat?reply_to_post_id=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        const mapped: ChatMessage[] = data.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          user_name: m.author_name || 'Anonymous',
          user_avatar: m.author_avatar,
          message: m.message,
          channel_id: m.channel_id,
          created_at: m.created_at
        }));
        setComments(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  }, [post]);

  useEffect(() => {
    if (open && post) {
      fetchComments();
      // Optional: Poll for comments?
    }
  }, [open, post, fetchComments]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/community/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          content: newComment,
          reply_to_post_id: post.id,
          channel_id: post.channel_id
        })
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative bg-muted/20">
          <ScrollArea className="h-full p-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No comments yet.</div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user_avatar || undefined} />
                      <AvatarFallback>{comment.user_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.user_name}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm mt-1">{comment.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendComment} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
            />
            <Button type="submit" size="icon" disabled={loading || !newComment.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Icon Component
function HashtagIcon({ className }: { className?: string }) {
  return <Hash className={className} />
}

export default Community;
