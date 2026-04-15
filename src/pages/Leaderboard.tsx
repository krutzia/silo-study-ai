import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Flame, TrendingUp, Clock } from 'lucide-react';

const leaderboard = [
  { rank: 1, name: 'Rohan Gupta', streak: 31, hours: 48.5, avatar: 'RG' },
  { rank: 2, name: 'Aman Verma', streak: 22, hours: 42.0, avatar: 'AV' },
  { rank: 3, name: 'Kashish Sharma', streak: 15, hours: 38.2, avatar: 'KS' },
  { rank: 4, name: 'You', streak: 12, hours: 35.0, avatar: 'ME' },
  { rank: 5, name: 'Priya Patel', streak: 8, hours: 30.1, avatar: 'PP' },
  { rank: 6, name: 'Neha Singh', streak: 12, hours: 28.5, avatar: 'NS' },
  { rank: 7, name: 'Vikram Joshi', streak: 6, hours: 25.0, avatar: 'VJ' },
  { rank: 8, name: 'Ananya Das', streak: 19, hours: 22.3, avatar: 'AD' },
];

const rankColors = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-orange-400 to-orange-600'];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('weekly');

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Leaderboard</h1>
        <p className="text-muted-foreground mb-8">See how you stack up against your friends.</p>
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

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
        {[1, 0, 2].map((idx) => {
          const user = leaderboard[idx];
          return (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              className={idx === 0 ? 'pt-0' : 'pt-8'}
            >
              <GlassCard className="text-center py-6">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${rankColors[user.rank - 1]} mx-auto mb-2 flex items-center justify-center text-lg font-bold text-background`}>
                  {user.avatar}
                </div>
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.hours} hrs</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-orange-400">
                  <Flame className="w-3 h-3" />
                  <span className="text-xs">{user.streak}</span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Full list */}
      <GlassCard hover={false}>
        <div className="space-y-2">
          {leaderboard.map((user, i) => (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                user.name === 'You' ? 'gradient-primary/10 border border-primary/20' : 'hover:bg-muted/20'
              }`}
            >
              <span className="w-8 text-center text-sm font-bold text-muted-foreground">#{user.rank}</span>
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {user.avatar}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${user.name === 'You' ? 'text-primary' : 'text-foreground'}`}>{user.name}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{user.hours}h</span>
                <span className="flex items-center gap-1 text-orange-400"><Flame className="w-3 h-3" />{user.streak}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </DashboardLayout>
  );
}
