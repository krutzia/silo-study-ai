import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Search, Flame, BookOpen } from 'lucide-react';

const friends = [
  { name: 'Kashish Sharma', streak: 15, subject: 'Physics', avatar: 'KS', online: true },
  { name: 'Aman Verma', streak: 22, subject: 'Math', avatar: 'AV', online: true },
  { name: 'Priya Patel', streak: 8, subject: 'Chemistry', avatar: 'PP', online: false },
  { name: 'Rohan Gupta', streak: 31, subject: 'Biology', avatar: 'RG', online: true },
  { name: 'Neha Singh', streak: 12, subject: 'English', avatar: 'NS', online: false },
];

const feed = [
  { user: 'Kashish', action: 'completed Physics — Thermodynamics', time: '10 min ago' },
  { user: 'Aman', action: 'beat your streak! 🔥', time: '25 min ago' },
  { user: 'Priya', action: 'finished 3 study sessions today', time: '1 hr ago' },
  { user: 'Rohan', action: 'earned the "Night Owl" badge 🦉', time: '2 hrs ago' },
];

export default function FriendsPage() {
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
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search friends..." className="pl-10 bg-muted/50 border-border/50 text-foreground" />
                </div>
                <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                </Button>
              </div>

              <div className="space-y-3">
                {friends.map((f, i) => (
                  <motion.div
                    key={f.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {f.avatar}
                      </div>
                      {f.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Studying {f.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-orange-400">
                      <Flame className="w-4 h-4" /> {f.streak}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Activity Feed
            </h2>
            <div className="space-y-4">
              {feed.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full gradient-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{item.user}</span> {item.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
