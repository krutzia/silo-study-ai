import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

const mockPlan = [
  { day: 'Monday', tasks: [{ subject: 'Physics', topic: 'Thermodynamics', duration: '1.5 hrs' }, { subject: 'Math', topic: 'Calculus', duration: '1 hr' }] },
  { day: 'Tuesday', tasks: [{ subject: 'Chemistry', topic: 'Organic', duration: '1.5 hrs' }, { subject: 'English', topic: 'Essay Writing', duration: '45 min' }] },
  { day: 'Wednesday', tasks: [{ subject: 'Biology', topic: 'Genetics', duration: '1 hr' }, { subject: 'Physics', topic: 'Waves', duration: '1 hr' }] },
];

export default function StudyPlan() {
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1500);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">AI Study Plan</h1>
        <p className="text-muted-foreground mb-8">Generate a personalized study schedule powered by AI.</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> Plan Settings
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground text-sm">Exam Date</Label>
                <Input type="date" className="mt-1 bg-muted/50 border-border/50 text-foreground" />
              </div>
              <div>
                <Label className="text-foreground text-sm">Subjects (comma separated)</Label>
                <Input placeholder="Physics, Math, Chemistry" className="mt-1 bg-muted/50 border-border/50 text-foreground" />
              </div>
              <div>
                <Label className="text-foreground text-sm">Difficulty Level</Label>
                <Select>
                  <SelectTrigger className="mt-1 bg-muted/50 border-border/50 text-foreground">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground text-sm">Daily Study Hours</Label>
                <Input type="number" placeholder="4" min={1} max={12} className="mt-1 bg-muted/50 border-border/50 text-foreground" />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full gradient-primary text-primary-foreground hover:opacity-90"
              >
                {generating ? (
                  <><Clock className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Plan</>
                )}
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          {generated ? (
            <div className="space-y-4">
              {mockPlan.map((day, i) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <GlassCard hover={false}>
                    <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> {day.day}
                    </h3>
                    <div className="space-y-2">
                      {day.tasks.map((task, j) => (
                        <div key={j} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{task.subject}</p>
                              <p className="text-xs text-muted-foreground">{task.topic}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{task.duration}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <GlassCard hover={false} className="flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center animate-pulse-glow">
                  <Brain className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No plan yet</h3>
                <p className="text-sm text-muted-foreground">Fill in your details and generate an AI-powered study plan.</p>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
