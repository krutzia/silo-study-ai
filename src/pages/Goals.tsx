import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Calendar, Trophy, CheckCircle2 } from 'lucide-react';

const goals = [
  { title: 'Complete Physics syllabus', deadline: 'May 15', progress: 65, tasks: 12, completed: 8 },
  { title: 'Solve 100 Math problems', deadline: 'May 20', progress: 42, tasks: 100, completed: 42 },
  { title: 'Revise Chemistry notes', deadline: 'May 10', progress: 88, tasks: 8, completed: 7 },
  { title: 'Read 5 English novels', deadline: 'Jun 1', progress: 20, tasks: 5, completed: 1 },
];

const badges = [
  { name: 'Early Bird', icon: '🌅', desc: 'Study before 7 AM', unlocked: true },
  { name: 'Night Owl', icon: '🦉', desc: 'Study after midnight', unlocked: true },
  { name: 'Streak Master', icon: '🔥', desc: '30-day streak', unlocked: false },
  { name: 'Social Butterfly', icon: '🦋', desc: 'Add 10 friends', unlocked: false },
  { name: 'Perfectionist', icon: '💎', desc: '100% weekly goals', unlocked: true },
  { name: 'Speed Demon', icon: '⚡', desc: '5 sessions in one day', unlocked: false },
];

export default function GoalsPage() {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Goals & Achievements</h1>
            <p className="text-muted-foreground">Track your targets and earn badges.</p>
          </div>
          <Button className="gradient-primary text-primary-foreground hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> New Goal
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {goals.map((goal, i) => (
          <motion.div key={goal.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{goal.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Due {goal.deadline}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-foreground">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">{goal.completed}/{goal.tasks} tasks completed</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <GlassCard hover={false}>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Achievements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className={`text-center p-4 rounded-lg transition-all ${
                  badge.unlocked ? 'bg-muted/20' : 'bg-muted/5 opacity-40'
                }`}
              >
                <span className="text-3xl">{badge.icon}</span>
                <p className="text-sm font-medium text-foreground mt-2">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.desc}</p>
                {badge.unlocked && <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mt-1" />}
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </DashboardLayout>
  );
}
