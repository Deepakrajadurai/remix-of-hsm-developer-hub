import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const BlogNew = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const MAX_TITLE_LENGTH = 200;
  const MAX_EXCERPT_LENGTH = 500;
  const MAX_CONTENT_LENGTH = 50000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both title and content.',
        variant: 'destructive',
      });
      return;
    }

    if (title.trim().length > MAX_TITLE_LENGTH) {
      toast({
        title: 'Title too long',
        description: `Title must be ${MAX_TITLE_LENGTH} characters or less.`,
        variant: 'destructive',
      });
      return;
    }

    if (excerpt.trim().length > MAX_EXCERPT_LENGTH) {
      toast({
        title: 'Excerpt too long',
        description: `Excerpt must be ${MAX_EXCERPT_LENGTH} characters or less.`,
        variant: 'destructive',
      });
      return;
    }

    if (content.trim().length > MAX_CONTENT_LENGTH) {
      toast({
        title: 'Content too long',
        description: `Content must be ${MAX_CONTENT_LENGTH.toLocaleString()} characters or less.`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('posts').insert({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        published,
        user_id: user!.id,
      });

      if (error) throw error;

      toast({
        title: 'Article published!',
        description: 'Your article has been successfully published.',
      });
      navigate('/blog');
    } catch (err) {
      console.error('Error saving post:', err);
      toast({
        title: 'Error',
        description: 'Failed to save article. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <h1 className="text-3xl font-bold mb-8">Write a New Article</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter your article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Textarea
                id="excerpt"
                placeholder="A brief summary of your article..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                This will be shown in the article preview.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your article content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="published" className="font-medium">Publish immediately</Label>
                <p className="text-sm text-muted-foreground">
                  Your article will be visible to everyone.
                </p>
              </div>
              <Switch
                id="published"
                checked={published}
                onCheckedChange={setPublished}
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" variant="gradient" disabled={saving} className="gap-2">
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {published ? 'Publish Article' : 'Save Draft'}
                  </>
                )}
              </Button>
              <Link to="/blog">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BlogNew;
