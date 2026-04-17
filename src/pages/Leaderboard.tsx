import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RankedUser {
  user_id: string;
  name: string;
  avatar: string;
  streak: number;
  hours: number;
  isMe: boolean;
}

const initials = (name: string) =>
  name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

const rankColors = [
  'from-yellow-400 to-amber-500',
  'from-gray-300 to-gray-400',
  'from-orange-400 to-orange-600',
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user, period]);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    if (period === 'weekly') since.setDate(since.getDate() - 6);

    // Pull profiles + streaks. RLS allows public profiles + own profile.
    const [{ data: profiles }, { data: streaks }, { data: sessions }] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name'),
      supabase.from('streaks').select('user_id, current_streak'),
      supabase
        .from('study_sessions')
        .select('user_id, duration_minutes')
        .gte('started_at', since.toISOString()),
    ]);

    const streakMap = new Map((streaks || []).map(s => [s.user_id, s.current_streak]));
    const hoursMap = new Map<string, number>();
    (sessions || []).forEach(s => {
      hoursMap.set(s.user_id, (hoursMap.get(s.user_id) || 0) + s.duration_minutes);
    });

    const ranked: RankedUser[] = (profiles || [])
      .map(p => {
        const mins = hoursMap.get(p.user_id) || 0;
        return {
          user_id: p.user_id,
          name: p.user_id === user.id ? 'You' : (p.display_name || 'Anonymous'),
          avatar: initials(p.display_name || 'NA'),
          streak: streakMap.get(p.user_id) || 0,
          hours: +(mins / 60).toFixed(1),
          isMe: p.user_id === user.id,
        };
      })
      // Sort: hours desc, then streak desc
      .sort((a, b) => b.hours - a.hours || b.streak - a.streak);

    setUsers(ranked);
    setLoading(false);
  };

  const top3 = users.slice(0, 3);
  const myRank = users.findIndex(u => u.isMe) + 1;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Leaderboard</h1>
        <p className="text-muted-foreground mb-8">
          {myRank > 0 ? `You're ranked #${myRank}` : 'See how you stack up.'} — based on study hours.
        </p>
      </motion.div>

      <div className="flex gap-2 mb-6">
        {(['daily', 'weekly'] as const).map(p => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'ghost'}
            onClick={() => setPeriod(p)}
            className={period === p ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground'}
          >
            {p === 'daily' ? 'Today' : 'This Week'}
          </Button>
        ))}
      </div>

      {loading ? (
        <GlassCard hover={false}>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading rankings...
          </div>
        </GlassCard>
      ) : users.length === 0 ? (
        <GlassCard hover={false} className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No users yet. Invite friends to compete!</p>
        </GlassCard>
      ) : (
        <>
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
              {[1, 0, 2].map(idx => {
                const u = top3[idx];
                if (!u) return null;
                return (
                  <motion.div
                    key={u.user_id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    className={idx === 0 ? 'pt-0' : 'pt-8'}
                  >
                    <GlassCard className="text-center py-6">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${rankColors[idx]} mx-auto mb-2 flex items-center justify-center text-lg font-bold text-background`}>
                        {u.avatar}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.hours} hrs</p>
                      <div className="flex items-center justify-center gap-1 mt-1 text-orange-400">
                        <Flame className="w-3 h-3" />
                        <span className="text-xs">{u.streak}</span>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}

          <GlassCard hover={false}>
            <div className="space-y-2">
              {users.map((u, i) => (
                <motion.div
                  key={u.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    u.isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20'
                  }`}
                >
                  <span className="w-8 text-center text-sm font-bold text-muted-foreground">#{i + 1}</span>
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {u.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${u.isMe ? 'text-primary' : 'text-foreground'}`}>{u.name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{u.hours}h</span>
                    <span className="flex items-center gap-1 text-orange-400"><Flame className="w-3 h-3" />{u.streak}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </DashboardLayout>
  );
}
