import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Sponsors } from '@/components/Sponsors';
import { EventsPreview } from '@/components/EventsPreview';
import { ResourcesPreview } from '@/components/ResourcesPreview';
import { CommunityPreview } from '@/components/CommunityPreview';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Sponsors />
      <EventsPreview />
      <ResourcesPreview />
      <CommunityPreview />
      <Footer />
    </div>
  );
};

export default Index;
