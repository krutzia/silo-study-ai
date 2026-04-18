import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Flame, AlertTriangle } from 'lucide-react';
import { createElement } from 'react';

/**
 * Global notifications hook.
 * - Toasts on incoming friend requests (Realtime)
 * - Toasts when a friend's streak surpasses the user's
 * - Toasts when overdue tasks are detected
 * - Also persists each notification to the `notifications` table for history.
 */
export function useNotifications() {
  const { user } = useAuth();
  const lastStreakCheck = useRef<number>(0);
  const lastOverdueCheck = useRef<number>(0);
  const notifiedFriendStreaks = useRef<Set<string>>(new Set());

  const persist = async (n: {
    type: string;
    title: string;
    message?: string;
    link?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (!user) return;
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: n.type,
      title: n.title,
      message: n.message ?? null,
      link: n.link ?? null,
      metadata: n.metadata ?? null,
    });
  };

  useEffect(() => {
    if (!user) return;

    // ===== 1. Realtime: Friend requests =====
    const friendChannel = supabase
      .channel('notifications-friendships')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${user.id}`,
        },
        async (payload) => {
          const requesterId = (payload.new as { requester_id: string }).requester_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', requesterId)
            .maybeSingle();
          const name = profile?.display_name || 'Someone';
          const title = `${name} sent you a friend request`;
          toast(title, {
            description: 'Open the Friends page to respond.',
            icon: createElement(UserPlus, { className: 'w-4 h-4' }),
          });
          await persist({
            type: 'friend_request',
            title,
            message: 'Open the Friends page to respond.',
            link: '/friends',
            metadata: { requester_id: requesterId },
          });
        }
      )
      .subscribe();

    // ===== 2. Periodic: Friend streak beats + overdue tasks =====
    const checkStreaksAndOverdue = async () => {
      const now = Date.now();

      if (now - lastOverdueCheck.current > 5 * 60 * 1000) {
        lastOverdueCheck.current = now;
        const today = new Date().toISOString().split('T')[0];
        const { data: overdue } = await supabase
          .from('study_tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed', false)
          .lt('scheduled_date', today);
        if (overdue && overdue.length > 0) {
          const key = `overdue-toast-${today}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            const title = `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`;
            toast.warning(title, {
              description: 'Visit the Dashboard to auto-adjust your plan.',
              icon: createElement(AlertTriangle, { className: 'w-4 h-4' }),
            });
            await persist({
              type: 'overdue_tasks',
              title,
              message: 'Visit the Dashboard to auto-adjust your plan.',
              link: '/dashboard',
              metadata: { count: overdue.length },
            });
          }
        }
      }

      if (now - lastStreakCheck.current > 10 * 60 * 1000) {
        lastStreakCheck.current = now;

        const { data: myStreak } = await supabase
          .from('streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .maybeSingle();
        const myCurrent = myStreak?.current_streak ?? 0;

        const { data: friendships } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

        const friendIds = (friendships ?? [])
          .map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id));

        if (friendIds.length === 0) return;

        const { data: friendStreaks } = await supabase
          .from('streaks')
          .select('user_id, current_streak')
          .in('user_id', friendIds)
          .gt('current_streak', myCurrent);

        for (const fs of friendStreaks ?? []) {
          const dedupeKey = `${fs.user_id}-${fs.current_streak}`;
          if (notifiedFriendStreaks.current.has(dedupeKey)) continue;
          notifiedFriendStreaks.current.add(dedupeKey);

          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', fs.user_id)
            .maybeSingle();
          const name = profile?.display_name || 'A friend';
          const title = `🔥 ${name} just beat your streak!`;
          const message = `They're at ${fs.current_streak} days. Time to catch up!`;
          toast(title, {
            description: message,
            icon: createElement(Flame, { className: 'w-4 h-4' }),
          });
          await persist({
            type: 'streak_beat',
            title,
            message,
            link: '/leaderboard',
            metadata: { friend_id: fs.user_id, streak: fs.current_streak },
          });
        }
      }
    };

    checkStreaksAndOverdue();
    const interval = setInterval(checkStreaksAndOverdue, 60 * 1000);

    return () => {
      supabase.removeChannel(friendChannel);
      clearInterval(interval);
    };
  }, [user]);
}

/** Mounts the global notifications listener. Render once. */
export function NotificationsProvider() {
  useNotifications();
  return null;
}
