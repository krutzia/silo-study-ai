import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Flame, Clock, Target, TrendingUp, Sparkles, Wand2, AlertTriangle, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Task {
  id: string;
  subject: string;
  topic: string;
  duration_minutes: number;
  completed: boolean;
}

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [todayHours, setTodayHours] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();

    // Realtime: refresh dashboard when our sessions or tasks change
    const channel = supabase
      .channel('dashboard-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${user.id}` },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_tasks', filter: `user_id=eq.${user.id}` },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    // Load in parallel
    const [tasksRes, streakRes, todaySessionsRes, weekSessionsRes, overdueRes] = await Promise.all([
      supabase
        .from('study_tasks')
        .select('id, subject, topic, duration_minutes, completed')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .order('created_at'),
      supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('started_at', `${today}T00:00:00`),
      supabase
        .from('study_sessions')
        .select('duration_minutes, started_at')
        .eq('user_id', user.id)
        .gte('started_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase
        .from('study_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', false)
        .lt('scheduled_date', today),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data);
    if (streakRes.data) setStreak(streakRes.data.current_streak);
    setOverdueCount(overdueRes.count || 0);

    const todayMins = (todaySessionsRes.data || []).reduce((a, b) => a + b.duration_minutes, 0);
    setTodayHours(Math.round(todayMins / 6) / 10);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      weekMap[days[d.getDay()]] = 0;
    }
    (weekSessionsRes.data || []).forEach(s => {
      const d = new Date(s.started_at);
      const key = days[d.getDay()];
      if (key in weekMap) weekMap[key] += s.duration_minutes / 60;
    });
    setWeeklyData(Object.entries(weekMap).map(([day, hours]) => ({
      day,
      hours: Math.round(hours * 10) / 10,
    })));

    setLoading(false);
  };

  const handleAdjustPlan = async () => {
    setAdjusting(true);
    try {
      const { data, error } = await supabase.functions.invoke('adjust-study-plan');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(
        data.rescheduled > 0
          ? `Rescheduled ${data.rescheduled} of ${data.total_overdue} overdue tasks`
          : data.message || 'Plan reviewed'
      );
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust plan');
    } finally {
      setAdjusting(false);
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));

    await supabase
      .from('study_tasks')
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', id);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const maxHours = Math.max(...weeklyData.map(d => d.hours), 1);
  const weekTotal = weeklyData.reduce((a, b) => a + b.hours, 0);
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
      <motion.div {...fadeUp} className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Hey, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your study progress for today.</p>
      </motion.div>

      {overdueCount > 0 && (
        <motion.div {...fadeUp} className="mb-6">
          <GlassCard hover={false} className="border-orange-500/30 bg-orange-500/5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-foreground">
                  You have {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Let AI redistribute them across your upcoming days.
                </p>
              </div>
              <Button
                onClick={handleAdjustPlan}
                disabled={adjusting}
                className="gradient-primary text-primary-foreground hover:opacity-90"
              >
                {adjusting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adjusting...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" /> Auto-adjust Plan</>
                )}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Flame, label: 'Study Streak', value: `${streak} days`, color: 'from-orange-500 to-red-500' },
          { icon: Clock, label: 'Today', value: `${todayHours} hrs`, color: 'from-blue-500 to-cyan-500' },
          { icon: Target, label: 'Tasks Done', value: `${completedCount}/${tasks.length}`, color: 'from-purple-500 to-pink-500' },
          { icon: TrendingUp, label: 'This Week', value: `${weekTotal.toFixed(1)} hrs`, color: 'from-green-500 to-emerald-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} {...fadeUp} transition={{ delay: i * 0.1 }}>
            <GlassCard className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-6 h-6 text-white" />
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
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground">Today's Tasks</h2>
                <p className="text-sm text-muted-foreground">{completedCount}/{tasks.length} completed</p>
              </div>
              {tasks.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{progress}%</span>
                  <Progress value={progress} className="w-24 h-2" />
                </div>
              )}
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No tasks for today. Generate a study plan first!</p>
                <Button onClick={() => navigate('/study-plan')} className="gradient-primary text-primary-foreground hover:opacity-90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Study Plan
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        task.completed ? 'bg-muted/30 opacity-60' : 'bg-muted/10 hover:bg-muted/20'
                      }`}
                    >
                      <Checkbox checked={task.completed} className="border-border" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-foreground ${task.completed ? 'line-through' : ''}`}>
                          {task.subject} — {task.topic}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{task.duration_minutes} min</span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => navigate('/study-plan')} className="w-full mt-4 gradient-primary text-primary-foreground hover:opacity-90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerate Plan
                </Button>
              </>
            )}
          </GlassCard>
        </motion.div>

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
                  {weekTotal.toFixed(1)} hrs
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
