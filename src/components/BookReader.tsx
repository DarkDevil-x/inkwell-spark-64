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
        rotateY: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -90 : 90,
      opacity: 0,
      transformOrigin: dir > 0 ? 'right center' : 'left center',
      transition: {
        rotateY: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
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
    <div className="w-full h-full overflow-y-auto bg-white rounded-lg">
      <div className="max-w-[65ch] mx-auto px-10 py-12 md:px-14 md:py-16">
        {/* Chapter label */}
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-3 font-sans">
          Chapter {index + 1}
        </p>

        {/* Chapter title */}
        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-book text-gray-900 leading-tight">
          {ch.title}
        </h2>

        {/* Decorative divider */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-10 h-[3px] bg-red-500 rounded-full" />
          <div className="w-2 h-2 rounded-full bg-red-500/40" />
        </div>

        {/* Chapter content with rich styling */}
        <div className="book-reader-content font-book text-gray-800 text-[15px] leading-[2]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b-2 border-red-500/30">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-red-700 mt-8 mb-3">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-indigo-700 mt-6 mb-2">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-base font-semibold text-gray-700 mt-5 mb-2 uppercase tracking-wide text-sm">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="mb-5 text-gray-700 leading-[2]">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-red-600">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-indigo-600">{children}</em>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-red-400 bg-red-50 pl-5 py-3 pr-4 my-6 rounded-r-lg text-gray-600 italic">
                  {children}
                </blockquote>
              ),
              ul: ({ children }) => (
                <ul className="my-5 ml-1 space-y-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-5 ml-1 space-y-2 list-decimal list-inside">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-red-400 mt-[2px] text-lg leading-none">•</span>
                  <span className="flex-1">{children}</span>
                </li>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-');
                return isBlock ? (
                  <pre className="bg-gray-900 text-green-300 rounded-lg p-4 my-6 overflow-x-auto text-sm font-mono">
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                );
              },
              hr: () => (
                <div className="flex items-center justify-center my-10 gap-2">
                  <div className="w-8 h-[1px] bg-gray-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <div className="w-8 h-[1px] bg-gray-300" />
                </div>
              ),
              a: ({ children, href }) => (
                <a href={href} className="text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800">{children}</a>
              ),
              table: ({ children }) => (
                <div className="my-6 overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="bg-gray-100 text-left px-4 py-2 font-semibold text-gray-700 border-b border-gray-200">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2 border-b border-gray-100 text-gray-600">{children}</td>
              ),
            }}
          >
            {ch.content || '*This chapter has no content yet.*'}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="mt-14 pt-6 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-400">{ch.word_count.toLocaleString()} words</p>
          <p className="text-xs text-gray-400">Chapter {index + 1}</p>
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
