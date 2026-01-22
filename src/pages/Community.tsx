import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, Users, TrendingUp, ExternalLink, Hash, Star,
  Image as ImageIcon, Send, Plus, Video, Radio, Newspaper,
  Share2, Heart, MessageCircle, MoreHorizontal, Search, RefreshCw, Loader2,
  Trash2, Edit2
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

  // Hashtag Autocomplete
  const [hashtagSuggestions, setHashtagSuggestions] = useState<{ name: string; count: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionCursorIndex, setSuggestionCursorIndex] = useState(0);

  // Create Channel State
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');

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
    await createChannel(newChannelName, newChannelType);
    setNewChannelName('');
    setNewChannelType('text');
    setIsCreateChannelOpen(false);
  };

  const handleLike = async (postId: string) => {
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

  // Filter posts by hashtag if selected
  const displayPosts = selectedHashtag
    ? posts.filter((post) => {
      // Check database tags (case-insensitive)
      const hasDbTag = post.hashtags?.some(t => t.toLowerCase() === selectedHashtag.toLowerCase());

      // Fallback: Check content text (for old posts w/o DB link)
      // Matches #tag followed by end of string or non-word/non-hyphen char
      const regex = new RegExp(`#${selectedHashtag}(?:$|[^\\w-])`, 'i');
      const hasContentTag = regex.test(post.content);

      return hasDbTag || hasContentTag;
    })
    : posts;

  // Extract hashtags from content for display
  const renderContentWithHashtags = (content: string) => {
    const parts = content.split(/(#[\w-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <span
            key={index}
            className="text-accent font-semibold cursor-pointer hover:underline"
            onClick={() => handleHashtagClick(tag)}
          >
            {part}
          </span>
        );
      }
      return part;
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
          <div className="lg:col-span-3 space-y-6">
            <Card className="glass border-border/50 h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Channels</CardTitle>
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
                      <div className="py-4">
                        <Label>Channel Name</Label>
                        <Input
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          placeholder="e.g. react-discussions"
                          className="mt-2"
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateChannel}>Create Channel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {channels.map(channel => (
                  <Button
                    key={channel.id}
                    variant={activeChannel === channel.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveChannel(channel.id)}
                  >
                    {channel.type === 'news' ? <Newspaper className="h-4 w-4" /> :
                      channel.type === 'media' ? <ImageIcon className="h-4 w-4" /> :
                        <Hash className="h-4 w-4" />}
                    {channel.name}
                  </Button>
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

            {/* Create Post Widget */}
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

            {/* Feed */}
            <div className="space-y-4">
              {displayPosts.map((post) => (
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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
                        className="gap-2 hover:text-blue-500"
                        onClick={() => handleCommentClick(post)}
                      >
                        <MessageCircle className="h-4 w-4" /> {post.comments_count}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 hover:text-green-500"
                        onClick={() => handleShare(post.id)}
                      >
                        <Share2 className="h-4 w-4" /> Share
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}

              {displayPosts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No posts yet in this channel. Be the first to share something!</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar: Chat & Trending */}
          <div className="lg:col-span-3 space-y-6">

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

      {/* Comment Dialog */}
      <CommentsDialog
        open={!!commentingPost}
        onOpenChange={(open) => !open && setCommentingPost(null)}
        post={commentingPost}
      />

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
