import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Flame, BookOpen, Clock, Target, TrendingUp,
  CheckCircle2, Circle, Sparkles
} from 'lucide-react';

const mockTasks = [
  { id: 1, title: 'Physics — Thermodynamics Ch. 4', subject: 'Physics', done: false, time: '45 min' },
  { id: 2, title: 'Math — Integration Practice', subject: 'Math', done: true, time: '60 min' },
  { id: 3, title: 'Chemistry — Organic Reactions', subject: 'Chemistry', done: false, time: '30 min' },
  { id: 4, title: 'English — Essay Outline', subject: 'English', done: false, time: '25 min' },
  { id: 5, title: 'Biology — Cell Division Notes', subject: 'Biology', done: true, time: '40 min' },
];

const weeklyData = [
  { day: 'Mon', hours: 3.5 },
  { day: 'Tue', hours: 4.2 },
  { day: 'Wed', hours: 2.8 },
  { day: 'Thu', hours: 5.0 },
  { day: 'Fri', hours: 3.0 },
  { day: 'Sat', hours: 4.5 },
  { day: 'Sun', hours: 1.5 },
];

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState(mockTasks);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const completedCount = tasks.filter(t => t.done).length;
  const progress = Math.round((completedCount / tasks.length) * 100);
  const maxHours = Math.max(...weeklyData.map(d => d.hours));

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard className="lg:col-span-2 h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div {...fadeUp} className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Hey, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your study progress for today.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Flame, label: 'Study Streak', value: '12 days', color: 'from-orange-500 to-red-500' },
          { icon: Clock, label: 'Today', value: '3.5 hrs', color: 'from-blue-500 to-cyan-500' },
          { icon: Target, label: 'Weekly Goal', value: '78%', color: 'from-purple-500 to-pink-500' },
          { icon: TrendingUp, label: 'Rank', value: '#4', color: 'from-green-500 to-emerald-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} {...fadeUp} transition={{ delay: i * 0.1 }}>
            <GlassCard className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's tasks */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground">Today's Tasks</h2>
                <p className="text-sm text-muted-foreground">{completedCount}/{tasks.length} completed</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{progress}%</span>
                <Progress value={progress} className="w-24 h-2" />
              </div>
            </div>

            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    task.done ? 'bg-muted/30 opacity-60' : 'bg-muted/10 hover:bg-muted/20'
                  }`}
                >
                  <Checkbox checked={task.done} className="border-border" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-foreground ${task.done ? 'line-through' : ''}`}>
                      {task.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{task.time}</span>
                </div>
              ))}
            </div>

            <Button className="w-full mt-4 gradient-primary text-primary-foreground hover:opacity-90">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate AI Study Plan
            </Button>
          </GlassCard>
        </motion.div>

        {/* Weekly chart */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-6">Weekly Progress</h2>
            <div className="flex items-end justify-between gap-2 h-40">
              {weeklyData.map((d, i) => (
                <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.hours / maxHours) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                    className="w-full rounded-t-md gradient-primary min-h-[4px]"
                  />
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total this week</span>
                <span className="text-lg font-heading font-bold text-foreground">
                  {weeklyData.reduce((a, b) => a + b.hours, 0).toFixed(1)} hrs
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
