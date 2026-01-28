import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Blog as BlogType } from '@/types/blog';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import 'react-quill/dist/quill.snow.css'; // Import styles for content rendering
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const BlogPost = () => {
    const { id } = useParams<{ id: string }>();
    const [blog, setBlog] = useState<BlogType | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBlog = async () => {
            if (!id) return;
            try {
                const token = localStorage.getItem('authToken');
                const headers: HeadersInit = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(`${API_URL}/api/blogs/${id}`, {
                    headers
                });
                if (!res.ok) throw new Error('Failed to fetch blog');
                const data = await res.json();
                setBlog(data);
            } catch (err) {
                console.error('Error fetching blog:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [id]);

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        const token = localStorage.getItem('authToken');

        try {
            const res = await fetch(`${API_URL}/api/blogs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to delete blog');

            toast({
                title: 'Blog deleted',
                description: 'Your blog post has been deleted successfully.',
            });
            navigate('/blog');
        } catch (err) {
            console.error('Error deleting blog:', err);
            toast({
                title: 'Error',
                description: 'Failed to delete blog post.',
                variant: 'destructive',
            });
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-24 pb-20 container mx-auto px-4 max-w-4xl space-y-8">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </main>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
                    <Link to="/blog">
                        <Button variant="outline">Back to Blog</Button>
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-20">
                <article className="container mx-auto px-4 max-w-4xl">
                    <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Blog
                    </Link>

                    {/* Header */}
                    <header className="mb-12">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Article</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(blog.created_at), "MMMM d, yyyy")}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 leading-tight">
                            {blog.title}
                        </h1>

                        <div className="flex items-center justify-between border-y border-border py-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                    <AvatarImage src={blog.author_avatar} />
                                    <AvatarFallback>{blog.author_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-foreground">{blog.author_name}</p>
                                    <p className="text-sm text-muted-foreground">Author</p>
                                </div>
                            </div>

                            {/* Edit & Delete Buttons (if author) */}
                            {user && user.id === blog.author_id && (
                                <div className="flex items-center gap-2">
                                    <Link to={`/blog/${blog.id}/edit`}>
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </Button>
                                    </Link>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete your blog post.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    {deleting ? 'Deleting...' : 'Delete'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Cover Image */}
                    {blog.cover_image_url && (
                        <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/50">
                            <img
                                src={blog.cover_image_url}
                                alt={blog.title}
                                className="w-full h-auto object-cover max-h-[400px]"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none 
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-xl prose-img:shadow-lg
                        [&_.ql-align-center]:text-center [&_.ql-align-right]:text-right
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                    />
                </article>
            </main>

            <Footer />
        </div>
    );
};

export default BlogPost;
