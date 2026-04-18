import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/GlassCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Bell, Eye, User as UserIcon, Upload, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState('public');
  const [notifications, setNotifications] = useState(true);
  const [streakReminder, setStreakReminder] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url, privacy_setting')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name ?? '');
        setBio(data.bio ?? '');
        setAvatarUrl(data.avatar_url);
        setPrivacy(data.privacy_setting ?? 'public');
      }
      setLoading(false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        privacy_setting: privacy,
      })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) toast.error('Failed to save', { description: error.message });
    else toast.success('Profile updated');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', { description: 'Max 5MB' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      toast.error('Upload failed', { description: upErr.message });
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const newUrl = pub.publicUrl;
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ avatar_url: newUrl })
      .eq('user_id', user.id);
    setUploading(false);
    if (dbErr) toast.error('Save failed', { description: dbErr.message });
    else {
      setAvatarUrl(newUrl);
      toast.success('Avatar updated');
    }
  };

  const initials = (displayName || user?.email || '?').slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your profile and preferences.</p>
      </motion.div>

      <div className="max-w-2xl space-y-6">
        {/* PROFILE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" /> Profile
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-20 h-20 border-2 border-border">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="text-lg gradient-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Change avatar</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG/JPG, max 5MB</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-foreground text-sm">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1 bg-muted/50 border-border/50"
                  disabled={loading}
                />
              </div>
              <div>
                <Label className="text-foreground text-sm">Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others a bit about yourself..."
                  rows={3}
                  className="mt-1 bg-muted/50 border-border/50 resize-none"
                  disabled={loading}
                />
              </div>
              <Button onClick={saveProfile} disabled={saving || loading} className="gradient-primary">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Profile'}
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* APPEARANCE */}
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

        {/* PRIVACY */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Privacy
            </h2>
            <div>
              <Label className="text-foreground text-sm">Profile Visibility</Label>
              <Select value={privacy} onValueChange={(v) => { setPrivacy(v); }}>
                <SelectTrigger className="mt-1 bg-muted/50 border-border/50 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Click "Save Profile" above to apply privacy changes.</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* NOTIFICATIONS */}
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
