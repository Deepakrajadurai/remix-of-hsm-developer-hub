import { Link } from 'react-router-dom';
import { ArrowRight, Users, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Open for new members
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
            <span className="gradient-text">Create. Connect.</span>
            <br />
            <span className="gradient-text">Innovate.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-delay">
            The future starts here. A professional developer community by Hochschule Schmalkalden & WORT.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up-delay">
            <Link to="/auth?mode=signup">
              <Button variant="gradient" size="lg" className="gap-2">
                Join the Community
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="lg">
                Explore Events
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto animate-fade-in-delay">
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
              <Users className="h-8 w-8 text-accent mb-3" />
              <span className="text-3xl font-bold mb-1">500+</span>
              <span className="text-sm text-muted-foreground">Active Members</span>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
              <Calendar className="h-8 w-8 text-accent mb-3" />
              <span className="text-3xl font-bold mb-1">50+</span>
              <span className="text-sm text-muted-foreground">Events per Year</span>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
              <BookOpen className="h-8 w-8 text-accent mb-3" />
              <span className="text-3xl font-bold mb-1">100+</span>
              <span className="text-sm text-muted-foreground">Resources Available</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
