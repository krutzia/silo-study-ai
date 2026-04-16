import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function FocusTimer() {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [currentSubject, setCurrentSubject] = useState('General');
  const intervalRef = useRef<number | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const totalSeconds = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  // Load today's session count
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('study_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('started_at', `${today}T00:00:00`)
      .then(({ count }) => {
        if (count) setSessions(count);
      });
  }, [user]);

  const saveSession = async (durationMinutes: number) => {
    if (!user) return;
    try {
      await supabase.from('study_sessions').insert({
        user_id: user.id,
        duration_minutes: durationMinutes,
        subject: currentSubject,
        started_at: sessionStartRef.current?.toISOString() || new Date().toISOString(),
      });

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (streak) {
        const lastDate = streak.last_study_date;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let newStreak = streak.current_streak;
        if (lastDate === yesterday) {
          newStreak += 1;
        } else if (lastDate !== today) {
          newStreak = 1;
        }
        await supabase.from('streaks').update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_study_date: today,
        }).eq('user_id', user.id);
      } else {
        await supabase.from('streaks').insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_study_date: today,
        });
      }

      toast({ title: '🎉 Session saved!', description: `${durationMinutes} min focus session logged.` });
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  useEffect(() => {
    if (running && !sessionStartRef.current) {
      sessionStartRef.current = new Date();
    }

    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setRunning(false);
            if (mode === 'focus') {
              setSessions(s => s + 1);
              saveSession(25);
              sessionStartRef.current = null;
              setMode('break');
              return 5 * 60;
            } else {
              setMode('focus');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode]);

  const reset = () => {
    setRunning(false);
    sessionStartRef.current = null;
    setSecondsLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Focus Timer</h1>
        <p className="text-muted-foreground mb-8">Pomodoro technique — 25 min focus, 5 min break.</p>
      </motion.div>

      <div className="flex flex-col items-center gap-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <GlassCard hover={false} className="p-12 text-center">
            <div className="flex gap-4 justify-center mb-8">
              <Button
                variant={mode === 'focus' ? 'default' : 'ghost'}
                onClick={() => { setMode('focus'); setSecondsLeft(25 * 60); setRunning(false); sessionStartRef.current = null; }}
                className={mode === 'focus' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground'}
              >
                Focus
              </Button>
              <Button
                variant={mode === 'break' ? 'default' : 'ghost'}
                onClick={() => { setMode('break'); setSecondsLeft(5 * 60); setRunning(false); sessionStartRef.current = null; }}
                className={mode === 'break' ? 'gradient-accent text-accent-foreground' : 'text-muted-foreground'}
              >
                <Coffee className="w-4 h-4 mr-2" /> Break
              </Button>
            </div>

            <div className="relative w-64 h-64 mx-auto mb-8">
              <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
                <circle cx="128" cy="128" r="120" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <motion.circle
                  cx="128" cy="128" r="120" fill="none"
                  stroke="url(#timerGradient)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5 }}
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(250, 80%, 62%)" />
                    <stop offset="100%" stopColor="hsl(210, 90%, 55%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-heading font-bold text-foreground tabular-nums">
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </span>
                <span className="text-sm text-muted-foreground mt-1 capitalize">{mode} mode</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setRunning(!running)}
                className="gradient-primary text-primary-foreground hover:opacity-90 px-8"
              >
                {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button size="lg" variant="outline" onClick={reset} className="border-border/50 text-foreground">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Sessions completed today: <span className="font-bold text-foreground">{sessions}</span>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
