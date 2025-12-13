import { useState } from 'react';
import { Calendar, MapPin, Users, Filter } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const sampleEvents = [
  {
    id: '1',
    title: 'Advanced React Patterns Workshop',
    description: 'Deep dive into advanced React patterns including compound components, render props, and custom hooks for building scalable applications.',
    event_date: '2024-01-20T14:00:00Z',
    location: 'Room 301, HSM Campus',
    event_type: 'workshop',
    max_attendees: 30,
  },
  {
    id: '2',
    title: 'Winter Hackathon 2024',
    description: 'Build innovative solutions in 48 hours with fellow developers. Prizes for best projects in categories: AI/ML, Sustainability, and Social Impact.',
    event_date: '2024-02-15T09:00:00Z',
    location: 'Innovation Hub, Building A',
    event_type: 'hackathon',
    max_attendees: 100,
  },
  {
    id: '3',
    title: 'Monthly Developer Meetup',
    description: 'Network with local developers, share your latest projects, and learn about new technologies in a casual setting.',
    event_date: '2024-01-25T18:00:00Z',
    location: 'Tech Café Downtown',
    event_type: 'meetup',
    max_attendees: 50,
  },
  {
    id: '4',
    title: 'TypeScript Best Practices',
    description: 'Learn TypeScript best practices for large-scale applications including type safety, generics, and advanced patterns.',
    event_date: '2024-02-01T15:00:00Z',
    location: 'Online (Zoom)',
    event_type: 'workshop',
    max_attendees: null,
  },
  {
    id: '5',
    title: 'Spring Hackathon: Green Tech',
    description: 'Focus on building sustainable technology solutions. Special track for climate and environmental projects.',
    event_date: '2024-03-10T09:00:00Z',
    location: 'Innovation Hub',
    event_type: 'hackathon',
    max_attendees: 80,
  },
  {
    id: '6',
    title: 'AI/ML Study Group Kickoff',
    description: 'Join our new AI/ML study group. We will cover fundamentals and work on practical projects together.',
    event_date: '2024-01-28T17:00:00Z',
    location: 'Library, Room 205',
    event_type: 'meetup',
    max_attendees: 25,
  },
];

const eventTypes = ['all', 'workshop', 'hackathon', 'meetup'];

const getEventTypeStyles = (type: string) => {
  switch (type) {
    case 'workshop':
      return 'bg-accent/10 text-accent';
    case 'hackathon':
      return 'bg-primary/10 text-primary dark:bg-primary/20';
    case 'meetup':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

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
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredEvents = activeFilter === 'all'
    ? sampleEvents
    : sampleEvents.filter((event) => event.event_type === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-2xl mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Events</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Join workshops, hackathons, and meetups to learn, build, and connect with fellow developers.
            </p>
          </div>

          {/* Filters */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-8">
            <TabsList className="bg-muted/50">
              {eventTypes.map((type) => (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type === 'all' ? 'All Events' : type + 's'}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Events Grid */}
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const dateInfo = formatDate(event.event_date);
              return (
                <Card key={event.id} className="group hover:shadow-lg transition-all hover:border-accent/30">
                  <div className="flex flex-col md:flex-row">
                    {/* Date Badge */}
                    <div className="md:w-32 p-6 flex md:flex-col items-center justify-center bg-accent/5 border-b md:border-b-0 md:border-r border-border">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-accent block">{dateInfo.day}</span>
                        <span className="text-sm uppercase text-muted-foreground">{dateInfo.month}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${getEventTypeStyles(event.event_type)}`}>
                            {event.event_type}
                          </span>
                          <h3 className="text-xl font-semibold group-hover:text-accent transition-colors">
                            {event.title}
                          </h3>
                        </div>
                        <Button variant="gradient" size="sm">
                          Register
                        </Button>
                      </div>

                      <p className="text-muted-foreground mb-4">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-accent" />
                          {dateInfo.full} at {dateInfo.time}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-accent" />
                          {event.location}
                        </div>
                        {event.max_attendees && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-accent" />
                            {event.max_attendees} spots
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="text-muted-foreground">Try changing your filter or check back later.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Events;
