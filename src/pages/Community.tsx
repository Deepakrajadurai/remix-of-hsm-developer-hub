import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Users, TrendingUp, ExternalLink, Hash, Star,
  Image as ImageIcon, Send, Plus, Video, Radio, Newspaper,
  Share2, Heart, MessageCircle, MoreHorizontal, Search, RefreshCw
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// --- Mock Data ---

const initialChannels = [
  { id: 'general', name: 'General', type: 'text' },
  { id: 'ai-news', name: 'AI News & Tech', type: 'news' },
  { id: 'memes', name: 'Tech Memes', type: 'media' },
  { id: 'projects', name: 'Project Showcase', type: 'text' },
  { id: 'help', name: 'Dev Help', type: 'text' },
];

const initialPosts = [
  {
    id: 1,
    author: 'Sarah Miller',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    content: 'Just tried the new React Compiler. It is absolutely mind-blowing how much it optimizes automatically! 🤯 #react #frontend',
    likes: 45,
    comments: 12,
    timestamp: '2 hours ago',
    channel: 'general',
    image: null
  },
  {
    id: 2,
    author: 'TechNews Bot',
    avatar: '',
    content: 'BREAKING: Agentic AI is moving from experimental to production! Narrow applications with defined memory boundaries are transforming manufacturing workflows. 🤖 #AgenticAI #TechNews',
    likes: 128,
    comments: 34,
    timestamp: '4 hours ago',
    channel: 'ai-news',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 3,
    author: 'TechNews Bot',
    avatar: '',
    content: 'INFRASTRUCTURE: Meta launched "Meta Compute" to manage multi-gigawatt scale AI scale. Microsoft also announced "Community-First AI" to focus on responsible data center dev. ⚡ #Meta #Microsoft #Sustainability',
    likes: 89,
    comments: 15,
    timestamp: '5 hours ago',
    channel: 'ai-news',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 4,
    author: 'TechNews Bot',
    avatar: '',
    content: 'HEALTHCARE: New generative AI system CytoDiffusion identifies leukemia cells with extreme accuracy and recognizes its own uncertainty. A huge step for clinical support! 🏥 #AIHealth #MedicalTech',
    likes: 256,
    comments: 42,
    timestamp: '6 hours ago',
    channel: 'ai-news',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2080&auto=format&fit=crop'
  },
  {
    id: 5,
    author: 'Dev Joker',
    avatar: 'https://i.pravatar.cc/150?u=joker',
    content: 'When you fix a bug in production without testing it locally...',
    likes: 342,
    comments: 15,
    timestamp: '7 hours ago',
    channel: 'memes',
    image: 'https://images.unsplash.com/photo-1531297461136-82lw8e2c870e?q=80&w=2670&auto=format&fit=crop'
  }
];

const initialChatMessages = [
  { id: 1, user: 'Alex', text: 'Anyone joining the hackathon next month?' },
  { id: 2, user: 'Sam', text: 'I am! Looking for a team.' },
  { id: 3, user: 'Jordan', text: 'Me too, lets connect.' },
];

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [channels, setChannels] = useState(initialChannels);
  const [activeChannel, setActiveChannel] = useState('general');
  const [posts, setPosts] = useState(initialPosts.map(p => ({ ...p, liked: false })));
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isLive, setIsLive] = useState(true); // Simulate a live session active
  const [fetchingNews, setFetchingNews] = useState(false);

  // Create Channel State
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const refreshNews = async () => {
    setFetchingNews(true);
    // Simulate real-world API fetch
    await new Promise(resolve => setTimeout(resolve, 1500));

    const latestNews = [
      {
        id: Date.now(),
        author: 'TechNews Bot',
        avatar: '',
        content: 'ROBOTICS: Boston Dynamics\' Atlas humanoid robots are currently undergoing field tests at Hyundai plants for roof rack sorting! 🤖🏭 #Robotics #Innovation',
        likes: 0,
        comments: 0,
        timestamp: 'Just now',
        channel: 'ai-news',
        image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd05a?q=80&w=2012&auto=format&fit=crop',
        liked: false
      }
    ];

    setPosts(prev => [...latestNews, ...prev]);
    setFetchingNews(false);
    toast({
      title: "News Updated",
      description: "Retrieved the latest tech & AI news from global sources.",
    });
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    const newPost = {
      id: posts.length + 1,
      author: user?.user_metadata?.full_name || 'Anonymous User',
      avatar: user?.user_metadata?.avatar_url || '',
      content: newPostContent,
      likes: 0,
      comments: 0,
      timestamp: 'Just now',
      channel: activeChannel,
      image: newPostImage || null,
      liked: false
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostImage('');
    toast({ title: "Post published!", description: "Your update is now live." });
  };

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    const id = newChannelName.toLowerCase().replace(/\s+/g, '-');
    setChannels([...channels, { id, name: newChannelName, type: 'text' }]);
    setNewChannelName('');
    setIsCreateChannelOpen(false);
    setActiveChannel(id);
    toast({ title: "Channel created!", description: `#${newChannelName} is ready.` });
  };

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
          liked: !post.liked
        };
      }
      return post;
    }));
  };

  const handleComment = (postId: number) => {
    toast({
      title: "Comments",
      description: "Comment section opening... (Feature coming soon!)",
    });
  };

  const handleShare = (postId: number) => {
    toast({
      title: "Shared!",
      description: "Post link copied to clipboard.",
    });
  };

  const handleProfileClick = (author: string) => {
    const isCurrentUser = author === user?.user_metadata?.full_name || author === 'Anonymous User' || author === 'Me';

    if (isCurrentUser) {
      navigate('/profile');
    } else {
      toast({
        title: `${author}'s Profile`,
        description: `Viewing profile for ${author}. (Full profiles coming soon!)`,
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages([...chatMessages, {
      id: chatMessages.length + 1,
      user: user?.user_metadata?.full_name?.split(' ')[0] || 'Me',
      text: chatInput
    }]);
    setChatInput('');
  };

  const filteredPosts = activeChannel === 'all' ? posts : posts.filter(p => p.channel === activeChannel || (activeChannel === 'general' && p.channel !== 'memes' && p.channel !== 'ai-news')); // General shows mixed content excluding specific feeds maybe? Let's just filter strictly or loosely.

  // Let's refine the filter: if 'general', show everything except maybe meme dumps? Let's keep strict filtering for now for clarity
  const displayPosts = activeChannel === 'general' ? posts : posts.filter(p => p.channel === activeChannel);

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
              {activeChannel === 'ai-news' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={refreshNews}
                  disabled={fetchingNews}
                >
                  <RefreshCw className={`h-4 w-4 ${fetchingNews ? 'animate-spin' : ''}`} />
                  {fetchingNews ? 'Retrieving...' : 'Sync News'}
                </Button>
              )}
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

            {/* Feed */}
            <div className="space-y-4">
              {displayPosts.map((post) => (
                <Card key={post.id} className="glass border-border/50 hover:bg-muted/10 transition-colors">
                  <CardHeader className="flex flex-row items-start gap-4 pb-2">
                    <div
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleProfileClick(post.author)}
                    >
                      <Avatar>
                        <AvatarImage src={post.avatar} />
                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div
                          className="cursor-pointer group"
                          onClick={() => handleProfileClick(post.author)}
                        >
                          <p className="font-semibold text-sm group-hover:text-accent transition-colors">{post.author}</p>
                          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    {post.image && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-border/50">
                        <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
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
                        <MessageCircle className="h-4 w-4" /> {post.comments}
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
                  {34} users online
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4" ref={chatScrollRef}>
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className="flex gap-2 items-start text-sm">
                        <span className="font-bold text-accent shrink-0">{msg.user}:</span>
                        <span className="text-muted-foreground break-words">{msg.text}</span>
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
                {['React19', 'AI_Revolution', 'DevLife', 'Web3', 'SystemDesign'].map(tag => (
                  <div key={tag} className="flex justify-between items-center text-sm cursor-pointer hover:text-accent">
                    <span className="font-medium text-muted-foreground">#{tag}</span>
                    <span className="text-xs text-muted-foreground/50">1.2k posts</span>
                  </div>
                ))}
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
