-- Add More Dummy Events
INSERT INTO events (title, description, event_date, location, event_type, max_attendees, image, price)
VALUES
  (
    'AI Ethics Panel Discussion',
    'Join industry leaders as we discuss the ethical implications of Artificial Intelligence in software development.',
    '2026-02-15T18:00:00Z',
    'Main Auditorium',
    'meetup',
    200,
    'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop',
    'Free'
  ),
  (
    'Rust for JS Developers',
    'A hands-on workshop designed to help JavaScript developers transition to Rust ecosystem.',
    '2026-03-05T10:00:00Z',
    'Lab 4B',
    'workshop',
    20,
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop',
    '€50'
  ),
  (
    'DevOps 101: Docker & Kubernetes',
    'Learn the basics of containerization and orchestration. Bring your own laptop!',
    '2026-02-28T09:00:00Z',
    'Training Center',
    'workshop',
    40,
    'https://images.unsplash.com/photo-1607799275518-d58665d87fea?q=80&w=2069&auto=format&fit=crop',
    '€25'
  ),
  (
    'Mobile App Design Sprint',
    'Collaborative design sprint tailored for mobile application interfaces. Designers and Developers welcome.',
    '2026-04-01T14:00:00Z',
    'Design Studio',
    'meetup',
    30,
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    'Free'
  );
