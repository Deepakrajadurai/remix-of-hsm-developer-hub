import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Ticket, Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface EventDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: {
        title: string;
        description: string;
        event_date: string;
        location: string;
        event_type: string;
        max_attendees: number | null;
        image: string;
        price: string;
    };
    onRegister: () => void;
}

export const EventDetailDialog = ({
    open,
    onOpenChange,
    event,
    onRegister,
}: EventDetailDialogProps) => {
    const { toast } = useToast();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            full: date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            }),
            time: date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
    };

    const dateInfo = formatDate(event.event_date);

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: "Link Copied!",
            description: "Event link has been copied to your clipboard.",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden glass border-white/10">
                <div className="relative h-64 md:h-80">
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <Badge className="absolute top-4 left-4 uppercase tracking-wider">
                        {event.event_type}
                    </Badge>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 rounded-full bg-background/50 backdrop-blur-md"
                        onClick={handleShare}
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-bold leading-tight">
                                {event.title}
                            </DialogTitle>
                            <DialogDescription className="text-primary font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> {dateInfo.full} at {dateInfo.time}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-y border-white/10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <MapPin className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-primary/70">Location</p>
                                    <p className="text-sm">{event.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-primary/70">Capacity</p>
                                    <p className="text-sm">{event.max_attendees ? `${event.max_attendees} slots total` : 'Unlimited capacity'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Ticket className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-primary/70">Price</p>
                                    <p className="text-sm font-bold text-foreground line-clamp-1">{event.price}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-primary/70">Duration</p>
                                    <p className="text-sm">2-3 Hours approximately</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-lg">About this event</h4>
                        <p className="text-muted-foreground leading-relaxed">
                            {event.description}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Join us for an immersive experience where we delve deep into the core concepts and latest developments in this field. Whether you're a beginner looking to get started or an experienced professional aiming to sharpen your skills, this event offers valuable insights and networking opportunities.
                        </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Registration required</p>
                            <p className="text-xl font-bold">{event.price}</p>
                        </div>
                        <Button size="lg" onClick={() => { onOpenChange(false); onRegister(); }}>
                            Register Now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
