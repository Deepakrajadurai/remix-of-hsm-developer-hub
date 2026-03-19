import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card'; // Removed in favor of BlogCard
import { BlogCard } from '@/components/BlogCard';
import { useAuth } from '@/hooks/useAuth';
import { Blog as BlogType } from '@/types/blog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const Blog = () => {
  const [posts, setPosts] = useState<BlogType[]>([]);
  const [myPosts, setMyPosts] = useState<BlogType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Fetch public posts
        const res = await fetch(`${API_URL}/api/blogs`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }

        // Fetch my posts if logged in
        if (user) {
          const token = localStorage.getItem('authToken');
          if (token) {
            const myRes = await fetch(`${API_URL}/api/blogs/my-posts`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
              }
            });

            if (myRes.ok) {
              const myData = await myRes.json();
              setMyPosts(myData);
            } else {
              console.error('Failed to fetch my posts:', myRes.status, myRes.statusText);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  const renderPostList = (postList: BlogType[], isMyList = false) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (postList.length === 0) {
      return (
        <div className="text-center py-16">
          <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No articles found</h3>
          <p className="text-muted-foreground mb-6">
            {isMyList ? "You haven't written any articles yet." : "Be the first to share your knowledge."}
          </p>
          {user && (
            <Link to="/blog/new">
              <Button variant="gradient">Write an Article</Button>
            </Link>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postList.map((post) => (
          <div key={post.id} className="relative group">
            <BlogCard blog={post} />
            {isMyList && (
              <div className="absolute top-4 right-4 z-10">
                <Badge variant={post.published ? "secondary" : "destructive"}>
                  {post.published ? "Published" : "Draft"}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Blog</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Insights, tutorials, and stories from the HSM-Developer community.
              </p>
            </div>

            {user && (
              <Link to="/blog/new">
                <Button variant="gradient" className="gap-2 hidden md:flex">
                  <PenLine className="h-4 w-4" />
                  Write an Article
                </Button>
              </Link>
            )}
          </div>

          {user && (
            <Link to="/blog/new" className="md:hidden mb-8 block">
              <Button variant="gradient" className="gap-2 w-full">
                <PenLine className="h-4 w-4" />
                Write an Article
              </Button>
            </Link>
          )}

          {user ? (
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="all">Latest Articles</TabsTrigger>
                <TabsTrigger value="my-posts">My Articles</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {renderPostList(posts)}
              </TabsContent>

              <TabsContent value="my-posts">
                {renderPostList(myPosts, true)}
              </TabsContent>
            </Tabs>
          ) : (
            renderPostList(posts)
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
