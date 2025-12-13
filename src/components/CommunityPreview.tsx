import { Link } from 'react-router-dom';
import { MessageSquare, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const trendingTopics = [
  { title: 'React 19 Features Discussion', replies: 45, active: true },
  { title: 'Best practices for TypeScript in 2024', replies: 32, active: true },
  { title: 'Hackathon team formation', replies: 28, active: false },
  { title: 'AI/ML project collaboration', replies: 19, active: true },
];

export const CommunityPreview = () => {
  return (
    <section className="py-20 section-alt">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join the Conversation
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Connect with fellow developers, share ideas, and collaborate on projects. 
              Our community is the heart of HSM-Developer.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-card border border-border">
                <Users className="h-6 w-6 text-accent mb-2" />
                <span className="text-2xl font-bold block">500+</span>
                <span className="text-sm text-muted-foreground">Members</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <MessageSquare className="h-6 w-6 text-accent mb-2" />
                <span className="text-2xl font-bold block">2.5k+</span>
                <span className="text-sm text-muted-foreground">Messages/Week</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="https://discord.gg/hsm-developer" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="gradient" className="gap-2 w-full sm:w-auto">
                  Join Discord
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/community">
                <Button variant="outline" className="w-full sm:w-auto">
                  View Community
                </Button>
              </Link>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Trending Discussions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {topic.active && (
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                    <span className="font-medium text-sm">{topic.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {topic.replies} replies
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
