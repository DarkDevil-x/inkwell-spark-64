import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Flame, FileText, Clock, TrendingUp, Calendar,
  ArrowLeft, Moon, Sun, Trophy, Target, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { format, subDays, differenceInCalendarDays, startOfDay, parseISO } from 'date-fns';

interface WritingSession {
  id: string;
  date: string;
  words_written: number;
  duration_minutes: number | null;
  book_id: string | null;
  created_at: string;
}

interface Book {
  id: string;
  title: string;
  total_word_count: number;
  status: string;
}

const statVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }),
};

export default function Analytics() {
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('writing_sessions').select('*').order('date', { ascending: false }),
      supabase.from('books').select('id, title, total_word_count, status'),
    ]).then(([sessRes, bookRes]) => {
      setSessions((sessRes.data || []) as WritingSession[]);
      setBooks((bookRes.data || []) as Book[]);
      setLoading(false);
    });
  }, [user]);

  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  // ── Daily word count chart data ──
  const dailyData = useMemo(() => {
    const now = startOfDay(new Date());
    const map = new Map<string, number>();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = format(subDays(now, i), 'yyyy-MM-dd');
      map.set(d, 0);
    }
    sessions.forEach(s => {
      if (map.has(s.date)) map.set(s.date, (map.get(s.date) || 0) + s.words_written);
    });
    return Array.from(map.entries()).map(([date, words]) => ({
      date,
      label: format(parseISO(date), rangeDays <= 7 ? 'EEE' : rangeDays <= 30 ? 'MMM d' : 'M/d'),
      words,
    }));
  }, [sessions, rangeDays]);

  // ── Streak calculation ──
  const streak = useMemo(() => {
    const sessionDates = new Set(sessions.map(s => s.date));
    let count = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    // Check if wrote today or yesterday to start streak
    if (!sessionDates.has(today) && !sessionDates.has(format(subDays(new Date(), 1), 'yyyy-MM-dd'))) return 0;
    let d = sessionDates.has(today) ? new Date() : subDays(new Date(), 1);
    while (sessionDates.has(format(d, 'yyyy-MM-dd'))) {
      count++;
      d = subDays(d, 1);
    }
    return count;
  }, [sessions]);

  // ── Best streak ──
  const bestStreak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const dates = [...new Set(sessions.map(s => s.date))].sort();
    let best = 1, curr = 1;
    for (let i = 1; i < dates.length; i++) {
      if (differenceInCalendarDays(parseISO(dates[i]), parseISO(dates[i - 1])) === 1) {
        curr++;
        best = Math.max(best, curr);
      } else {
        curr = 1;
      }
    }
    return best;
  }, [sessions]);

  // ── Aggregate stats ──
  const totalWords = sessions.reduce((s, x) => s + x.words_written, 0);
  const totalMinutes = sessions.reduce((s, x) => s + (x.duration_minutes || 0), 0);
  const avgWordsPerDay = dailyData.length > 0 ? Math.round(totalWords / Math.max(sessions.length, 1)) : 0;
  const todayWords = sessions.filter(s => s.date === format(new Date(), 'yyyy-MM-dd')).reduce((s, x) => s + x.words_written, 0);

  // ── Heatmap data (last 90 days) ──
  const heatmapData = useMemo(() => {
    const now = startOfDay(new Date());
    const map = new Map<string, number>();
    for (let i = 90; i >= 0; i--) {
      map.set(format(subDays(now, i), 'yyyy-MM-dd'), 0);
    }
    sessions.forEach(s => {
      if (map.has(s.date)) map.set(s.date, (map.get(s.date) || 0) + s.words_written);
    });
    return Array.from(map.entries()).map(([date, words]) => ({ date, words }));
  }, [sessions]);

  const maxHeatmap = Math.max(...heatmapData.map(d => d.words), 1);

  const getHeatColor = (words: number) => {
    if (words === 0) return 'bg-muted/30';
    const ratio = words / maxHeatmap;
    if (ratio < 0.25) return 'bg-primary/20';
    if (ratio < 0.5) return 'bg-primary/40';
    if (ratio < 0.75) return 'bg-primary/60';
    return 'bg-primary/90';
  };

  // ── Book word count bar chart ──
  const bookData = books
    .filter(b => b.total_word_count > 0)
    .sort((a, b) => b.total_word_count - a.total_word_count)
    .slice(0, 8)
    .map(b => ({ name: b.title.length > 20 ? b.title.slice(0, 18) + '…' : b.title, words: b.total_word_count }));

  const barColors = [
    'hsl(243, 75%, 59%)', 'hsl(271, 81%, 56%)', 'hsl(160, 84%, 39%)',
    'hsl(199, 89%, 48%)', 'hsl(38, 92%, 50%)', 'hsl(338, 71%, 51%)',
    'hsl(262, 83%, 58%)', 'hsl(187, 85%, 43%)',
  ];

  const stats = [
    { label: 'Total Words', value: totalWords.toLocaleString(), icon: FileText, color: 'text-primary' },
    { label: 'Current Streak', value: `${streak} 🔥`, icon: Flame, color: 'text-orange-400' },
    { label: 'Best Streak', value: `${bestStreak} days`, icon: Trophy, color: 'text-amber-400' },
    { label: 'Today', value: todayWords.toLocaleString(), icon: Target, color: 'text-success' },
    { label: 'Avg / Session', value: avgWordsPerDay.toLocaleString(), icon: TrendingUp, color: 'text-accent' },
    { label: 'Time Writing', value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, icon: Clock, color: 'text-sky-400' },
  ];

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div className="gradient-primary rounded-lg p-1.5"><BookOpen className="h-4 w-4 text-white" /></div>
            <span className="font-bold">Writing Analytics</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggle}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              variants={statVariants}
              initial="hidden"
              animate="visible"
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-xl font-bold">{s.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Word Count Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Daily Word Count</h2>
              <p className="text-sm text-muted-foreground">Words written per day</p>
            </div>
            <div className="flex gap-1">
              {(['7d', '30d', '90d'] as const).map(r => (
                <Button
                  key={r}
                  variant={range === r ? 'default' : 'ghost'}
                  size="sm"
                  className={range === r ? 'gradient-primary border-0 text-white h-7 text-xs' : 'h-7 text-xs'}
                  onClick={() => setRange(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="wordGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 20%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(240, 5%, 50%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(240, 5%, 50%)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(240, 20%, 10%)', border: '1px solid hsl(240, 5%, 20%)', borderRadius: '12px', fontSize: 13 }}
                  labelStyle={{ color: 'hsl(240, 5%, 70%)' }}
                  formatter={(value: number) => [`${value.toLocaleString()} words`, 'Words']}
                />
                <Area type="monotone" dataKey="words" stroke="hsl(243, 75%, 59%)" strokeWidth={2} fill="url(#wordGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Activity Heatmap */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2"><Calendar className="h-5 w-5 text-primary" /> Activity Heatmap</h2>
            <p className="text-sm text-muted-foreground mb-4">Last 91 days of writing activity</p>
            <div className="flex flex-wrap gap-1">
              {heatmapData.map(d => (
                <div
                  key={d.date}
                  className={`w-3 h-3 rounded-sm ${getHeatColor(d.words)} transition-colors`}
                  title={`${format(parseISO(d.date), 'MMM d')}: ${d.words} words`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-muted/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/20" />
              <div className="w-3 h-3 rounded-sm bg-primary/40" />
              <div className="w-3 h-3 rounded-sm bg-primary/60" />
              <div className="w-3 h-3 rounded-sm bg-primary/90" />
              <span>More</span>
            </div>
          </motion.div>

          {/* Words by Book */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2"><BookOpen className="h-5 w-5 text-primary" /> Words by Book</h2>
            <p className="text-sm text-muted-foreground mb-4">Total word count per book</p>
            {bookData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No books with content yet</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 20%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(240, 5%, 50%)' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(240, 5%, 50%)' }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(240, 20%, 10%)', border: '1px solid hsl(240, 5%, 20%)', borderRadius: '12px', fontSize: 13 }}
                      formatter={(value: number) => [`${value.toLocaleString()} words`, 'Words']}
                    />
                    <Bar dataKey="words" radius={[0, 6, 6, 0]}>
                      {bookData.map((_, i) => (
                        <Cell key={i} fill={barColors[i % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Sessions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Zap className="h-5 w-5 text-primary" /> Recent Writing Sessions</h2>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-10 w-10 text-primary/20 mx-auto mb-3" />
              <p className="text-muted-foreground">No writing sessions recorded yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Sessions are tracked automatically as you write.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sessions.slice(0, 20).map((s, i) => {
                const bookName = books.find(b => b.id === s.book_id)?.title || 'Unknown';
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium">{bookName}</span>
                        <p className="text-xs text-muted-foreground">{format(parseISO(s.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{s.words_written.toLocaleString()} words</span>
                      {s.duration_minutes && s.duration_minutes > 0 && (
                        <p className="text-xs text-muted-foreground">{s.duration_minutes} min</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
