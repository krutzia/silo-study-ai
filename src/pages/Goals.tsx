import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Target, Plus, Calendar, Trophy, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  completed: boolean;
}

const badges = [
  { name: 'First Goal', icon: '🎯', desc: 'Create your first goal', threshold: 1, type: 'count' },
  { name: 'Goal Crusher', icon: '🏆', desc: 'Complete 5 goals', threshold: 5, type: 'completed' },
  { name: 'Halfway There', icon: '⚡', desc: 'A goal at 50%+', threshold: 50, type: 'progress' },
  { name: 'Perfectionist', icon: '💎', desc: 'Complete a goal', threshold: 1, type: 'completed' },
  { name: 'Planner', icon: '📅', desc: 'Set 3 deadlines', threshold: 3, type: 'deadlines' },
  { name: 'Overachiever', icon: '🔥', desc: '10 goals created', threshold: 10, type: 'count' },
];

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', target_date: '' });

  useEffect(() => {
    if (user) loadGoals();
  }, [user]);

  const loadGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load goals');
    else setGoals(data || []);
    setLoading(false);
  };

  const createGoal = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      target_date: form.target_date || null,
    });
    setSaving(false);
    if (error) {
      toast.error('Failed to create goal');
      return;
    }
    toast.success('Goal created!');
    setForm({ title: '', description: '', target_date: '' });
    setOpen(false);
    loadGoals();
  };

  const updateProgress = async (id: string, progress: number) => {
    const completed = progress >= 100;
    const { error } = await supabase
      .from('goals')
      .update({ progress, completed })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update');
      return;
    }
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, progress, completed } : g))
    );
    if (completed) toast.success('Goal completed! 🎉');
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast.success('Goal deleted');
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const deadlineCount = goals.filter((g) => g.target_date).length;
  const maxProgress = goals.reduce((m, g) => Math.max(m, g.progress), 0);

  const isUnlocked = (b: typeof badges[number]) => {
    if (b.type === 'count') return goals.length >= b.threshold;
    if (b.type === 'completed') return completedCount >= b.threshold;
    if (b.type === 'progress') return maxProgress >= b.threshold;
    if (b.type === 'deadlines') return deadlineCount >= b.threshold;
    return false;
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'No deadline';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Goals & Achievements</h1>
            <p className="text-muted-foreground">Track your targets and earn badges.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Complete Physics syllabus"
                  />
                </div>
                <div>
                  <Label htmlFor="desc">Description (optional)</Label>
                  <Textarea
                    id="desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What does success look like?"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Target date (optional)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.target_date}
                    onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createGoal} disabled={saving || !form.title.trim()} className="gradient-primary text-primary-foreground">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {loading ? (
        <GlassCard hover={false}>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading goals...
          </div>
        </GlassCard>
      ) : goals.length === 0 ? (
        <GlassCard hover={false} className="text-center py-12 mb-8">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-heading font-semibold text-foreground mb-1">No goals yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Set your first study goal to start tracking progress.</p>
          <Button onClick={() => setOpen(true)} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Create Goal
          </Button>
        </GlassCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {goals.map((goal, i) => (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard>
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-foreground truncate">{goal.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(goal.target_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{goal.progress}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                )}
                <Progress value={goal.progress} className="h-2 mb-3" />
                <div className="flex items-center gap-3">
                  <Slider
                    value={[goal.progress]}
                    max={100}
                    step={5}
                    onValueChange={(v) => updateProgress(goal.id, v[0])}
                    className="flex-1"
                  />
                  {goal.completed && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <GlassCard hover={false}>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Achievements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {badges.map((badge) => {
              const unlocked = isUnlocked(badge);
              return (
                <div
                  key={badge.name}
                  className={`text-center p-4 rounded-lg transition-all ${
                    unlocked ? 'bg-muted/20' : 'bg-muted/5 opacity-40'
                  }`}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <p className="text-sm font-medium text-foreground mt-2">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                  {unlocked && <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mt-1" />}
                </div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>
    </DashboardLayout>
  );
}
