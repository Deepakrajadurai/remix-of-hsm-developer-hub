import { MessageSquare, Users, TrendingUp, ExternalLink, Hash, Star } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const trendingTopics = [
  { title: 'React 19 Features Discussion', replies: 45, active: true },
  { title: 'Best practices for TypeScript in 2024', replies: 32, active: true },
  { title: 'Hackathon team formation', replies: 28, active: false },
  { title: 'AI/ML project collaboration', replies: 19, active: true },
  { title: 'Career advice for junior developers', replies: 67, active: true },
  { title: 'Open source contribution tips', replies: 23, active: false },
];

const channels = [
  { name: 'general', description: 'General discussions and announcements', members: 487 },
  { name: 'help', description: 'Get help with coding problems', members: 423 },
  { name: 'projects', description: 'Share and discuss your projects', members: 312 },
  { name: 'jobs', description: 'Job opportunities and career advice', members: 256 },
  { name: 'events', description: 'Event discussions and planning', members: 198 },
];

const topContributors = [
  { name: 'Alex Chen', contributions: 156, role: 'Moderator' },
  { name: 'Sarah Miller', contributions: 142, role: 'Member' },
  { name: 'Tom Weber', contributions: 128, role: 'Mentor' },
  { name: 'Lisa Park', contributions: 115, role: 'Member' },
];

const Community = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-2xl mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Community</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect with fellow developers, share ideas, and collaborate on exciting projects.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                <span className="text-3xl font-bold block">500+</span>
                <span className="text-sm text-muted-foreground">Active Members</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-accent mx-auto mb-2" />
                <span className="text-3xl font-bold block">2.5k+</span>
                <span className="text-sm text-muted-foreground">Weekly Messages</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Hash className="h-8 w-8 text-accent mx-auto mb-2" />
                <span className="text-3xl font-bold block">15+</span>
                <span className="text-sm text-muted-foreground">Active Channels</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 text-accent mx-auto mb-2" />
                <span className="text-3xl font-bold block">50+</span>
                <span className="text-sm text-muted-foreground">Mentors</span>
              </CardContent>
            </Card>
          </div>

          {/* Join CTA */}
          <Card className="mb-12 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-8 md:p-12">
              <div className="max-w-2xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Join Our Discord Community
                </h2>
                <p className="text-muted-foreground mb-6">
                  Our Discord server is the heart of the HSM-Developer community. Connect with fellow developers, 
                  get help with your projects, and stay updated on community events.
                </p>
                <a 
                  href="https://discord.gg/hsm-developer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="gradient" size="lg" className="gap-2">
                    Join Discord
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trending Topics */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <CardTitle>Trending Discussions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {trendingTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        {topic.active && (
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                        <span className="font-medium">{topic.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {topic.replies} replies
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Channels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {channels.map((channel) => (
                    <div key={channel.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{channel.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {channel.members}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Contributors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topContributors.map((contributor, index) => (
                    <div key={contributor.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-medium text-accent">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium block">{contributor.name}</span>
                        <span className="text-xs text-muted-foreground">{contributor.role}</span>
                      </div>
                      <span className="text-sm text-accent font-medium">
                        {contributor.contributions}
                      </span>
                    </div>
                  ))}
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

export default Community;
