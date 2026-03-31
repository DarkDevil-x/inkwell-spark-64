import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, FileDown, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';

interface Chapter {
  title: string;
  content: string;
  order_index: number;
  word_count: number;
}

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  book: { title: string; subtitle: string | null; author: string; genre: string; description: string | null } | null;
  chapters: Chapter[];
}

export default function ExportModal({ open, onClose, book, chapters }: ExportModalProps) {
  const [exporting, setExporting] = useState<'pdf' | 'md' | null>(null);
  const [done, setDone] = useState<'pdf' | 'md' | null>(null);

  const resetState = () => { setExporting(null); setDone(null); };

  const handleClose = () => { resetState(); onClose(); };

  const sortedChapters = [...chapters].sort((a, b) => a.order_index - b.order_index);

  const exportMarkdown = () => {
    setExporting('md');
    const lines: string[] = [];
    lines.push(`# ${book?.title || 'Untitled'}`);
    if (book?.subtitle) lines.push(`## ${book.subtitle}`);
    lines.push(`**By ${book?.author || 'Unknown'}**`);
    if (book?.description) lines.push(`\n> ${book.description}`);
    lines.push('\n---\n');
    lines.push('## Table of Contents\n');
    sortedChapters.forEach((ch, i) => {
      lines.push(`${i + 1}. ${ch.title}`);
    });
    lines.push('\n---\n');
    sortedChapters.forEach((ch, i) => {
      lines.push(`\n## Chapter ${i + 1}: ${ch.title}\n`);
      lines.push(ch.content || '*No content yet.*');
      lines.push('\n---\n');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(book?.title || 'book').replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
    setDone('md');
    setTimeout(resetState, 2000);
  };

  const exportPDF = async () => {
    setExporting('pdf');

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = pageW - margin * 2;

      // ── Cover Page ──
      // Background
      doc.setFillColor(15, 15, 26); // --background
      doc.rect(0, 0, pageW, pageH, 'F');

      // Accent stripe
      doc.setFillColor(79, 70, 229); // --primary
      doc.rect(0, pageH * 0.35, pageW, 3, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(book?.title || 'Untitled', contentW);
      doc.text(titleLines, pageW / 2, pageH * 0.4, { align: 'center' });

      // Subtitle
      if (book?.subtitle) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(180, 180, 200);
        doc.text(book.subtitle, pageW / 2, pageH * 0.4 + titleLines.length * 12 + 8, { align: 'center' });
      }

      // Author
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 160, 180);
      doc.text(`by ${book?.author || 'Unknown'}`, pageW / 2, pageH * 0.65, { align: 'center' });

      // Genre badge
      if (book?.genre) {
        doc.setFontSize(10);
        doc.setTextColor(124, 58, 237);
        doc.text(book.genre.toUpperCase(), pageW / 2, pageH * 0.72, { align: 'center' });
      }

      // ── Table of Contents ──
      doc.addPage();
      doc.setFillColor(15, 15, 26);
      doc.rect(0, 0, pageW, pageH, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Table of Contents', margin, 35);

      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.line(margin, 40, margin + 60, 40);

      let tocY = 55;
      sortedChapters.forEach((ch, i) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 200, 220);
        const num = `${i + 1}.`;
        doc.text(num, margin, tocY);
        doc.text(ch.title, margin + 12, tocY);

        // Word count
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 140);
        doc.text(`${ch.word_count} words`, pageW - margin, tocY, { align: 'right' });

        tocY += 10;
        if (tocY > pageH - 30) {
          doc.addPage();
          doc.setFillColor(15, 15, 26);
          doc.rect(0, 0, pageW, pageH, 'F');
          tocY = 30;
        }
      });

      // ── Chapters ──
      sortedChapters.forEach((ch, idx) => {
        doc.addPage();
        doc.setFillColor(15, 15, 26);
        doc.rect(0, 0, pageW, pageH, 'F');

        // Chapter heading
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`CHAPTER ${idx + 1}`, margin, 30);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        const chTitleLines = doc.splitTextToSize(ch.title, contentW);
        doc.text(chTitleLines, margin, 42);

        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.3);
        const lineY = 42 + chTitleLines.length * 9 + 4;
        doc.line(margin, lineY, margin + 40, lineY);

        // Body text — strip markdown syntax for cleaner PDF
        const plainText = ch.content
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/`(.+?)`/g, '$1')
          .replace(/^[-*+]\s+/gm, '• ')
          .replace(/^\d+\.\s+/gm, '')
          .replace(/^>\s+/gm, '')
          .replace(/\[(.+?)\]\(.+?\)/g, '$1');

        doc.setTextColor(200, 200, 210);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        const bodyLines = doc.splitTextToSize(plainText || 'No content yet.', contentW);
        let y = lineY + 10;

        bodyLines.forEach((line: string) => {
          if (y > pageH - 25) {
            // Page number
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 120);
            doc.text(`${doc.getNumberOfPages()}`, pageW / 2, pageH - 10, { align: 'center' });

            doc.addPage();
            doc.setFillColor(15, 15, 26);
            doc.rect(0, 0, pageW, pageH, 'F');
            y = 25;
            doc.setFontSize(11);
            doc.setTextColor(200, 200, 210);
          }
          doc.text(line, margin, y);
          y += 6;
        });

        // Page number on last page of chapter
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 120);
        doc.text(`${doc.getNumberOfPages()}`, pageW / 2, pageH - 10, { align: 'center' });
      });

      doc.save(`${(book?.title || 'book').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      setExporting(null);
      setDone('pdf');
      setTimeout(resetState, 2000);
    } catch (err) {
      console.error('PDF export error:', err);
      setExporting(null);
    }
  };

  const totalWords = sortedChapters.reduce((s, c) => s + c.word_count, 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass rounded-2xl w-full max-w-lg border border-border overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-xl font-bold">Export Book</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {sortedChapters.length} chapters · {totalWords.toLocaleString()} words
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Export Options */}
            <div className="p-6 space-y-3">
              {/* PDF */}
              <button
                onClick={exportPDF}
                disabled={exporting !== null}
                className="w-full group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  {exporting === 'pdf' ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : done === 'pdf' ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <FileDown className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    Export as PDF
                    {done === 'pdf' && <span className="text-xs text-success font-normal">Downloaded!</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Styled cover page, table of contents, and formatted chapters with page numbers
                  </p>
                </div>
              </button>

              {/* Markdown */}
              <button
                onClick={exportMarkdown}
                disabled={exporting !== null}
                className="w-full group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-left disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  {exporting === 'md' ? (
                    <Loader2 className="h-5 w-5 text-accent animate-spin" />
                  ) : done === 'md' ? (
                    <CheckCircle className="h-5 w-5 text-accent" />
                  ) : (
                    <FileText className="h-5 w-5 text-accent" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    Export as Markdown
                    {done === 'md' && <span className="text-xs text-success font-normal">Downloaded!</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Single .md file with chapter separators, ready for any editor
                  </p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <p className="text-xs text-muted-foreground text-center">
                All exports are generated locally in your browser
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
