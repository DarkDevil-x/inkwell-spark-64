import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Trash2, Ban, CheckCircle, Users, ArrowLeft, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  blocked: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
}

export default function Admin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    checkAdmin();
  }, [user]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = search.trim() === '' ||
        (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'blocked' && (u.blocked || u.banned)) ||
        (statusFilter === 'active' && !u.blocked && !u.banned);
      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const checkAdmin = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user!.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!data) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(true);
    fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    const session = (await supabase.auth.getSession()).data.session;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/admin-users?action=list`,
      {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const result = await res.json();
    if (res.ok) {
      setUsers(result);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleAction = async (userId: string, action: 'block' | 'unblock' | 'delete') => {
    setActionLoading(userId);
    const session = (await supabase.auth.getSession()).data.session;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/admin-users?action=${action}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      }
    );
    const result = await res.json();
    setActionLoading(null);

    if (res.ok) {
      toast({ title: 'Success', description: `User ${action === 'delete' ? 'deleted' : action === 'block' ? 'blocked' : 'unblocked'} successfully.` });
      fetchUsers();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="gradient-primary rounded-lg p-2">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Manage users</p>
              </div>
            </div>
            <Badge className="ml-auto" variant="secondary">
              <Users className="h-3 w-3 mr-1" /> {users.length} users
            </Badge>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No users found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(u.display_name || u.email || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.display_name || 'No name'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        {u.blocked || u.banned ? (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="h-3 w-3" /> Blocked
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 text-emerald-500">
                            <CheckCircle className="h-3 w-3" /> Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.blocked || u.banned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(u.id, 'unblock')}
                              disabled={actionLoading === u.id}
                            >
                              {actionLoading === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(u.id, 'block')}
                              disabled={actionLoading === u.id}
                              className="text-orange-500 hover:text-orange-600"
                            >
                              {actionLoading === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                              Block
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={actionLoading === u.id}>
                                <Trash2 className="h-3 w-3" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{u.display_name || u.email}</strong> and all their data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleAction(u.id, 'delete')}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
