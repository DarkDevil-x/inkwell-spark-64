import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowLeft, ArrowRight, Sparkles, Loader2, GripVertical, Plus, Trash2, RefreshCw } from 'lucide-react';
import CoverImageStep from '@/components/book/CoverImageStep';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


interface ChapterOutline {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
  estimatedWordCount: number;
  keyPoints: string[];
}

const genres = ['Fiction', 'Non-Fiction', 'Self-Help', 'Technical', 'Business', 'Children', 'Biography', 'Fantasy', 'Mystery', 'Other'];
const tones = ['Academic', 'Conversational', 'Storytelling', 'Professional', 'Humorous', 'Inspirational'];

function SortableChapterItem({ chapter, index, onUpdate, onRemove }: {
  chapter: ChapterOutline;
  index: number;
  onUpdate: (i: number, field: string, value: string) => void;
  onRemove: (i: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.8 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`glass rounded-lg p-4 ${isDragging ? 'ring-2 ring-primary shadow-lg' : ''}`}>
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1 p-1 rounded hover:bg-muted">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 space-y-2">
          <Input value={chapter.title} onChange={e => onUpdate(index, 'title', e.target.value)} className="font-medium" />
          <Textarea value={chapter.description} onChange={e => onUpdate(index, 'description', e.target.value)} rows={2} className="text-sm" />
          <p className="text-xs text-muted-foreground">~{chapter.estimatedWordCount.toLocaleString()} words</p>
        </div>
        <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => onRemove(index)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function BookNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  // Step 1
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState(user?.user_metadata?.full_name || '');
  const [genre, setGenre] = useState('');
  const [audience, setAudience] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [coverUrl, setCoverUrl] = useState('');

  // Step 2
  const [topic, setTopic] = useState('');
  const [chapterCount, setChapterCount] = useState([8]);
  const [tone, setTone] = useState('Conversational');
  const [instructions, setInstructions] = useState('');
  const [chapters, setChapters] = useState<ChapterOutline[]>([]);
  const [generating, setGenerating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setChapters(prev => {
        const oldIndex = prev.findIndex(c => c.id === active.id);
        const newIndex = prev.findIndex(c => c.id === over.id);
        return arrayMove(prev, oldIndex, newIndex).map((c, i) => ({ ...c, chapterNumber: i + 1 }));
      });
    }
  };

  const generateOutline = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-outline', {
        body: { title, genre, topic, chapterCount: chapterCount[0], tone, audience, description, instructions },
      });
      if (error) throw error;
      const withIds = (data.chapters || []).map((c: any, i: number) => ({ ...c, id: crypto.randomUUID() }));
      setChapters(withIds);
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message || 'Failed to generate outline', variant: 'destructive' });
      // Generate placeholder chapters as fallback
      setChapters(Array.from({ length: chapterCount[0] }, (_, i) => ({
        id: crypto.randomUUID(),
        chapterNumber: i + 1,
        title: `Chapter ${i + 1}`,
        description: 'Click to edit this chapter description.',
        estimatedWordCount: 2000,
        keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
      })));
    }
    setGenerating(false);
  };

  const addChapter = () => {
    setChapters([...chapters, {
      id: crypto.randomUUID(),
      chapterNumber: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      description: '',
      estimatedWordCount: 2000,
      keyPoints: [],
    }]);
  };

  const removeChapter = (i: number) => {
    setChapters(chapters.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, chapterNumber: idx + 1 })));
  };

  const updateChapter = (i: number, field: string, value: string) => {
    setChapters(chapters.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const createBook = async () => {
    setCreating(true);
    try {
      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert({
          title, subtitle: subtitle || null, author, genre, language,
          description, tone, status: 'draft', user_id: user!.id,
          total_word_count: 0, cover_image: coverUrl || null,
        })
        .select()
        .single();
      if (bookError) throw bookError;

      if (chapters.length > 0) {
        const chapterRows = chapters.map((c, i) => ({
          book_id: book.id,
          title: c.title,
          description: c.description,
          content: '',
          order_index: i,
          word_count: 0,
          status: 'not_started',
          key_points: c.keyPoints,
          estimated_word_count: c.estimatedWordCount,
        }));
        const { error: chapError } = await supabase.from('chapters').insert(chapterRows);
        if (chapError) throw chapError;
      }

      toast({ title: 'Book created!' });
      navigate(`/books/${book.id}/edit`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const totalEstWords = chapters.reduce((s, c) => s + c.estimatedWordCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 flex h-14 items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex items-center gap-2">
            <div className="gradient-primary rounded-lg p-1"><BookOpen className="h-4 w-4 text-white" /></div>
            <span className="font-bold">New Book</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-8 max-w-2xl mx-auto">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 mx-2 transition-colors ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <h2 className="text-2xl font-bold">Book Details</h2>
                <div>
                  <Label>Title *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your book title" className="mt-1" />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Optional subtitle" className="mt-1" />
                </div>
                <div>
                  <Label>Author</Label>
                  <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" className="mt-1" />
                </div>
                <div>
                  <Label>Genre</Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select genre" /></SelectTrigger>
                    <SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Who is this book for?" className="mt-1" />
                </div>
                <div>
                  <Label>Description ({description.length}/500)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))} placeholder="Brief premise or description" className="mt-1" rows={3} />
                </div>
                <CoverImageStep coverUrl={coverUrl} onCoverChange={setCoverUrl} title={title} genre={genre} />
                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)} disabled={!title} className="gradient-primary border-0 text-white">
                    Next: AI Outline <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <h2 className="text-2xl font-bold">AI Outline Generator</h2>
                <div>
                  <Label>Core Topic / Theme</Label>
                  <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Main theme of your book" className="mt-1" />
                </div>
                <div>
                  <Label>Number of Chapters: {chapterCount[0]}</Label>
                  <Slider value={chapterCount} onValueChange={setChapterCount} min={3} max={30} step={1} className="mt-2" />
                </div>
                <div>
                  <Label>Writing Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{tones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Special Instructions</Label>
                  <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Any specific requirements..." className="mt-1" rows={2} />
                </div>

                <Button onClick={generateOutline} disabled={generating} className="w-full gradient-primary border-0 text-white">
                  {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> InkMind is thinking...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Outline with AI</>}
                </Button>

                {chapters.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Chapters ({chapters.length})</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={addChapter}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                        <Button variant="outline" size="sm" onClick={generateOutline}><RefreshCw className="h-3 w-3 mr-1" /> Regenerate</Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Drag chapters to reorder them</p>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {chapters.map((c, i) => (
                          <SortableChapterItem key={c.id} chapter={c} index={i} onUpdate={updateChapter} onRemove={removeChapter} />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(3)} disabled={chapters.length === 0} className="gradient-primary border-0 text-white">
                    Review & Create <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <h2 className="text-2xl font-bold">Confirm & Create</h2>
                <div className="glass rounded-xl p-6 space-y-3">
                  <div className="flex gap-4">
                    {coverUrl && <img src={coverUrl} alt="Cover" className="w-24 h-32 rounded-lg object-cover flex-shrink-0" />}
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">{title}</h3>
                      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
                      <p className="text-sm text-muted-foreground">By {author}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">{genre || 'No genre'}</Badge>
                    <Badge variant="secondary">{tone}</Badge>
                    <Badge variant="secondary">{language}</Badge>
                  </div>
                  <div className="border-t border-border pt-3 mt-3 flex gap-6 text-sm">
                    <span><strong>{chapters.length}</strong> chapters</span>
                    <span>~<strong>{totalEstWords.toLocaleString()}</strong> estimated words</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={createBook} disabled={creating} className="gradient-primary border-0 text-white">
                    {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : 'Create Book'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
