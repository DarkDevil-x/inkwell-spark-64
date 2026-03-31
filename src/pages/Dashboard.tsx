import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, BarChart3, FileText, Flame, SortAsc, Filter, Edit, Eye, Download, Settings, Trash2, Moon, Sun, LogOut, User, Globe, GlobeLock } from 'lucide-react';
import BookReader from '@/components/BookReader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  genre: string;
  status: string;
  cover_image: string | null;
  total_word_count: number;
  updated_at: string;
  published: boolean;
  chapter_count?: number;
  done_chapters?: number;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/20 text-primary',
  complete: 'bg-success/20 text-success',
};

const gradientCovers = [
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-yellow-500',
  'from-pink-500 to-fuchsia-500',
  'from-violet-500 to-indigo-500',
  'from-sky-500 to-blue-600',
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [filterStatus, setFilterStatus] = useState('all');
  const [readerBook, setReaderBook] = useState<Book | null>(null);
  const [readerChapters, setReaderChapters] = useState<any[]>([]);
  const [readerOpen, setReaderOpen] = useState(false);

  const openReader = async (book: Book) => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', book.id)
      .order('order_index');
    setReaderBook(book);
    setReaderChapters(data || []);
    setReaderOpen(true);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setBooks((data as Book[]) || []);
    }
    setLoading(false);
  };

  const deleteBook = async (id: string) => {
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      setBooks(books.filter(b => b.id !== id));
      toast({ title: 'Book deleted' });
    }
  };

  const filtered = books
    .filter(b => filterStatus === 'all' || b.status === filterStatus)
    .filter(b => b.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'word_count') return b.total_word_count - a.total_word_count;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const totalWords = books.reduce((s, b) => s + (b.total_word_count || 0), 0);

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 flex h-14 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="gradient-primary rounded-lg p-1.5"><BookOpen className="h-4 w-4 text-white" /></div>
            <span className="font-bold">InkMind</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={toggle}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/profile"><Button variant="ghost" size="icon" className="rounded-full"><User className="h-4 w-4" /></Button></Link>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { signOut(); navigate('/'); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Books', value: books.length, icon: BookOpen },
            { label: 'Total Words', value: totalWords.toLocaleString(), icon: FileText },
            { label: 'Writing Streak', value: '0 🔥', icon: Flame },
            { label: 'Analytics', value: 'View', icon: BarChart3, link: '/analytics' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-xl p-4 ${'link' in s ? 'cursor-pointer hover:border-primary/50 border border-transparent transition-colors' : ''}`}
              onClick={() => 'link' in s && s.link && navigate(s.link)}
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-xl font-bold">{s.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search books..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SortAsc className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Last Edited</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="word_count">Word Count</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          <Link to="/books/new">
            <Button className="gradient-primary border-0 text-white animate-pulse-glow">
              <Plus className="h-4 w-4 mr-2" /> New Book
            </Button>
          </Link>
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <div className="h-40 shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 shimmer rounded" />
                  <div className="h-3 w-1/2 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-20 h-20 rounded-full gradient-primary mx-auto flex items-center justify-center mb-6 opacity-50">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">No books yet</h3>
            <p className="text-muted-foreground mb-6">Create your first eBook and let AI help you write it.</p>
            <Link to="/books/new">
              <Button className="gradient-primary border-0 text-white">
                <Plus className="h-4 w-4 mr-2" /> Create Your First Book
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl overflow-hidden hover:-translate-y-1 transition-transform group"
              >
                {/* Cover */}
                <div className={`h-40 relative bg-gradient-to-br ${gradientCovers[i % gradientCovers.length]} flex items-end p-4`}>
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : null}
                  <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg relative z-10">{book.title}</h3>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">{book.author} · {book.genre}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className={`text-xs ${statusColors[book.status] || ''}`}>
                      {book.status?.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{(book.total_word_count || 0).toLocaleString()} words</span>
                  </div>
                  <Progress value={book.status === 'complete' ? 100 : book.status === 'in_progress' ? 50 : 10} className="h-1.5 mb-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{timeAgo(book.updated_at)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/books/${book.id}/edit`)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/books/${book.id}/settings`)}><Settings className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBook(book.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => openReader(book)}
                      >
                        <Eye className="h-3.5 w-3.5" /> Read it
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`flex-1 gap-1.5 text-xs ${book.published ? 'border-success/30 text-success hover:bg-success/10' : 'border-accent/30 text-accent hover:bg-accent/10'}`}
                        onClick={async () => {
                          const newVal = !book.published;
                          const { error } = await supabase.from('books').update({ published: newVal } as any).eq('id', book.id);
                          if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
                          setBooks(prev => prev.map(b => b.id === book.id ? { ...b, published: newVal } : b));
                          toast({ title: newVal ? 'Book published! 🎉' : 'Book unpublished' });
                        }}
                      >
                        {book.published ? <><GlobeLock className="h-3.5 w-3.5" /> Unpublish</> : <><Globe className="h-3.5 w-3.5" /> Publish it</>}
                      </Button>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {readerOpen && (
          <BookReader
            open={readerOpen}
            onClose={() => setReaderOpen(false)}
            book={readerBook}
            chapters={readerChapters}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
