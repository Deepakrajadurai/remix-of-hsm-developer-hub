import { Link } from 'react-router-dom';
import { FileText, Code, Database, Folder, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
  {
    name: 'Documentation',
    description: 'Comprehensive guides and tutorials for developers',
    icon: FileText,
    count: 24,
  },
  {
    name: 'Study Guides',
    description: 'Curated learning materials for students',
    icon: Folder,
    count: 18,
  },
  {
    name: 'APIs',
    description: 'API documentation and integration guides',
    icon: Database,
    count: 12,
  },
  {
    name: 'Project Templates',
    description: 'Starter templates and boilerplates',
    icon: Code,
    count: 32,
  },
];

export const ResourcesPreview = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Resource Library</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access our curated collection of documentation, guides, and tools to accelerate your development
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {categories.map((category) => (
            <Card key={category.name} className="group cursor-pointer hover:shadow-lg transition-all hover:border-accent/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <category.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
                </p>
                <span className="text-xs font-medium text-accent">
                  {category.count} resources
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Link to="/resources">
            <Button variant="gradient" className="gap-2">
              Browse All Resources
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
