import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';

const quickLinks = [
  { name: 'Home', path: '/' },
  { name: 'Events', path: '/events' },
  { name: 'Resources', path: '/resources' },
  { name: 'Blog', path: '/blog' },
];

const legalLinks = [
  { name: 'Privacy Policy', path: '/privacy' },
  { name: 'Terms of Service', path: '/terms' },
  { name: 'Imprint', path: '/imprint' },
];

const socialLinks = [
  { name: 'GitHub', icon: Github, url: 'https://github.com/hsm-developer' },
  { name: 'LinkedIn', icon: Linkedin, url: 'https://linkedin.com/company/hsm-developer' },
  { name: 'Twitter', icon: Twitter, url: 'https://twitter.com/hsm_developer' },
  { name: 'Email', icon: Mail, url: 'mailto:contact@hsm-developer.de' },
];

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-button flex items-center justify-center">
                <span className="text-sm font-bold">H</span>
              </div>
              <span className="font-semibold text-lg">HSM-Developer</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              A professional developer community fostering innovation and collaboration 
              at Hochschule Schmalkalden.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-accent/10 hover:text-accent transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Funding */}
          <div>
            <h3 className="font-semibold mb-4">Funding & Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This project is funded by the European Regional Development Fund (ERDF) 
              and the Free State of Thuringia.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 rounded bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">EU</span>
              </div>
              <div className="w-12 h-8 rounded bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">TH</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HSM-Developer Community. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with ❤️ at Hochschule Schmalkalden
          </p>
        </div>
      </div>
    </footer>
  );
};
