import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Users, TrendingUp, ExternalLink, Hash, Star,
  Image as ImageIcon, Send, Plus, Video, Radio, Newspaper,
  Share2, Heart, MessageCircle, MoreHorizontal, Search, RefreshCw, Loader2,
  Bot, User, LayoutList, Copy, Trash2, Flag,
  Twitter, Facebook, Linkedin, Instagram
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCommunity } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import { fetchAITechNews, formatNewsForPost } from '@/services/newsService';

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

  // Create Channel State
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');

  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  const handleComment = (postId: string) => {
    toast({
      title: "Comments",
      description: "Comment section coming soon!",
    });
  };

  const handleShare = (postId: string) => {
    setSharePostId(postId);
    setShareUrl(`${window.location.origin}/community#${postId}`);
    setShareDialogOpen(true);
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
    const tag = hashtag.toLowerCase();
    setSelectedHashtag(selectedHashtag === tag ? null : tag);
  };

  // Filter State
  const [activeFilter, setActiveFilter] = useState<'all' | 'news' | 'community' | 'mine'>('all');

  // Report State
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  // Share State
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  // Filter posts based on active filter and selected hashtag
  const displayPosts = posts.filter((post) => {
    // 1. Hashtag Filter
    if (selectedHashtag && !post.hashtags?.includes(selectedHashtag)) return false;

    // 2. Type Filter
    if (activeFilter === 'news') return post.is_system_post || post.author_name === '🤖 AI News Bot';
    if (activeFilter === 'community') return !post.is_system_post && post.author_name !== '🤖 AI News Bot';
    if (activeFilter === 'mine') return post.author_id === user?.id;

    return true; // 'all'
  });

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

  // Delete Post Handler
  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete post.', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Post deleted successfully.' });
    }
  };

  const handleReport = (postId: string) => {
    setReportPostId(postId);
    setReportDialogOpen(true);
  };

  const submitReport = async (reason: string) => {
    if (!reportPostId || !user) return;

    const { error } = await supabase.from('reports').insert({
      post_id: reportPostId,
      reporter_id: user.id,
      reason: reason
    });

    if (error) {
      console.error('Report error:', error);
      toast({
        title: "Error submitting report",
        description: "Please try again later.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Report Submitted",
        description: "Thank you. We review all reports, and posts with multiple reports are automatically hidden.",
      });
    }

    setReportDialogOpen(false);
    setReportPostId(null);
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
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 h-fit">
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

                  {/* Report Dialog */}
                  <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Report Post</DialogTitle>
                        <DialogDescription>
                          Please select a reason for reporting this post. This helps us maintain a safe community.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-2 py-4">
                        {['Sensitive content', 'Sexual harassment', 'False information', 'Inappropriate content', 'Spam or Scam', 'Hate speech'].map((reason) => (
                          <Button
                            key={reason}
                            variant="outline"
                            className="justify-start text-left h-auto py-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                            onClick={() => submitReport(reason)}
                          >
                            <Flag className="mr-2 h-4 w-4" /> {reason}
                          </Button>
                        ))}
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Share Dialog */}
                  <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Post</DialogTitle>
                        <DialogDescription>
                          Share this post with your network.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-3 gap-4 py-4">
                        <Button
                          variant="outline"
                          className="flex flex-col h-auto py-4 gap-2 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50"
                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank')}
                        >
                          <MessageCircle className="h-6 w-6" /> WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col h-auto py-4 gap-2 hover:bg-blue-400/10 hover:text-blue-400 hover:border-blue-400/50"
                          onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`, '_blank')}
                        >
                          <Send className="h-6 w-6" /> Telegram
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col h-auto py-4 gap-2 hover:bg-black/5 hover:text-foreground hover:border-foreground/20 dark:hover:bg-white/10"
                          onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank')}
                        >
                          <Twitter className="h-6 w-6" /> X (Twitter)
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col h-auto py-4 gap-2 hover:bg-blue-700/10 hover:text-blue-700 hover:border-blue-700/50"
                          onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')}
                        >
                          <Linkedin className="h-6 w-6" /> LinkedIn
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col h-auto py-4 gap-2 hover:bg-pink-600/10 hover:text-pink-600 hover:border-pink-600/50"
                          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
                        >
                          <Facebook className="h-6 w-6" /> Facebook
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col h-auto py-4 gap-2"
                          onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            toast({ title: "Link Copied", description: "Copied to clipboard" });
                            setShareDialogOpen(false);
                          }}
                        >
                          <Copy className="h-6 w-6" /> Copy Link
                        </Button>
                      </div>
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
                {activeChannel === 'ai-news' && (
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
            <Card className="glass border-border/50">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/profile')}>
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <Input
                      placeholder={`What's happening in #${channels.find(c => c.id === activeChannel)?.name}?`}
                      className="bg-transparent border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/70 text-lg"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent gap-2">
                              <ImageIcon className="h-4 w-4" /> Media
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Add Image URL</DialogTitle></DialogHeader>
                            <Input
                              placeholder="https://..."
                              value={newPostImage}
                              onChange={(e) => setNewPostImage(e.target.value)}
                            />
                          </DialogContent>
                        </Dialog>

                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent gap-2">
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

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
                className="gap-2"
              >
                <LayoutList className="h-4 w-4" /> All
              </Button>
              <Button
                variant={activeFilter === 'news' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('news')}
                className={`gap-2 ${activeFilter === 'news' ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-500 border-blue-500/30 hover:bg-blue-500/10'}`}
              >
                <Bot className="h-4 w-4" /> AI News
              </Button>
              <Button
                variant={activeFilter === 'community' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('community')}
                className="gap-2"
              >
                <Users className="h-4 w-4" /> Community
              </Button>
              {user && (
                <Button
                  variant={activeFilter === 'mine' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('mine')}
                  className="gap-2"
                >
                  <User className="h-4 w-4" /> My Posts
                </Button>
              )}
            </div>

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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/20">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 glass border-border/50">
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(window.location.origin + '/community#' + post.id);
                              toast({ title: "Link Copied", description: "Post link copied to clipboard" });
                            }}>
                              <Copy className="mr-2 h-4 w-4" /> Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(post.id)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleReport(post.id)}>
                              <Flag className="mr-2 h-4 w-4" /> Report
                            </DropdownMenuItem>
                            {user?.id === post.author_id && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDeletePost(post.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                        onClick={() => handleComment(post.id)}
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
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 h-fit">

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

      <Footer />
    </div>
  );
};

// Helper Icon Component
function HashtagIcon({ className }: { className?: string }) {
  return <Hash className={className} />
}

export default Community;
