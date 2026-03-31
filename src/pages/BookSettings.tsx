import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Save, Trash2, Copy, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const genres = ['Fiction', 'Non-Fiction', 'Self-Help', 'Technical', 'Business', 'Children', 'Biography', 'Fantasy', 'Mystery', 'Other'];
const tones = ['Academic', 'Conversational', 'Storytelling', 'Professional', 'Humorous', 'Inspirational'];
const statuses = ['draft', 'in_progress', 'complete'];

export default function BookSettings() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('English');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Conversational');
  const [status, setStatus] = useState('draft');
  const [wordCountGoal, setWordCountGoal] = useState('');
  const [totalWordCount, setTotalWordCount] = useState(0);

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    const { data, error } = await supabase.from('books').select('*').eq('id', id!).single();
    if (error || !data) { navigate('/dashboard'); return; }
    const b = data as any;
    setTitle(b.title); setSubtitle(b.subtitle || ''); setAuthor(b.author);
    setGenre(b.genre); setLanguage(b.language); setDescription(b.description || '');
    setTone(b.tone || 'Conversational'); setStatus(b.status);
    setWordCountGoal(b.word_count_goal?.toString() || '');
    setTotalWordCount(b.total_word_count || 0);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('books').update({
      title, subtitle: subtitle || null, author, genre, language,
      description, tone, status,
      word_count_goal: wordCountGoal ? parseInt(wordCountGoal) : null,
    }).eq('id', id!);
    setSaving(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Settings saved ✓' });
  };

  const duplicateBook = async () => {
    const { data: original } = await supabase.from('books').select('*').eq('id', id!).single();
    if (!original) return;
    const o = original as any;
    const { data: newBook } = await supabase.from('books').insert({
      ...o, id: undefined, title: `${o.title} (Copy)`, created_at: undefined, updated_at: undefined,
    }).select().single();
    if (newBook) {
      const { data: chapters } = await supabase.from('chapters').select('*').eq('book_id', id!);
      if (chapters?.length) {
        await supabase.from('chapters').insert(
          chapters.map((c: any) => ({ ...c, id: undefined, book_id: (newBook as any).id, created_at: undefined, updated_at: undefined }))
        );
      }
      toast({ title: 'Book duplicated!' });
      navigate(`/books/${(newBook as any).id}/settings`);
    }
  };

  const deleteBook = async () => {
    if (confirmDelete !== title) return;
    await supabase.from('books').delete().eq('id', id!);
    toast({ title: 'Book deleted' });
    navigate('/dashboard');
  };

  const goalProgress = wordCountGoal ? Math.min(100, Math.round((totalWordCount / parseInt(wordCountGoal)) * 100)) : 0;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 flex h-14 items-center gap-4">
          <Link to={`/books/${id}/edit`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex items-center gap-2">
            <div className="gradient-primary rounded-lg p-1"><BookOpen className="h-4 w-4 text-white" /></div>
            <span className="font-bold">Book Settings</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <h2 className="text-2xl font-bold">Book Details</h2>
          <div className="glass rounded-xl p-6 space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" /></div>
            <div><Label>Subtitle</Label><Input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="mt-1" /></div>
            <div><Label>Author</Label><Input value={author} onChange={e => setAuthor(e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{tones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Language</Label><Input value={language} onChange={e => setLanguage(e.target.value)} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1" rows={3} /></div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        <div className="glass rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">Word Count Goal</h3>
          <Input type="number" value={wordCountGoal} onChange={e => setWordCountGoal(e.target.value)} placeholder="e.g. 50000" />
          {wordCountGoal && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{totalWordCount.toLocaleString()} / {parseInt(wordCountGoal).toLocaleString()}</span>
                <span>{goalProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={save} disabled={saving} className="gradient-primary border-0 text-white">
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={duplicateBook}>
            <Copy className="h-4 w-4 mr-2" /> Duplicate Book
          </Button>
        </div>

        <div className="glass rounded-xl p-6 border-destructive/30 space-y-4">
          <h3 className="font-semibold text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">Type the book title to confirm deletion.</p>
          <Input value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} placeholder={title} />
          <Button variant="destructive" disabled={confirmDelete !== title} onClick={deleteBook}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete Book Permanently
          </Button>
        </div>
      </main>
    </div>
  );
}
