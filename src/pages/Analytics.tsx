import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { BarChart3, Clock, BookOpen, TrendingUp, Target, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SessionRow {
  duration_minutes: number;
  subject: string | null;
  started_at: string;
}

const SUBJECT_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-amber-500',
  'from-red-500 to-rose-500',
  'from-indigo-500 to-violet-500',
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [goalHitRate, setGoalHitRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const [{ data: s }, { data: g }] = await Promise.all([
      supabase
        .from('study_sessions')
        .select('duration_minutes, subject, started_at')
        .gte('started_at', fourWeeksAgo.toISOString())
        .order('started_at', { ascending: false }),
      supabase.from('goals').select('completed'),
    ]);

    setSessions(s || []);
    if (g && g.length > 0) {
      const completed = g.filter((x) => x.completed).length;
      setGoalHitRate(Math.round((completed / g.length) * 100));
    }
    setLoading(false);
  };

  // Subject breakdown (all-time within window)
  const subjectMap = new Map<string, number>();
  sessions.forEach((s) => {
    const name = s.subject || 'General';
    subjectMap.set(name, (subjectMap.get(name) || 0) + s.duration_minutes);
  });
  const subjects = Array.from(subjectMap.entries())
    .map(([name, mins], i) => ({
      name,
      hours: +(mins / 60).toFixed(1),
      color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
    }))
    .sort((a, b) => b.hours - a.hours);

  const maxSubjectHours = Math.max(...subjects.map((s) => s.hours), 1);

  // Weekly performance (last 4 weeks)
  const weeklyHours = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (3 - i) * 7 - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const mins = sessions
      .filter((s) => {
        const d = new Date(s.started_at);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((a, s) => a + s.duration_minutes, 0);
    return { week: `W${i + 1}`, hours: +(mins / 60).toFixed(1) };
  });
  const maxWeekly = Math.max(...weeklyHours.map((w) => w.hours), 1);

  const totalHours = subjects.reduce((a, s) => a + s.hours, 0);
  const daysWithStudy = new Set(
    sessions.map((s) => new Date(s.started_at).toDateString())
  ).size;
  const avgPerDay = daysWithStudy > 0 ? (totalHours / daysWithStudy).toFixed(1) : '0.0';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading analytics...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground mb-8">Your study performance at a glance.</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Clock, label: 'Total Hours', value: `${totalHours.toFixed(1)} hrs`, color: 'from-blue-500 to-cyan-500' },
          { icon: BookOpen, label: 'Subjects', value: `${subjects.length}`, color: 'from-purple-500 to-pink-500' },
          { icon: TrendingUp, label: 'Avg/Study Day', value: `${avgPerDay} hrs`, color: 'from-green-500 to-emerald-500' },
          { icon: Target, label: 'Goal Hit Rate', value: `${goalHitRate}%`, color: 'from-orange-500 to-amber-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-heading font-bold text-foreground">{stat.value}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Subject Breakdown
            </h2>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No study sessions yet. Start the focus timer to track time.</p>
            ) : (
              <div className="space-y-4">
                {subjects.map((s, i) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">{s.name}</span>
                      <span className="text-muted-foreground">{s.hours} hrs</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.hours / maxSubjectHours) * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                        className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Weekly Performance
            </h2>
            <div className="flex items-end justify-between gap-4 h-48">
              {weeklyHours.map((w, i) => (
                <div key={w.week} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs text-muted-foreground">{w.hours}h</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(w.hours / maxWeekly) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                    className="w-full rounded-t-lg gradient-primary min-h-[4px]"
                  />
                  <span className="text-xs text-muted-foreground">{w.week}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">Last 4 weeks</p>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
