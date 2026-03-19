import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroNetworkDark from '@/assets/hero-network.png';
import heroNetworkLight from '@/assets/hero-network-light.png';
import logo from '@/assets/logo.png';

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 bg-background">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text & Actions */}
          <div className="text-left order-2 lg:order-1">
            {/* Logo + Badge Row */}
            <div className="flex items-center gap-4 mb-6 animate-fade-in">
              <img src={logo} alt="HSM-Developer Community Logo" className="h-16 w-16" />
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Open for new members
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4 animate-slide-up">
              HSM-DEVELOPER COMMUNITY
            </h1>

            {/* Sub-Headline */}
            <p className="text-2xl md:text-3xl font-semibold text-accent mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Create. Connect. Innovate.
            </p>

            {/* Description */}
            <p className="text-lg text-muted-foreground mb-8 max-w-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
              The future starts here. Join the official developer community of Hochschule Schmalkalden & WORT.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
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
          </div>

          {/* Right Column - Visual */}
          <div className="order-1 lg:order-2 animate-fade-in absolute right-0 top-1/2 -translate-y-1/2 w-[60%] lg:w-[55%] pointer-events-none hidden lg:flex items-center justify-center" style={{ animationDelay: '0.2s' }}>
            {/* Cyan Glow Backlight */}
            <div className="absolute w-[80%] aspect-square rounded-full bg-accent/30 dark:bg-accent/25 blur-3xl" />
            <div className="absolute w-[60%] aspect-square rounded-full bg-accent/20 dark:bg-accent/15 blur-2xl" />

            {/* Theme-Based Image Switcher */}
            <div className="relative w-full flex items-center justify-center">
              {/* Light Mode Globe */}
              <img
                src={heroNetworkLight}
                alt="Digital connectivity network illustration representing the developer community"
                className="block dark:hidden w-full h-auto object-contain z-10"
                style={{
                  maskImage: 'radial-gradient(circle, black 50%, transparent 100%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 50%, transparent 100%)',
                }}
              />

              {/* Dark Mode Globe */}
              <img
                src={heroNetworkDark}
                alt="Digital connectivity network illustration representing the developer community"
                className="hidden dark:block w-full h-auto object-contain z-10"
                style={{
                  maskImage: 'radial-gradient(circle, black 35%, transparent 70%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 35%, transparent 70%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
