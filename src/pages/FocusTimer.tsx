import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';

export default function FocusTimer() {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const totalSeconds = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setRunning(false);
            if (mode === 'focus') {
              setSessions(s => s + 1);
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

  const reset = () => { setRunning(false); setSecondsLeft(mode === 'focus' ? 25 * 60 : 5 * 60); };
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
                onClick={() => { setMode('focus'); setSecondsLeft(25 * 60); setRunning(false); }}
                className={mode === 'focus' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground'}
              >
                Focus
              </Button>
              <Button
                variant={mode === 'break' ? 'default' : 'ghost'}
                onClick={() => { setMode('break'); setSecondsLeft(5 * 60); setRunning(false); }}
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

            <p className="text-sm text-muted-foreground mt-6">Sessions completed today: <span className="font-bold text-foreground">{sessions}</span></p>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
