import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, BookOpen, LayoutDashboard, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);
  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-primary rounded-lg p-1.5">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ChapterWave</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggle} className="rounded-full">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <Link to="/dashboard" className="hidden md:inline-flex">
                <Button size="sm" className="gradient-primary border-0 text-white hover:opacity-90 gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" /> My Dashboard
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="hidden md:inline-flex">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden md:inline-flex gap-1.5">
                <LogOut className="h-3.5 w-3.5" /> Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden md:inline-flex">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup" className="hidden md:inline-flex">
                <Button size="sm" className="gradient-primary border-0 text-white hover:opacity-90">
                  Sign Up Free
                </Button>
              </Link>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border/50 glass"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {links.map(l => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                  {l.label}
                </a>
              ))}
              <div className="flex gap-2 pt-2">
                {user ? (
                  <>
                    <Link to="/dashboard" className="flex-1"><Button className="w-full gradient-primary border-0 text-white gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" /> My Dashboard</Button></Link>
                    <Button variant="outline" className="flex-1" onClick={signOut}>Log out</Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Log in</Button></Link>
                    <Link to="/signup" className="flex-1"><Button className="w-full gradient-primary border-0 text-white">Sign Up</Button></Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
