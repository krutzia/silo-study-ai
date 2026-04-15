import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { Settings as SettingsIcon, Shield, Bell, Eye } from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [privacy, setPrivacy] = useState('friends');
  const [notifications, setNotifications] = useState(true);
  const [streakReminder, setStreakReminder] = useState(true);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your preferences.</p>
      </motion.div>

      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Appearance
            </h2>
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Dark Mode</Label>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Privacy
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground text-sm">Profile Visibility</Label>
                <Select value={privacy} onValueChange={setPrivacy}>
                  <SelectTrigger className="mt-1 bg-muted/50 border-border/50 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Push Notifications</Label>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Streak Reminders</Label>
                <Switch checked={streakReminder} onCheckedChange={setStreakReminder} />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
