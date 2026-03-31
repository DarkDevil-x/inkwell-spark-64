import { useState, useRef } from 'react';
import { Upload, Sparkles, Loader2, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CoverImageStepProps {
  coverUrl: string;
  onCoverChange: (url: string) => void;
  title: string;
  genre: string;
}

export default function CoverImageStep({ coverUrl, onCoverChange, title, genre }: CoverImageStepProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'ai'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `upload-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('covers').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
      onCoverChange(data.publicUrl);
      toast({ title: 'Cover uploaded!' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const generateCover = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-cover', {
        body: { prompt: aiPrompt, title, genre },
      });
      if (error) throw error;
      if (data?.url) {
        onCoverChange(data.url);
        toast({ title: 'Cover generated!' });
      } else {
        throw new Error('No image returned');
      }
    } catch (err: any) {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <Label>Cover Image (Optional)</Label>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button type="button" variant={mode === 'ai' ? 'default' : 'outline'} size="sm" onClick={() => setMode('ai')} className={mode === 'ai' ? 'gradient-primary border-0 text-white' : ''}>
          <Sparkles className="h-3.5 w-3.5 mr-1" /> AI Generate
        </Button>
        <Button type="button" variant={mode === 'upload' ? 'default' : 'outline'} size="sm" onClick={() => setMode('upload')} className={mode === 'upload' ? 'gradient-primary border-0 text-white' : ''}>
          <Upload className="h-3.5 w-3.5 mr-1" /> Upload
        </Button>
      </div>

      {/* Preview */}
      {coverUrl && (
        <div className="relative w-40 h-56 rounded-lg overflow-hidden border border-border group">
          <img src={coverUrl} alt="Book cover" className="w-full h-full object-cover" />
          <button
            onClick={() => onCoverChange('')}
            className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* AI mode */}
      {mode === 'ai' && (
        <div className="space-y-2">
          <Textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder={`Describe your ideal cover, e.g. "A mystical forest at twilight with glowing fireflies"... Leave empty to auto-generate based on title & genre.`}
            rows={2}
            className="text-sm"
          />
          <Button type="button" onClick={generateCover} disabled={generating} className="gradient-primary border-0 text-white" size="sm">
            {generating ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Generating cover...</> : <><Sparkles className="h-3.5 w-3.5 mr-1" /> Generate Cover</>}
          </Button>
        </div>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} size="sm">
            {uploading ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Uploading...</> : <><ImageIcon className="h-3.5 w-3.5 mr-1" /> Choose Image</>}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP. Max 5MB.</p>
        </div>
      )}
    </div>
  );
}
