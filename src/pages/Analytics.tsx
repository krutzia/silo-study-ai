import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { BarChart3, Clock, BookOpen, TrendingUp, Target } from 'lucide-react';

const subjects = [
  { name: 'Physics', hours: 12.5, color: 'from-blue-500 to-cyan-500', pct: 85 },
  { name: 'Math', hours: 10.2, color: 'from-purple-500 to-pink-500', pct: 70 },
  { name: 'Chemistry', hours: 8.0, color: 'from-green-500 to-emerald-500', pct: 55 },
  { name: 'English', hours: 5.5, color: 'from-orange-500 to-amber-500', pct: 40 },
  { name: 'Biology', hours: 6.8, color: 'from-red-500 to-rose-500', pct: 48 },
];

const weeklyHours = [
  { week: 'W1', hours: 18 },
  { week: 'W2', hours: 22 },
  { week: 'W3', hours: 20 },
  { week: 'W4', hours: 25 },
];

const maxWeekly = Math.max(...weeklyHours.map(w => w.hours));

export default function AnalyticsPage() {
  const totalHours = subjects.reduce((a, s) => a + s.hours, 0);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground mb-8">Your study performance at a glance.</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Clock, label: 'Total Hours', value: `${totalHours.toFixed(1)} hrs`, color: 'from-blue-500 to-cyan-500' },
          { icon: BookOpen, label: 'Subjects', value: `${subjects.length}`, color: 'from-purple-500 to-pink-500' },
          { icon: TrendingUp, label: 'Avg/Day', value: '3.2 hrs', color: 'from-green-500 to-emerald-500' },
          { icon: Target, label: 'Goal Hit Rate', value: '78%', color: 'from-orange-500 to-amber-500' },
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
        {/* Subject breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Subject Breakdown
            </h2>
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
                      animate={{ width: `${s.pct}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                      className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Weekly performance */}
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
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
