import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="gradient-primary rounded-lg p-1.5">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">ChapterWave</span>
            <span className="text-xs text-muted-foreground ml-2">Write Smarter. Publish Faster.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
        <div className="text-center mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ChapterWave. All rights reserved. Built with AI.
        </div>
      </div>
    </footer>
  );
}
