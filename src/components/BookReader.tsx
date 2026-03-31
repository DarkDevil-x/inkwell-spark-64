import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Chapter {
  title: string;
  content: string;
  order_index: number;
  word_count: number;
}

interface BookReaderProps {
  open: boolean;
  onClose: () => void;
  book: {
    title: string;
    subtitle: string | null;
    author: string;
    genre: string;
    cover_image: string | null;
  } | null;
  chapters: Chapter[];
}

export default function BookReader({ open, onClose, book, chapters }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const sortedChapters = [...chapters].sort((a, b) => a.order_index - b.order_index);

  // Page 0 = cover, pages 1+ = chapters
  const totalPages = sortedChapters.length + 1;

  useEffect(() => {
    if (open) setCurrentPage(0);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, currentPage, isFlipping]);

  const goNext = useCallback(() => {
    if (isFlipping || currentPage >= totalPages - 1) return;
    setIsFlipping(true);
    setDirection(1);
    setCurrentPage(p => p + 1);
    setTimeout(() => setIsFlipping(false), 600);
  }, [currentPage, totalPages, isFlipping]);

  const goPrev = useCallback(() => {
    if (isFlipping || currentPage <= 0) return;
    setIsFlipping(true);
    setDirection(-1);
    setCurrentPage(p => p - 1);
    setTimeout(() => setIsFlipping(false), 600);
  }, [currentPage, isFlipping]);

  if (!open || !book) return null;

  const pageVariants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 90 : -90,
      opacity: 0,
      transformOrigin: dir > 0 ? 'left center' : 'right center',
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      transformOrigin: 'center center',
      transition: {
        rotateY: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -90 : 90,
      opacity: 0,
      transformOrigin: dir > 0 ? 'right center' : 'left center',
      transition: {
        rotateY: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.3, delay: 0.2 },
      },
    }),
  };

  const renderCover = () => (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden rounded-lg">
      {book.cover_image ? (
        <>
          <img
            src={book.cover_image}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 text-center p-8 mt-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-book drop-shadow-lg">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="text-lg text-white/80 mb-4 italic">{book.subtitle}</p>
            )}
            <p className="text-white/70">by {book.author}</p>
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary via-accent to-primary/80 flex flex-col items-center justify-center p-8">
          <BookOpen className="h-16 w-16 text-white/40 mb-8" />
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-3 font-book">
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="text-lg text-white/80 mb-4 italic text-center">{book.subtitle}</p>
          )}
          <div className="w-16 h-0.5 bg-white/30 my-4" />
          <p className="text-white/70">by {book.author}</p>
          <p className="text-white/50 text-sm mt-2 uppercase tracking-widest">{book.genre}</p>
        </div>
      )}
    </div>
  );

  const renderChapter = (ch: Chapter, index: number) => (
    <div className="w-full h-full overflow-y-auto bg-[#faf8f5] dark:bg-[#1a1a2e] rounded-lg">
      <div className="max-w-[65ch] mx-auto p-8 md:p-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Chapter {index + 1}
        </p>
        <h2 className="text-3xl font-bold mb-6 font-book text-foreground">{ch.title}</h2>
        <div className="w-12 h-0.5 bg-primary/50 mb-8" />
        <div className="prose prose-sm dark:prose-invert max-w-none font-book leading-[1.9] text-foreground/90">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {ch.content || '*This chapter has no content yet.*'}
          </ReactMarkdown>
        </div>
        <div className="mt-12 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">{ch.word_count.toLocaleString()} words</p>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center"
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Page counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <span className="text-white/60 text-sm">
          {currentPage === 0 ? 'Cover' : `Chapter ${currentPage} of ${sortedChapters.length}`}
        </span>
      </div>

      {/* Page dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1.5">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (isFlipping) return;
              setDirection(i > currentPage ? 1 : -1);
              setIsFlipping(true);
              setCurrentPage(i);
              setTimeout(() => setIsFlipping(false), 600);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentPage ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goPrev}
        disabled={currentPage === 0 || isFlipping}
        className="absolute left-4 md:left-8 z-50 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={goNext}
        disabled={currentPage >= totalPages - 1 || isFlipping}
        className="absolute right-4 md:right-8 z-50 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Book container with perspective */}
      <div className="w-full max-w-3xl mx-auto px-16 md:px-24" style={{ perspective: '1500px' }}>
        {/* Book shadow */}
        <div className="relative">
          <div className="absolute -inset-2 bg-black/40 rounded-2xl blur-2xl" />

          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative w-full aspect-[3/4] rounded-lg overflow-hidden"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Page edge effect */}
              <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-l from-black/20 to-transparent z-10 pointer-events-none" />
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-r from-black/10 to-transparent z-10 pointer-events-none" />

              {currentPage === 0
                ? renderCover()
                : renderChapter(sortedChapters[currentPage - 1], currentPage - 1)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
