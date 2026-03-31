import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ArrowLeft, Save, Eye, EyeOff, Maximize, Minimize,
  Plus, Trash2, GripVertical, Sparkles, Loader2, MessageSquare,
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code, Link as LinkIcon,
  ChevronLeft, ChevronRight, Send, X, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ExportModal from '@/components/ExportModal';

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  content: string;
  order_index: number;
  word_count: number;
  status: string;
  key_points: string[];
  estimated_word_count: number | null;
}

interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  genre: string;
  tone: string | null;
  description: string | null;
  cover_image: string | null;
}

const statusColors: Record<string, string> = {
  not_started: 'bg-muted-foreground',
  in_progress: 'bg-amber-500',
  done: 'bg-success',
};

export default function BookEdit() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const saveTimer = useRef<NodeJS.Timeout>();
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchBook();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [id]);

  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (activeChapterId && content) saveChapter(false);
    }, 30000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [activeChapterId, content]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveChapter(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); setShowPreview(p => !p); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') { e.preventDefault(); setFocusMode(f => !f); }
      if (e.key === 'Escape' && focusMode) setFocusMode(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeChapterId, content, focusMode]);

  const fetchBook = async () => {
    const [bookRes, chapRes] = await Promise.all([
      supabase.from('books').select('*').eq('id', id!).single(),
      supabase.from('chapters').select('*').eq('book_id', id!).order('order_index'),
    ]);
    if (bookRes.error || !bookRes.data) {
      toast({ title: 'Book not found', variant: 'destructive' });
      navigate('/dashboard');
      return;
    }
    setBook(bookRes.data as unknown as Book);
    const chaps = (chapRes.data || []) as unknown as Chapter[];
    setChapters(chaps);
    if (chaps.length > 0) {
      setActiveChapterId(chaps[0].id);
      setContent(chaps[0].content);
      setChapterTitle(chaps[0].title);
    }
    setLoading(false);
  };

  const selectChapter = (ch: Chapter) => {
    if (activeChapterId && content !== chapters.find(c => c.id === activeChapterId)?.content) {
      saveChapter(false);
    }
    setActiveChapterId(ch.id);
    setContent(ch.content);
    setChapterTitle(ch.title);
  };

  const saveChapter = async (showToast = true) => {
    if (!activeChapterId) return;
    setSaving(true);
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const { error } = await supabase.from('chapters').update({
      content, title: chapterTitle, word_count: wordCount,
      status: wordCount > 0 ? 'in_progress' : 'not_started',
    }).eq('id', activeChapterId);

    if (error) {
      if (showToast) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      setChapters(chs => chs.map(c => c.id === activeChapterId ? { ...c, content, title: chapterTitle, word_count: wordCount, status: wordCount > 0 ? 'in_progress' : 'not_started' } : c));
      // Update book total word count
      const total = chapters.reduce((s, c) => s + (c.id === activeChapterId ? wordCount : c.word_count), 0);
      await supabase.from('books').update({ total_word_count: total }).eq('id', id!);
      if (showToast) toast({ title: 'Saved ✓' });
    }
    setSaving(false);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveChapter(false), 2000);
  };

  const addChapter = async () => {
    const newOrder = chapters.length;
    const { data, error } = await supabase.from('chapters').insert({
      book_id: id!, title: `Chapter ${newOrder + 1}`, content: '', order_index: newOrder,
      word_count: 0, status: 'not_started',
    }).select().single();
    if (!error && data) {
      const ch = data as unknown as Chapter;
      setChapters([...chapters, ch]);
      selectChapter(ch);
    }
  };

  const deleteChapter = async (chId: string) => {
    await supabase.from('chapters').delete().eq('id', chId);
    const remaining = chapters.filter(c => c.id !== chId);
    setChapters(remaining);
    if (activeChapterId === chId && remaining.length > 0) selectChapter(remaining[0]);
    else if (remaining.length === 0) { setActiveChapterId(null); setContent(''); setChapterTitle(''); }
  };

  const writeWithAI = async () => {
    if (!book || !activeChapterId) return;
    setAiGenerating(true);
    const activeChapter = chapters.find(c => c.id === activeChapterId);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'write_chapter',
          bookTitle: book.title,
          genre: book.genre,
          tone: book.tone,
          chapterTitle: activeChapter?.title,
          chapterDescription: activeChapter?.description,
          keyPoints: activeChapter?.key_points,
          existingContent: content,
        }),
      });
      if (!resp.ok) throw new Error('AI request failed');

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generated = content;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIndex: number;
        while ((nlIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nlIndex);
          buffer = buffer.slice(nlIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ') || line.trim() === '' || line.startsWith(':')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              generated += delta;
              setContent(generated);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    }
    setAiGenerating(false);
  };

  const sendAiChat = async () => {
    if (!aiInput.trim()) return;
    const userMsg = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiChatLoading(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'chat',
          messages: [...aiMessages, userMsg],
          context: content.slice(-2000),
          bookTitle: book?.title,
        }),
      });
      if (!resp.ok) throw new Error('AI chat failed');

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIndex: number;
        while ((nlIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nlIndex);
          buffer = buffer.slice(nlIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    }
    setAiChatLoading(false);
  };

  const insertMarkdown = (prefix: string, suffix = '') => {
    const textarea = document.querySelector('textarea[data-editor]') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(newContent);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);
  const totalWords = chapters.reduce((s, c) => s + c.word_count, 0);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      {!focusMode && (
        <header className="border-b border-border glass flex items-center justify-between px-4 h-12 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link to="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div className="gradient-primary rounded p-1"><BookOpen className="h-3.5 w-3.5 text-white" /></div>
            <span className="font-semibold text-sm truncate max-w-[200px]">{book?.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => saveChapter()} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" /> {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPreview(p => !p)}>
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFocusMode(true)}>
              <Maximize className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAiChat(c => !c)}>
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowExport(true)}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar - chapters */}
        {!focusMode && showSidebar && (
          <aside className="w-64 border-r border-border glass flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Chapters</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSidebar(false)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{totalWords.toLocaleString()} words · {Math.ceil(totalWords / 200)} min read</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {chapters.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => selectChapter(ch)}
                  className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors group ${activeChapterId === ch.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[ch.status]}`} />
                    <span className="truncate font-medium">{ch.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-7">{ch.word_count} words</span>
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full" onClick={addChapter}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Chapter
              </Button>
            </div>
          </aside>
        )}

        {!focusMode && !showSidebar && (
          <Button variant="ghost" size="icon" className="absolute left-2 top-2 z-10 h-8 w-8" onClick={() => setShowSidebar(true)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Floating toolbar */}
          {!focusMode && (
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card/50">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('**', '**')}><Bold className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('*', '*')}><Italic className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('# ')}><Heading1 className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('## ')}><Heading2 className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('- ')}><List className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('1. ')}><ListOrdered className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('> ')}><Quote className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('`', '`')}><Code className="h-3.5 w-3.5" /></Button>
              <div className="flex-1" />
              <Button size="sm" onClick={writeWithAI} disabled={aiGenerating} className="gradient-primary border-0 text-white text-xs h-7">
                {aiGenerating ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Writing...</> : <><Sparkles className="h-3 w-3 mr-1" /> Write with AI</>}
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex">
            {/* Editor pane */}
            <div className={`flex-1 flex flex-col overflow-hidden ${focusMode ? 'max-w-3xl mx-auto' : ''}`}>
              <div className="p-4 pb-0">
                <input
                  value={chapterTitle}
                  onChange={e => setChapterTitle(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-0 outline-none w-full font-book"
                  placeholder="Chapter Title"
                />
                <p className="text-xs text-muted-foreground mt-1">{wordCount} words · {readingTime} min read</p>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <textarea
                  data-editor
                  value={content}
                  onChange={e => handleContentChange(e.target.value)}
                  className="w-full h-full resize-none bg-transparent border-0 outline-none font-book text-base leading-relaxed"
                  placeholder="Start writing..."
                />
              </div>
            </div>

            {/* Preview pane */}
            {showPreview && !focusMode && (
              <div className="w-[420px] border-l border-border overflow-y-auto p-6 bg-card/30 flex-shrink-0">
                <div className="max-w-[65ch] mx-auto font-book">
                  <h1 className="text-2xl font-bold mb-4">{chapterTitle || 'Untitled'}</h1>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Start writing to see preview...*'}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Chat Panel */}
        <AnimatePresence>
          {showAiChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border glass flex flex-col flex-shrink-0 overflow-hidden"
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">AI Assistant</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAiChat(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {aiMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="h-8 w-8 text-primary/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Ask me anything about your writing</p>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {['Make this more engaging', 'Add a compelling hook', 'Simplify this explanation'].map(q => (
                        <button key={q} onClick={() => { setAiInput(q); }} className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {aiMessages.map((m, i) => (
                  <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-[85%] p-3 rounded-xl ${m.role === 'user' ? 'gradient-primary text-white' : 'bg-muted'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {aiChatLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendAiChat()}
                    placeholder="Ask AI..."
                    className="text-sm"
                  />
                  <Button size="icon" className="h-9 w-9 gradient-primary border-0" onClick={sendAiChat} disabled={aiChatLoading}>
                    <Send className="h-3.5 w-3.5 text-white" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Focus mode overlay */}
      {focusMode && (
        <div className="fixed inset-0 pointer-events-none z-10" style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, hsl(var(--background)) 100%)'
        }} />
      )}
      {focusMode && (
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 right-4 z-20"
          onClick={() => setFocusMode(false)}
        >
          <Minimize className="h-4 w-4 mr-1" /> Exit Focus
        </Button>
      )}

      <ExportModal open={showExport} onClose={() => setShowExport(false)} book={book} chapters={chapters} />
    </div>
  );
}
