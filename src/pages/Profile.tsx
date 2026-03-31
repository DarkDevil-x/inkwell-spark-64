import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Save, User, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dailyGoal, setDailyGoal] = useState(500);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (data) {
      const p = data as any;
      setDisplayName(p.display_name || '');
      setBio(p.bio || '');
      setAvatarUrl(p.avatar_url || '');
      setDailyGoal(p.daily_word_goal || 500);
      setReminderEnabled(p.reminder_enabled || false);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName, bio, daily_word_goal: dailyGoal,
      reminder_enabled: reminderEnabled,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Profile saved ✓' });
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file);
    if (error) { toast({ title: 'Upload failed', variant: 'destructive' }); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(publicUrl);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
    toast({ title: 'Avatar updated!' });
  };

  const changePassword = async () => {
    if (!newPassword) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Password updated ✓' }); setCurrentPassword(''); setNewPassword(''); }
  };

  const deleteAccount = async () => {
    toast({ title: 'Contact support', description: 'Please contact support to delete your account.' });
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 flex h-14 items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex items-center gap-2">
            <div className="gradient-primary rounded-lg p-1"><BookOpen className="h-4 w-4 text-white" /></div>
            <span className="font-bold">Profile</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full gradient-primary flex items-center justify-center cursor-pointer">
                <Camera className="h-3.5 w-3.5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-bold">{displayName || 'Your Name'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold">Personal Info</h3>
            <div><Label>Display Name</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1" /></div>
            <div><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} className="mt-1" rows={3} /></div>
            <div>
              <Label>Daily Word Goal</Label>
              <Input type="number" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value) || 0)} className="mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Email Reminders</Label>
              <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="gradient-primary border-0 text-white">
              <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>

          <div className="glass rounded-xl p-6 space-y-4 mt-6">
            <h3 className="font-semibold">Change Password</h3>
            <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1" /></div>
            <Button variant="outline" onClick={changePassword} disabled={!newPassword}>Update Password</Button>
          </div>

          <div className="glass rounded-xl p-6 border-destructive/30 mt-6 space-y-4">
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            <Button variant="destructive" onClick={deleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Account
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
