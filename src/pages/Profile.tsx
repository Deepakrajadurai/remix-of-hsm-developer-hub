import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, MapPin, Link as LinkIcon, Edit, Loader2, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

const Profile = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
    const [githubUrl, setGithubUrl] = useState(user?.user_metadata?.github_link || '');
    const [linkedinUrl, setLinkedinUrl] = useState(user?.user_metadata?.linkedin_link || '');

    // Image Upload State
    const [tempAvatarUrl, setTempAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
    const [tempCoverUrl, setTempCoverUrl] = useState(user?.user_metadata?.cover_url || '');

    // Cropper State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [uploadingTarget, setUploadingTarget] = useState<'avatar' | 'cover' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setCropImageSrc(imageDataUrl);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        }
    };

    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result as string));
            reader.readAsDataURL(file);
        });
    };

    const startUpload = (target: 'avatar' | 'cover') => {
        setUploadingTarget(target);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const cancelCrop = () => {
        setCropImageSrc(null);
        setUploadingTarget(null);
    };

    const applyCrop = async () => {
        if (!cropImageSrc || !croppedAreaPixels || !uploadingTarget) return;

        try {
            const croppedImageBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
            if (!croppedImageBlob) throw new Error('Could not crop image');

            const fileName = `${user?.id}/${Math.random().toString(36).substring(7)}_${uploadingTarget}.jpg`;
            const bucketName = 'avatars';

            // Try to create the bucket if it doesn't exist (works only if RLS allows or anon creation enabled)
            const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: 1024 * 1024 * 2,
                allowedMimeTypes: ['image/*']
            });

            // We ignore Duplicate error, but log others
            if (createBucketError && (createBucketError as any).error !== 'Duplicate') {
                console.log("Auto-creation of bucket skipped/failed:", createBucketError);
            }

            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, croppedImageBlob, {
                    upsert: true
                });

            if (error) {
                if (error.message.includes("Bucket not found")) {
                    throw new Error(`The storage bucket "${bucketName}" does not exist. Please go to your Supabase Manager -> Storage and create a new public bucket named "${bucketName}".`);
                }
                throw new Error(`Upload failed: ${error.message}`);
            }

            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);

            if (uploadingTarget === 'avatar') setTempAvatarUrl(publicUrlData.publicUrl);
            else setTempCoverUrl(publicUrlData.publicUrl);

            setCropImageSrc(null);
            setUploadingTarget(null);
        } catch (e: any) {
            console.error(e);
            toast({
                title: "Upload Error",
                description: e.message,
                variant: "destructive",
            });
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: fullName,
                avatar_url: tempAvatarUrl,
                cover_url: tempCoverUrl,
                github_link: githubUrl,
                linkedin_link: linkedinUrl,
            },
        });

        setLoading(false);

        if (error) {
            toast({
                title: "Error updating profile",
                description: error.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Profile updated",
                description: "Your profile has been successfully updated.",
            });
            setIsEditing(false);
            window.location.reload();
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center">
                    <Card>
                        <CardContent className="pt-6">
                            <p>Please log in to view your profile.</p>
                        </CardContent>
                    </Card>
                </div>
                <Footer />
            </div>
        );
    }

    const getInitials = (email?: string) => {
        if (!email) return 'U';
        return email.charAt(0).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent/20">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Profile Header */}
                    <div className="relative">
                        {/* Banner */}
                        <div
                            className="h-48 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 w-full mb-12 bg-cover bg-center"
                            style={user.user_metadata?.cover_url ? { backgroundImage: `url(${user.user_metadata.cover_url})` } : {}}
                        ></div>

                        {/* Avatar & Basic Info */}
                        <div className="absolute -bottom-6 left-8 flex items-end gap-6">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                <AvatarImage src={user.user_metadata?.avatar_url} className="object-cover" />
                                <AvatarFallback className="bg-accent text-accent-foreground text-4xl">
                                    {getInitials(user.email)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="mb-8 space-y-1">
                                <h1 className="text-3xl font-bold">{user.user_metadata?.full_name || 'Community Member'}</h1>
                                <p className="text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> {user.email}
                                </p>
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-8">
                            <Dialog open={isEditing} onOpenChange={(open) => {
                                if (!open) {
                                    setCropImageSrc(null);
                                    setUploadingTarget(null);
                                }
                                setIsEditing(open);
                            }}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Edit className="h-4 w-4" /> Edit Profile
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                                    {!cropImageSrc ? (
                                        <>
                                            <DialogHeader>
                                                <DialogTitle>Edit Profile</DialogTitle>
                                                <DialogDescription>
                                                    Make changes to your profile here. Click save when you're done.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-6 py-4">
                                                <div className="space-y-4">
                                                    <Label>Profile Images</Label>
                                                    <div className="flex gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="aspect-square bg-muted rounded-full overflow-hidden relative border group cursor-pointer" onClick={() => startUpload('avatar')}>
                                                                {tempAvatarUrl ? (
                                                                    <img src={tempAvatarUrl} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="flex h-full items-center justify-center text-muted-foreground bg-accent/10">
                                                                        Avatar
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Upload className="text-white h-6 w-6" />
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-center text-muted-foreground">Tap to change Avatar</p>
                                                        </div>
                                                        <div className="flex-[2] space-y-2">
                                                            <div className="aspect-[3/1] bg-muted rounded-lg overflow-hidden relative border group cursor-pointer" onClick={() => startUpload('cover')}>
                                                                {tempCoverUrl ? (
                                                                    <img src={tempCoverUrl} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="flex h-full items-center justify-center text-muted-foreground bg-accent/10">
                                                                        Cover Image
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Upload className="text-white h-6 w-6" />
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-center text-muted-foreground">Tap to change Cover</p>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="name">Full Name</Label>
                                                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="github">GitHub Profile URL</Label>
                                                    <Input id="github" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                                                    <Input id="linkedin" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" onClick={handleUpdateProfile} disabled={loading}>
                                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Save changes
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    ) : (
                                        <div className="h-[400px] flex flex-col">
                                            <DialogHeader>
                                                <div className="flex items-center justify-between">
                                                    <DialogTitle>Crop Image</DialogTitle>
                                                    <Button variant="ghost" size="icon" onClick={cancelCrop}><X className="h-4 w-4" /></Button>
                                                </div>
                                            </DialogHeader>
                                            <div className="relative flex-1 my-4 bg-black rounded-lg overflow-hidden">
                                                <Cropper
                                                    image={cropImageSrc}
                                                    crop={crop}
                                                    zoom={zoom}
                                                    aspect={uploadingTarget === 'avatar' ? 1 : 3 / 1}
                                                    onCropChange={setCrop}
                                                    onCropComplete={onCropComplete}
                                                    onZoomChange={setZoom}
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" onClick={cancelCrop}>Cancel</Button>
                                                <Button onClick={applyCrop}>Apply & Upload</Button>
                                            </div>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                        {/* Left Sidebar */}
                        <div className="space-y-6">
                            <Card className="glass border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg">About</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        Joined {new Date(user.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        Schmalkalden, Germany
                                    </div>
                                    <div className="pt-4 flex flex-wrap gap-2">
                                        <Badge variant="secondary">Developer</Badge>
                                        <Badge variant="secondary">Student</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg">Connect</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {user.user_metadata?.github_link ? (
                                        <a href={user.user_metadata.github_link} target="_blank" rel="noopener noreferrer" className="block">
                                            <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
                                                <LinkIcon className="h-4 w-4" /> GitHub
                                            </Button>
                                        </a>
                                    ) : (
                                        <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2 text-muted-foreground" disabled>
                                            <LinkIcon className="h-4 w-4" /> GitHub (Not linked)
                                        </Button>
                                    )}

                                    {user.user_metadata?.linkedin_link ? (
                                        <a href={user.user_metadata.linkedin_link} target="_blank" rel="noopener noreferrer" className="block">
                                            <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
                                                <LinkIcon className="h-4 w-4" /> LinkedIn
                                            </Button>
                                        </a>
                                    ) : (
                                        <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2 text-muted-foreground" disabled>
                                            <LinkIcon className="h-4 w-4" /> LinkedIn (Not linked)
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="glass border-border/50">
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>Your latest contributions and events.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        No recent activity to show. Join an event or publish a post!
                                    </div>
                                    <div className="flex justify-center gap-4">
                                        <Button variant="secondary">Explore Events</Button>
                                        <Button variant="secondary">Write a Post</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Profile;
