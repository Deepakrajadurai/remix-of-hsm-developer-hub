import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Clock, User, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
// Supabase removed

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  created_at: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
}

// Sample posts for when DB is empty
const samplePosts: Post[] = [
  {
    id: 'sample-1',
    title: 'Getting Started with React 19',
    excerpt: 'Explore the new features and improvements in React 19, including the new use hook and server components.',
    content: '',
    created_at: '2024-01-15T10:00:00Z',
    author_id: 'sample',
    author_name: 'Community Author'
  },
  {
    id: 'sample-2',
    title: 'Building Scalable TypeScript Applications',
    excerpt: 'Learn best practices for structuring large TypeScript projects with proper typing and architecture patterns.',
    content: '',
    created_at: '2024-01-10T14:30:00Z',
    author_id: 'sample',
    author_name: 'Community Author'
  },
  {
    id: 'sample-3',
    title: 'Introduction to Edge Computing',
    excerpt: 'Understanding edge computing and how it can improve performance for your web applications.',
    content: '',
    created_at: '2024-01-05T09:00:00Z',
    author_id: 'sample',
    author_name: 'Community Author'
  },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blog`);
        if (!res.ok) throw new Error('Failed to fetch posts');
        const data = await res.json();
        setPosts(data && data.length > 0 ? data : samplePosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setPosts(samplePosts); // Fallback to samples if error/empty
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

          {/* Posts */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-8">
                    <div className="h-4 bg-muted rounded w-24 mb-4" />
                    <div className="h-8 bg-muted rounded w-3/4 mb-4" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="group hover:shadow-lg transition-all hover:border-accent/30">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {formatDate(post.created_at)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        {post.author_name || 'Community Member'}
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-3 group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}

                    <Link
                      to={`/blog/${post.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                    >
                      Read more
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-16">
              <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to share your knowledge with the community.
              </p>
              {user && (
                <Link to="/blog/new">
                  <Button variant="gradient">Write the first article</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
