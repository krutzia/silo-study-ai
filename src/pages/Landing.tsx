import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import {
  Brain, Calendar, Users, Trophy, Timer, BarChart3,
  ArrowRight, Sparkles, Target, Zap
} from 'lucide-react';

const stats = [
  { value: '10K+', label: 'Active Students' },
  { value: '95%', label: 'Plan Adherence' },
  { value: '4.9', label: 'User Rating' },
  { value: '2M+', label: 'Hours Studied' },
];

const features = [
  { icon: Brain, title: 'AI Study Plans', desc: 'Adaptive schedules that learn your pace and adjust automatically.' },
  { icon: Calendar, title: 'Smart Scheduling', desc: 'Never miss a session. Plans recalibrate when life happens.' },
  { icon: Users, title: 'Social Accountability', desc: 'Study with friends, compete on leaderboards, stay motivated.' },
  { icon: Trophy, title: 'Gamification', desc: 'Earn streaks, badges, and achievements as you study.' },
  { icon: Timer, title: 'Focus Timer', desc: 'Built-in Pomodoro timer to maximize deep work sessions.' },
  { icon: BarChart3, title: 'Rich Analytics', desc: 'Track every minute. Visualize progress across subjects.' },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI-Powered Study Planning</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-heading font-bold mb-6 leading-tight">
              Study smarter.
              <br />
              <span className="gradient-text">Score higher.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Silo creates personalized study plans that adapt to your progress,
              keep you accountable with friends, and help you crush every exam.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="gradient-primary text-primary-foreground text-lg px-8 py-6 rounded-xl hover:opacity-90 shadow-glow"
              >
                Start for free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
                <GlassCard className="text-center py-8">
                  <div className="text-3xl sm:text-4xl font-heading font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4">
              Everything you need to <span className="gradient-text">ace your exams</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete study toolkit powered by AI and designed for real results.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
                <GlassCard className="h-full">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp}>
            <GlassCard hover={false} className="text-center py-16 relative overflow-hidden">
              <div className="absolute inset-0 gradient-primary opacity-5" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl gradient-warm mx-auto mb-6 flex items-center justify-center animate-float">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-heading font-bold mb-4 text-foreground">Ready to transform your study game?</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Join thousands of students who study smarter, not harder.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="gradient-primary text-primary-foreground text-lg px-8 py-6 rounded-xl hover:opacity-90"
                >
                  Get started — it's free
                  <Zap className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-foreground">Silo</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Silo. Built for students who dream big.</p>
        </div>
      </footer>
    </div>
  );
}
