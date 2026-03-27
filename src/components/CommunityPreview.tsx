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
