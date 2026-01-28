import { Blog } from "@/types/blog";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface BlogCardProps {
    blog: Blog;
}

export function BlogCard({ blog }: BlogCardProps) {
    return (
        <Link to={`/blog/${blog.id}`} className="block group h-full">
            <Card className="h-full overflow-hidden border-transparent bg-white/5 dark:bg-black/20 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/20 group-hover:bg-white/10 dark:group-hover:bg-white/5">
                <div className="relative aspect-video w-full overflow-hidden">
                    {blog.cover_image_url ? (
                        <img
                            src={blog.cover_image_url}
                            alt={blog.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 transition-transform duration-500 group-hover:scale-110">
                            <span className="text-4xl font-bold text-muted-foreground/30">Blog</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                <CardHeader className="p-5 pb-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full text-primary font-medium">
                            Community
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(blog.created_at), "MMM d, yyyy")}
                        </span>
                    </div>
                    <h3 className="line-clamp-2 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {blog.title}
                    </h3>
                </CardHeader>

                <CardContent className="p-5 pt-3">
                    <div
                        className="line-clamp-3 text-sm text-muted-foreground/80 dark:text-gray-400"
                        dangerouslySetInnerHTML={{ __html: blog.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' }}
                    />
                </CardContent>

                <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 ring-2 ring-background">
                            <AvatarImage src={blog.author_avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {blog.author_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            {blog.author_name}
                        </span>
                    </div>

                    <Button variant="ghost" size="sm" className="gap-1 text-primary group-hover:translate-x-1 transition-transform p-0 hover:bg-transparent">
                        Read <ArrowRight className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </Link>
    );
}
