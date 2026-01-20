import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Users, Filter, ArrowRight, Share2, Heart } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EventRegistrationDialog } from '@/components/EventRegistrationDialog';
import { EventDetailDialog } from '@/components/EventDetailDialog';
import { useToast } from '@/hooks/use-toast';

const sampleEvents = [
  {
    id: '1',
    title: 'Advanced React Patterns Workshop',
    description: 'Deep dive into advanced React patterns including compound components, render props, and custom hooks for building scalable applications.',
    event_date: '2026-02-20T14:00:00Z',
    location: 'Room 301, HSM Campus',
    event_type: 'workshop',
    max_attendees: 30,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop',
    price: 'Free'
  },
  {
    id: '2',
    title: 'Winter Hackathon 2026',
    description: 'Build innovative solutions in 48 hours with fellow developers. Prizes for best projects in categories: AI/ML, Sustainability, and Social Impact.',
    event_date: '2026-03-15T09:00:00Z',
    location: 'Innovation Hub, Building A',
    event_type: 'hackathon',
    max_attendees: 100,
    image: 'https://images.unsplash.com/photo-1504384308090-c54be3855485?q=80&w=2070&auto=format&fit=crop',
    price: '€15'
  },
  {
    id: '3',
    title: 'Monthly Developer Meetup',
    description: 'Network with local developers, share your latest projects, and learn about new technologies in a casual setting.',
    event_date: '2026-01-25T18:00:00Z',
    location: 'Tech Café Downtown',
    event_type: 'meetup',
    max_attendees: 50,
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=2070&auto=format&fit=crop',
    price: 'Free'
  },
  {
    id: '4',
    title: 'TypeScript Best Practices',
    description: 'Learn TypeScript best practices for large-scale applications including type safety, generics, and advanced patterns.',
    event_date: '2026-02-01T15:00:00Z',
    location: 'Online (Zoom)',
    event_type: 'workshop',
    max_attendees: null,
    image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2031&auto=format&fit=crop',
    price: 'Free'
  },
  {
    id: '5',
    title: 'Spring Hackathon: Green Tech',
    description: 'Focus on building sustainable technology solutions. Special track for climate and environmental projects.',
    event_date: '2026-04-10T09:00:00Z',
    location: 'Innovation Hub',
    event_type: 'hackathon',
    max_attendees: 80,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
    price: '€10'
  },
  {
    id: '6',
    title: 'AI/ML Study Group Kickoff',
    description: 'Join our new AI/ML study group. We will cover fundamentals and work on practical projects together.',
    event_date: '2026-01-28T17:00:00Z',
    location: 'Library, Room 205',
    event_type: 'meetup',
    max_attendees: 25,
    image: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=2032&auto=format&fit=crop',
    price: 'Free'
  },
];

const eventTypes = ['all', 'workshop', 'hackathon', 'meetup'];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    year: date.getFullYear(),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  };
};

const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null); // For Registration
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<any | null>(null); // For Details
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
      if (data) {
        setEvents(data);
      }
      if (error) {
        toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
      }
    };
    fetchEvents();
  }, [toast]);

  const filteredEvents = activeFilter === 'all'
    ? events
    : events.filter((event) => event.event_type === activeFilter);

  const handleRegister = (event: any) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (event: any) => {
    setDetailEvent(event);
    setIsDetailOpen(true);
  };

  const handleShare = (e: React.MouseEvent, eventTitle: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: `Shareable link for "${eventTitle}" copied to clipboard.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-2xl mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Upcoming Events</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Join workshops, hackathons, and meetups to learn, build, and connect.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <Tabs value={activeFilter} onValueChange={setActiveFilter}>
              <TabsList className="bg-muted/50 h-auto p-1">
                {eventTypes.map((type) => (
                  <TabsTrigger key={type} value={type} className="capitalize px-4 py-2">
                    {type === 'all' ? 'All Events' : type + 's'}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground">
              Showing {filteredEvents.length} events
            </p>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const dateInfo = formatDate(event.event_date);
              return (
                <Card
                  key={event.id}
                  className="group overflow-hidden border-border/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20 flex flex-col h-full bg-card/50 backdrop-blur-sm cursor-pointer"
                  onClick={() => handleViewDetails(event)}
                >
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="backdrop-blur-md bg-background/80 hover:bg-background/90 uppercase tracking-wider text-[10px] font-bold">
                        {event.event_type}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40 text-white"
                        onClick={(e) => handleShare(e, event.title)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-semibold text-primary uppercase tracking-wide mb-1">
                          {dateInfo.full}
                        </div>
                        <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm mb-6 line-clamp-2 flex-1">
                      {event.description}
                    </p>

                    <div className="space-y-3 mt-auto">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary/70" />
                          <span className="truncate max-w-[150px]">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 text-primary/70" />
                          <span>{event.max_attendees ? `${event.max_attendees} spots` : 'Unlimited'}</span>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-border/50">
                        <span className="font-bold text-lg">{event.price}</span>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegister(event);
                          }}
                          className="group-hover:translate-x-1 transition-transform"
                        >
                          Register Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-24 bg-card/30 rounded-3xl border border-dashed border-border">
              <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                We couldn't find any events matching your filter. Try selecting 'All Events' to see everything.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {selectedEvent && (
        <EventRegistrationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          event={selectedEvent}
        />
      )}

      {detailEvent && (
        <EventDetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          event={detailEvent}
          onRegister={() => handleRegister(detailEvent)}
        />
      )}
    </div>
  );
};

export default Events;
