import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Search, Flame, Check, X, Clock, Loader2, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
}

interface FriendDisplay {
  friendshipId: string;
  profile: Profile;
  streak: number;
  isRequester: boolean;
}

interface ActivityItem {
  user: string;
  action: string;
  time: string;
  ts: number;
}

const initials = (name: string | null | undefined) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendDisplay[]>([]);
  const [incoming, setIncoming] = useState<FriendDisplay[]>([]);
  const [outgoing, setOutgoing] = useState<FriendDisplay[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadFriendships(), loadActivity()]);
    setLoading(false);
  };

  const loadFriendships = async () => {
    if (!user) return;
    const { data: rels } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!rels || rels.length === 0) {
      setFriends([]);
      setIncoming([]);
      setOutgoing([]);
      return;
    }

    const otherIds = rels.map((r: Friendship) =>
      r.requester_id === user.id ? r.addressee_id : r.requester_id
    );

    const [{ data: profiles }, { data: streaks }] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', otherIds),
      supabase.from('streaks').select('user_id, current_streak').in('user_id', otherIds),
    ]);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const streakMap = new Map((streaks || []).map((s) => [s.user_id, s.current_streak]));

    const build = (r: Friendship): FriendDisplay => {
      const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id;
      return {
        friendshipId: r.id,
        profile: profileMap.get(otherId) || { user_id: otherId, display_name: 'Unknown', avatar_url: null },
        streak: streakMap.get(otherId) || 0,
        isRequester: r.requester_id === user.id,
      };
    };

    setFriends(rels.filter((r: Friendship) => r.status === 'accepted').map(build));
    setIncoming(
      rels.filter((r: Friendship) => r.status === 'pending' && r.addressee_id === user.id).map(build)
    );
    setOutgoing(
      rels.filter((r: Friendship) => r.status === 'pending' && r.requester_id === user.id).map(build)
    );
  };

  const loadActivity = async () => {
    if (!user) return;
    const { data: rels } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted');

    const friendIds = (rels || []).map((r) =>
      r.requester_id === user.id ? r.addressee_id : r.requester_id
    );
    if (friendIds.length === 0) {
      setActivity([]);
      return;
    }

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [{ data: sessions }, { data: profiles }] = await Promise.all([
      supabase
        .from('study_sessions')
        .select('user_id, subject, duration_minutes, started_at')
        .in('user_id', friendIds)
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false })
        .limit(15),
      supabase.from('profiles').select('user_id, display_name').in('user_id', friendIds),
    ]);

    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name || 'Friend']));
    const items: ActivityItem[] = (sessions || []).map((s) => ({
      user: nameMap.get(s.user_id) || 'Friend',
      action: `studied ${s.subject || 'a topic'} for ${s.duration_minutes} min`,
      ts: new Date(s.started_at).getTime(),
      time: timeAgo(new Date(s.started_at).getTime()),
    }));
    setActivity(items);
  };

  const searchUsers = async (q: string) => {
    setSearch(q);
    if (!q.trim() || !user) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .ilike('display_name', `%${q}%`)
      .neq('user_id', user.id)
      .eq('privacy_setting', 'public')
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const sendRequest = async (addresseeId: string) => {
    if (!user) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: 'pending',
    });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Request already exists' : 'Failed to send request');
      return;
    }
    toast.success('Friend request sent!');
    setSearch('');
    setSearchResults([]);
    loadFriendships();
  };

  const respondRequest = async (id: string, accept: boolean) => {
    if (accept) {
      const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
      if (error) return toast.error('Failed to accept');
      toast.success('Friend added!');
    } else {
      const { error } = await supabase.from('friendships').delete().eq('id', id);
      if (error) return toast.error('Failed to decline');
      toast.success('Request declined');
    }
    loadAll();
  };

  const removeFriend = async (id: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', id);
    if (error) return toast.error('Failed to remove');
    toast.success('Friend removed');
    loadAll();
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Friends</h1>
        <p className="text-muted-foreground mb-8">Stay accountable with your study buddies.</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard hover={false}>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name..."
                  value={search}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="pl-10 bg-muted/50 border-border/50 text-foreground"
                />
              </div>

              {search && (
                <div className="mb-4 space-y-2">
                  {searching ? (
                    <p className="text-xs text-muted-foreground p-2">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No users found.</p>
                  ) : (
                    searchResults.map((p) => (
                      <div key={p.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {initials(p.display_name)}
                        </div>
                        <p className="text-sm font-medium text-foreground flex-1 truncate">{p.display_name || 'User'}</p>
                        <Button
                          size="sm"
                          onClick={() => sendRequest(p.user_id)}
                          className="gradient-primary text-primary-foreground"
                        >
                          <UserPlus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}

              <Tabs defaultValue="friends">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="friends">
                    Friends {friends.length > 0 && `(${friends.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="incoming">
                    Requests {incoming.length > 0 && `(${incoming.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="outgoing">
                    Sent {outgoing.length > 0 && `(${outgoing.length})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="friends" className="mt-4 space-y-2">
                  {loading ? (
                    <div className="flex justify-center py-8 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : friends.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No friends yet. Search for users above.</p>
                  ) : (
                    friends.map((f, i) => (
                      <motion.div
                        key={f.friendshipId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                          {initials(f.profile.display_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {f.profile.display_name || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400" /> {f.streak} day streak
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFriend(f.friendshipId)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </motion.div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="incoming" className="mt-4 space-y-2">
                  {incoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No pending requests.</p>
                  ) : (
                    incoming.map((f) => (
                      <div key={f.friendshipId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                          {initials(f.profile.display_name)}
                        </div>
                        <p className="text-sm font-medium text-foreground flex-1 truncate">
                          {f.profile.display_name || 'User'}
                        </p>
                        <Button size="icon" variant="ghost" onClick={() => respondRequest(f.friendshipId, true)} className="text-green-500 hover:text-green-600">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => respondRequest(f.friendshipId, false)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="outgoing" className="mt-4 space-y-2">
                  {outgoing.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No outgoing requests.</p>
                  ) : (
                    outgoing.map((f) => (
                      <div key={f.friendshipId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                          {initials(f.profile.display_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {f.profile.display_name || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFriend(f.friendshipId)} className="text-muted-foreground">
                          Cancel
                        </Button>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Activity Feed
            </h2>
            {activity.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity. Add friends to see their study sessions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full gradient-primary mt-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{item.user}</span> {item.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
