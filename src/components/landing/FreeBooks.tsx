import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import BookReader from '@/components/BookReader';

interface PublishedBook {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  genre: string;
  cover_image: string | null;
  total_word_count: number;
}

const gradientCovers = [
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-yellow-500',
  'from-pink-500 to-fuchsia-500',
];

export default function FreeBooks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<PublishedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [readerBook, setReaderBook] = useState<PublishedBook | null>(null);
  const [readerChapters, setReaderChapters] = useState<any[]>([]);
  const [readerOpen, setReaderOpen] = useState(false);

  useEffect(() => {
    fetchPublishedBooks();
  }, []);

  const fetchPublishedBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('id, title, subtitle, author, genre, cover_image, total_word_count')
      .eq('published', true)
      .order('updated_at', { ascending: false })
      .limit(12);
    setBooks((data as PublishedBook[]) || []);
    setLoading(false);
  };

  const openReader = async (book: PublishedBook) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', book.id)
      .order('order_index');
    setReaderBook(book);
    setReaderChapters(data || []);
    setReaderOpen(true);
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      </section>
    );
  }

  if (books.length === 0) return null;

  return (
    <section id="free-books" className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Community Library
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Free Books</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore books published by our community of writers. Sign in to start reading.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl overflow-hidden hover:-translate-y-1 transition-transform group"
            >
              <div className={`h-44 relative bg-gradient-to-br ${gradientCovers[i % gradientCovers.length]} flex items-end p-4`}>
                {book.cover_image && (
                  <img src={book.cover_image} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg relative z-10">
                  {book.title}
                </h3>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">by {book.author}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">{book.genre || 'General'}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {(book.total_word_count || 0).toLocaleString()} words
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full gap-1.5 text-xs gradient-primary border-0 text-white"
                  onClick={() => openReader(book)}
                >
                  <Eye className="h-3.5 w-3.5" /> Read for Free
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

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
    </section>
  );
}
