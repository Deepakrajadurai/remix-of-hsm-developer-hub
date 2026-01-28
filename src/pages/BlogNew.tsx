import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const BlogNew = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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

    if (content.trim().length > MAX_CONTENT_LENGTH) {
      toast({
        title: 'Content too long',
        description: `Content must be ${MAX_CONTENT_LENGTH.toLocaleString()} characters or less.`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('authToken');

    try {

      const res = await fetch(`${API_URL}/api/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content,
          cover_image_url: coverImage,
          published
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create post');
      }

      toast({
        title: 'Article published!',
        description: 'Your article has been successfully published.',
      });
      navigate('/blog');
    } catch (err: any) {
      console.error('Error saving post:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save article. Please try again.',
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('authToken');

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setCoverImage(data.url);
      toast({
        title: 'Image uploaded',
        description: 'Cover image set successfully.',
      });
    } catch (err) {
      console.error('Upload Error:', err);
      toast({
        title: 'Upload failed',
        description: 'Could not upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'code-block'],
      ['clean']
    ],
  }), []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <h1 className="text-3xl font-bold mb-8">Write a New Article</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors relative overflow-hidden group">
                {coverImage ? (
                  <>
                    <img src={coverImage} alt="Cover" className="h-64 w-full object-cover rounded-md mx-auto" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById('cover-upload')?.click()}>
                        Change Image
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => document.getElementById('cover-upload')?.click()}>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {uploadingImage ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                    </div>
                    <p className="text-sm font-medium">Click to upload cover image</p>
                    <p className="text-xs text-muted-foreground">Recommended size: 1200x630px</p>
                  </div>
                )}
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter your article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl py-6 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <div className="prose dark:prose-invert max-w-none">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  className="h-[500px] mb-12"
                />
              </div>
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
