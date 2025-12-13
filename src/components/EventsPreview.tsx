import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const sampleEvents = [
  {
    id: '1',
    title: 'Web Development Workshop',
    description: 'Learn modern web development practices with React and TypeScript.',
    event_date: '2024-01-20T14:00:00Z',
    location: 'Room 301, HSM Campus',
    event_type: 'workshop',
  },
  {
    id: '2',
    title: 'Winter Hackathon 2024',
    description: 'Build innovative solutions in 48 hours with fellow developers.',
    event_date: '2024-02-15T09:00:00Z',
    location: 'Innovation Hub',
    event_type: 'hackathon',
  },
  {
    id: '3',
    title: 'Monthly Developer Meetup',
    description: 'Network with local developers and share your latest projects.',
    event_date: '2024-01-25T18:00:00Z',
    location: 'Tech Café Downtown',
    event_type: 'meetup',
  },
];

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'workshop':
      return 'bg-accent/10 text-accent';
    case 'hackathon':
      return 'bg-primary/10 text-primary';
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
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

export const EventsPreview = () => {
  return (
    <section className="py-20 section-alt">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Upcoming Events</h2>
            <p className="text-muted-foreground">Join us at our next community gatherings</p>
          </div>
          <Link to="/events" className="hidden md:block">
            <Button variant="outline" className="gap-2">
              View All Events
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleEvents.map((event) => {
            const { day, month, time } = formatDate(event.event_date);
            return (
              <Card key={event.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-accent/10 text-accent">
                    <span className="text-xl font-bold leading-none">{day}</span>
                    <span className="text-xs uppercase">{month}</span>
                  </div>
                  <div className="flex-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getEventTypeColor(event.event_type)}`}>
                      {event.event_type}
                    </span>
                    <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
                      {event.title}
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Link to="/events" className="md:hidden flex justify-center mt-8">
          <Button variant="outline" className="gap-2">
            View All Events
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
