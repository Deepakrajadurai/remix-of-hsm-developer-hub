import { useState } from 'react';
import { Search, FileText, Code, Database, Folder, ExternalLink, BookOpen, Layers } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Code,
  Database,
  Folder,
  BookOpen,
  Layers,
};

const sampleResources = [
  {
    id: '1',
    title: 'React Documentation',
    description: 'Official React documentation with guides, tutorials, and API reference.',
    url: 'https://react.dev',
    category: 'documentation',
    icon: 'FileText',
  },
  {
    id: '2',
    title: 'TypeScript Handbook',
    description: 'Complete guide to TypeScript including advanced types and best practices.',
    url: 'https://www.typescriptlang.org/docs/',
    category: 'documentation',
    icon: 'BookOpen',
  },
  {
    id: '3',
    title: 'React Starter Template',
    description: 'Production-ready React template with TypeScript, Tailwind, and testing setup.',
    url: 'https://vitejs.dev/guide/',
    category: 'templates',
    icon: 'Layers',
  },
  {
    id: '4',
    title: 'Algorithms Study Guide',
    description: 'Comprehensive guide to algorithms and data structures for technical interviews.',
    url: 'https://www.geeksforgeeks.org/fundamentals-of-algorithms/',
    category: 'study-guides',
    icon: 'BookOpen',
  },
  {
    id: '5',
    title: 'REST API Design Guide',
    description: 'Best practices for designing RESTful APIs with examples and patterns.',
    url: 'https://restfulapi.net/',
    category: 'apis',
    icon: 'Database',
  },
  {
    id: '6',
    title: 'Next.js Full-Stack Template',
    description: 'Complete Next.js template with authentication, database, and deployment setup.',
    url: 'https://vercel.com/templates/next.js',
    category: 'templates',
    icon: 'Code',
  },
  {
    id: '7',
    title: 'Database Design Patterns',
    description: 'Common database design patterns and when to use them in your projects.',
    url: 'https://www.prisma.io/dataguide',
    category: 'study-guides',
    icon: 'Database',
  },
  {
    id: '8',
    title: 'GraphQL API Reference',
    description: 'Learn GraphQL from basics to advanced queries and mutations.',
    url: 'https://graphql.org/learn/',
    category: 'apis',
    icon: 'Code',
  },
];

const categories = ['all', 'documentation', 'study-guides', 'apis', 'templates'];

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'study-guides':
      return 'Study Guides';
    case 'apis':
      return 'APIs';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
};

const Resources = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = sampleResources.filter((resource) => {
    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-2xl mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Resource Library</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Curated collection of documentation, guides, and tools to accelerate your development journey.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
            <TabsList className="bg-muted/50 flex-wrap h-auto">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {getCategoryLabel(category)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map((resource) => {
              const IconComponent = iconMap[resource.icon] || FileText;
              return (
                <Card key={resource.id} className="group cursor-pointer hover:shadow-lg transition-all hover:border-accent/50">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <IconComponent className="h-6 w-6 text-accent" />
                    </div>

                    <span className="text-xs font-medium text-accent uppercase tracking-wide">
                      {getCategoryLabel(resource.category)}
                    </span>

                    <h3 className="font-semibold text-lg mt-2 mb-2 group-hover:text-accent transition-colors">
                      {resource.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {resource.description}
                    </p>

                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                    >
                      View Resource
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No resources found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Resources;
