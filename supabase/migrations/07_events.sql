-- EVENTS AND REGISTRATIONS SYSTEM
-- 1. Create Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    event_type TEXT, -- workshop, hackathon, meetup
    max_attendees INT,
    image TEXT,
    price TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Optional (guests can register)
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    attendees_count INT DEFAULT 1,
    ticket_code UUID DEFAULT gen_random_uuid(), -- Unique code for QR
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Everyone can view events
DROP POLICY IF EXISTS "Public can view events" ON events;
CREATE POLICY "Public can view events" ON events FOR SELECT USING (true);

-- Only authenticated users (admins) can create events (for now, let's allow all auth users to help you test)
DROP POLICY IF EXISTS "Auth users can create events" ON events;
CREATE POLICY "Auth users can create events" ON events FOR INSERT TO authenticated WITH CHECK (true);

-- Registrations: Everyone can insert (including guests)
DROP POLICY IF EXISTS "Everyone can register" ON event_registrations;
CREATE POLICY "Everyone can register" ON event_registrations FOR INSERT WITH CHECK (true);

-- Registrations: Users can view their own
DROP POLICY IF EXISTS "Users can view own registrations" ON event_registrations;
CREATE POLICY "Users can view own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id);

-- 5. Seed Data (Preserving your current sample events)
INSERT INTO events (title, description, event_date, location, event_type, max_attendees, image, price)
VALUES
  (
    'Advanced React Patterns Workshop',
    'Deep dive into advanced React patterns including compound components, render props, and custom hooks for building scalable applications.',
    '2026-02-20T14:00:00Z',
    'Room 301, HSM Campus',
    'workshop',
    30,
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop',
    'Free'
  ),
  (
    'Winter Hackathon 2026',
    'Build innovative solutions in 48 hours with fellow developers. Prizes for best projects in categories: AI/ML, Sustainability, and Social Impact.',
    '2026-03-15T09:00:00Z',
    'Innovation Hub, Building A',
    'hackathon',
    100,
    'https://images.unsplash.com/photo-1504384308090-c54be3855485?q=80&w=2070&auto=format&fit=crop',
    '€15'
  ),
  (
    'Monthly Developer Meetup',
    'Network with local developers, share your latest projects, and learn about new technologies in a casual setting.',
    '2026-01-25T18:00:00Z',
    'Tech Café Downtown',
    'meetup',
    50,
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=2070&auto=format&fit=crop',
    'Free'
  ),
  (
    'TypeScript Best Practices',
    'Learn TypeScript best practices for large-scale applications including type safety, generics, and advanced patterns.',
    '2026-02-01T15:00:00Z',
    'Online (Zoom)',
    'workshop',
    NULL,
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2031&auto=format&fit=crop',
    'Free'
  ),
  (
    'Spring Hackathon: Green Tech',
    'Focus on building sustainable technology solutions. Special track for climate and environmental projects.',
    '2026-04-10T09:00:00Z',
    'Innovation Hub',
    'hackathon',
    80,
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
    '€10'
  ),
  (
    'AI/ML Study Group Kickoff',
    'Join our new AI/ML study group. We will cover fundamentals and work on practical projects together.',
    '2026-01-28T17:00:00Z',
    'Library, Room 205',
    'meetup',
    25,
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=2032&auto=format&fit=crop',
    'Free'
  );
