import { useEffect, useState } from 'react';
import { Bell, UserPlus, Flame, AlertTriangle, CheckCheck, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'friend_request':
      return UserPlus;
    case 'streak_beat':
      return Flame;
    case 'overdue_tasks':
      return AlertTriangle;
    default:
      return Bell;
  }
};

export function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unread = items.filter((n) => !n.read).length;

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, message, link, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setItems(data as Notification[]);
  };

  useEffect(() => {
    if (!user) return;
    fetchItems();
    const channel = supabase
      .channel('bell-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchItems()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full gradient-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="text-sm font-heading font-semibold">Notifications</span>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Inbox className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">You're all caught up</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {items.map((n) => {
                const Icon = typeIcon(n.type);
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3',
                        !n.read && 'bg-primary/5'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                          n.type === 'streak_beat'
                            ? 'bg-orange-500/15 text-orange-500'
                            : n.type === 'overdue_tasks'
                            ? 'bg-yellow-500/15 text-yellow-500'
                            : 'bg-primary/15 text-primary'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm leading-snug', !n.read && 'font-semibold')}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
