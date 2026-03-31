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
  book: { title: string; subtitle: string | null; author: string; genre: string; description: string | null; cover_image?: string | null } | null;
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

      // ── Cover Image Page (if available) ──
      if (book?.cover_image) {
        try {
          const response = await fetch(book.cover_image);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          // Fill background
          doc.setFillColor(15, 15, 26);
          doc.rect(0, 0, pageW, pageH, 'F');

          // Center the cover image on the page with padding
          const imgPadding = 15;
          const maxW = pageW - imgPadding * 2;
          const maxH = pageH - imgPadding * 2;

          // Create a temp image to get dimensions
          const img = new Image();
          img.src = dataUrl;
          await new Promise((resolve) => { img.onload = resolve; });

          const ratio = Math.min(maxW / img.width, maxH / img.height);
          const imgW = img.width * ratio;
          const imgH = img.height * ratio;
          const imgX = (pageW - imgW) / 2;
          const imgY = (pageH - imgH) / 2;

          doc.addImage(dataUrl, 'JPEG', imgX, imgY, imgW, imgH);

          // Start a new page for the text cover
          doc.addPage();
        } catch (e) {
          console.warn('Failed to load cover image for PDF:', e);
        }
      }

      // ── Title Page (white, matching reader) ──
      // White background (default)
      doc.setFontSize(11);
      doc.setTextColor(160, 160, 160);
      doc.setFont('helvetica', 'normal');
      doc.text('CHAPTER 0', pageW / 2, pageH * 0.3, { align: 'center' });

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(book?.title || 'Untitled', contentW);
      doc.text(titleLines, pageW / 2, pageH * 0.38, { align: 'center' });

      // Red divider
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(1);
      const dividerY = pageH * 0.38 + titleLines.length * 12 + 6;
      doc.line(pageW / 2 - 15, dividerY, pageW / 2 + 15, dividerY);

      if (book?.subtitle) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(book.subtitle, pageW / 2, dividerY + 12, { align: 'center' });
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`by ${book?.author || 'Unknown'}`, pageW / 2, pageH * 0.62, { align: 'center' });

      if (book?.genre) {
        doc.setFontSize(10);
        doc.setTextColor(79, 70, 229);
        doc.text(book.genre.toUpperCase(), pageW / 2, pageH * 0.68, { align: 'center' });
      }

      // ── Table of Contents ──
      doc.addPage();
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Table of Contents', margin, 35);

      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.8);
      doc.line(margin, 40, margin + 50, 40);

      let tocY = 55;
      sortedChapters.forEach((ch, i) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(`${i + 1}.`, margin, tocY);
        doc.text(ch.title, margin + 12, tocY);

        doc.setFontSize(9);
        doc.setTextColor(160, 160, 160);
        doc.text(`${ch.word_count} words`, pageW - margin, tocY, { align: 'right' });

        tocY += 12;
        if (tocY > pageH - 30) {
          doc.addPage();
          tocY = 30;
        }
      });

      // ── Chapters (white pages, colored text) ──
      const addPageNum = () => {
        doc.setFontSize(9);
        doc.setTextColor(180, 180, 180);
        doc.text(`${doc.getNumberOfPages()}`, pageW / 2, pageH - 12, { align: 'center' });
      };

      const newPage = () => {
        addPageNum();
        doc.addPage();
        return margin + 5;
      };

      const checkPage = (y: number, needed: number) => {
        if (y + needed > pageH - 25) return newPage();
        return y;
      };

      sortedChapters.forEach((ch, idx) => {
        doc.addPage();

        // Chapter label
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`CHAPTER ${idx + 1}`, margin, 28);

        // Chapter title
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        const chTitleLines = doc.splitTextToSize(ch.title, contentW);
        doc.text(chTitleLines, margin, 38);

        // Red divider
        const divY = 38 + chTitleLines.length * 9 + 4;
        doc.setDrawColor(220, 38, 38);
        doc.setLineWidth(0.8);
        doc.line(margin, divY, margin + 14, divY);
        doc.setFillColor(220, 38, 38);
        doc.circle(margin + 18, divY, 0.8, 'F');

        let y = divY + 12;

        // Parse markdown line by line for styled output
        const lines = (ch.content || 'No content yet.').split('\n');

        lines.forEach((rawLine) => {
          const line = rawLine.trimEnd();

          // Horizontal rule
          if (/^(---|\*\*\*|___)/.test(line)) {
            y = checkPage(y, 12);
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(margin + 20, y, pageW - margin - 20, y);
            doc.setFillColor(220, 38, 38);
            doc.circle(pageW / 2, y, 0.6, 'F');
            y += 10;
            return;
          }

          // Empty line = paragraph spacing
          if (line.trim() === '') {
            y += 4;
            return;
          }

          // Headings
          const h1Match = line.match(/^#\s+(.*)/);
          const h2Match = line.match(/^##\s+(.*)/);
          const h3Match = line.match(/^###\s+(.*)/);
          const h4Match = line.match(/^####\s+(.*)/);

          if (h1Match) {
            y = checkPage(y, 16);
            y += 6;
            doc.setTextColor(30, 30, 30);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            const wrapped = doc.splitTextToSize(h1Match[1], contentW);
            wrapped.forEach((wl: string) => { y = checkPage(y, 8); doc.text(wl, margin, y); y += 8; });
            // Red underline
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.5);
            doc.line(margin, y, margin + 40, y);
            y += 6;
            return;
          }

          if (h2Match) {
            y = checkPage(y, 14);
            y += 4;
            doc.setTextColor(185, 28, 28); // red-700
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            const wrapped = doc.splitTextToSize(h2Match[1], contentW);
            wrapped.forEach((wl: string) => { y = checkPage(y, 7); doc.text(wl, margin, y); y += 7; });
            y += 4;
            return;
          }

          if (h3Match) {
            y = checkPage(y, 12);
            y += 3;
            doc.setTextColor(67, 56, 202); // indigo-700
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            const wrapped = doc.splitTextToSize(h3Match[1], contentW);
            wrapped.forEach((wl: string) => { y = checkPage(y, 6); doc.text(wl, margin, y); y += 6; });
            y += 3;
            return;
          }

          if (h4Match) {
            y = checkPage(y, 10);
            y += 2;
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(h4Match[1].toUpperCase(), margin, y);
            y += 8;
            return;
          }

          // Blockquote
          if (line.startsWith('>')) {
            const quoteText = line.replace(/^>\s*/, '');
            y = checkPage(y, 12);
            // Red left border bar
            doc.setFillColor(248, 113, 113); // red-400
            doc.rect(margin, y - 4, 1.2, 10, 'F');
            // Light red background
            doc.setFillColor(254, 242, 242); // red-50
            doc.rect(margin + 2, y - 4, contentW - 2, 10, 'F');
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            const wrapped = doc.splitTextToSize(quoteText, contentW - 10);
            wrapped.forEach((wl: string) => { doc.text(wl, margin + 5, y); y += 5; });
            y += 5;
            return;
          }

          // List items
          const ulMatch = line.match(/^[-*+]\s+(.*)/);
          const olMatch = line.match(/^(\d+)\.\s+(.*)/);

          if (ulMatch) {
            y = checkPage(y, 7);
            doc.setFillColor(220, 38, 38);
            doc.circle(margin + 2, y - 1.2, 0.8, 'F');
            doc.setTextColor(70, 70, 70);
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'normal');
            const wrapped = doc.splitTextToSize(ulMatch[1], contentW - 10);
            wrapped.forEach((wl: string, wi: number) => { y = checkPage(y, 5.5); doc.text(wl, margin + 6, y); y += 5.5; });
            y += 1;
            return;
          }

          if (olMatch) {
            y = checkPage(y, 7);
            doc.setTextColor(220, 38, 38);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${olMatch[1]}.`, margin, y);
            doc.setTextColor(70, 70, 70);
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'normal');
            const wrapped = doc.splitTextToSize(olMatch[2], contentW - 10);
            wrapped.forEach((wl: string) => { y = checkPage(y, 5.5); doc.text(wl, margin + 8, y); y += 5.5; });
            y += 1;
            return;
          }

          // Regular paragraph — render with inline bold/italic coloring
          // Parse inline formatting segments
          const segments: { text: string; bold: boolean; italic: boolean }[] = [];
          let remaining = line;
          const inlineRe = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/;
          while (remaining) {
            const m = remaining.match(inlineRe);
            if (!m || m.index === undefined) {
              segments.push({ text: remaining, bold: false, italic: false });
              break;
            }
            if (m.index > 0) segments.push({ text: remaining.slice(0, m.index), bold: false, italic: false });
            if (m[2]) segments.push({ text: m[2], bold: true, italic: false });
            else if (m[3]) segments.push({ text: m[3], bold: false, italic: true });
            else if (m[4]) segments.push({ text: m[4], bold: false, italic: true });
            remaining = remaining.slice((m.index || 0) + m[0].length);
          }

          // Strip any remaining markdown link syntax
          const fullPlain = segments.map(s => s.text).join('').replace(/\[(.+?)\]\(.+?\)/g, '$1');

          // Wrap the full plain text, then render each wrapped line
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'normal');
          const wrapped = doc.splitTextToSize(fullPlain, contentW);
          wrapped.forEach((wl: string) => {
            y = checkPage(y, 6);

            // Try to match segments for coloring on this wrapped line
            // Simple approach: check if the original line had bold segments
            const hasBoldContent = segments.some(s => s.bold && wl.includes(s.text));
            const hasItalicContent = segments.some(s => s.italic && wl.includes(s.text));

            if (hasBoldContent) {
              // Render the whole line, coloring bold parts red
              let xPos = margin;
              let lineRemaining = wl;
              for (const seg of segments) {
                if (!lineRemaining) break;
                const segIdx = lineRemaining.indexOf(seg.text);
                if (segIdx === -1) continue;

                // Text before this segment
                if (segIdx > 0) {
                  const before = lineRemaining.slice(0, segIdx);
                  doc.setTextColor(70, 70, 70);
                  doc.setFont('helvetica', 'normal');
                  doc.text(before, xPos, y);
                  xPos += doc.getTextWidth(before);
                }

                // The segment itself
                if (seg.bold) {
                  doc.setTextColor(220, 38, 38); // red
                  doc.setFont('helvetica', 'bold');
                } else if (seg.italic) {
                  doc.setTextColor(67, 56, 202); // indigo
                  doc.setFont('helvetica', 'italic');
                } else {
                  doc.setTextColor(70, 70, 70);
                  doc.setFont('helvetica', 'normal');
                }
                doc.text(seg.text, xPos, y);
                xPos += doc.getTextWidth(seg.text);
                lineRemaining = lineRemaining.slice(segIdx + seg.text.length);
              }
              if (lineRemaining) {
                doc.setTextColor(70, 70, 70);
                doc.setFont('helvetica', 'normal');
                doc.text(lineRemaining, xPos, y);
              }
            } else {
              doc.setTextColor(70, 70, 70);
              doc.setFont('helvetica', 'normal');
              doc.text(wl, margin, y);
            }
            y += 6;
          });
          y += 2; // paragraph spacing
        });

        addPageNum();
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
