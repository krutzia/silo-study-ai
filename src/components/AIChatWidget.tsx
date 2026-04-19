import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });
  if (!resp.ok || !resp.body) throw new Error('Failed to start stream');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let done = false;

  while (!done) {
    const { done: rDone, value } = await reader.read();
    if (rDone) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }
  onDone();
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Msg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setLoading(false),
      });
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary text-primary-foreground shadow-glow flex items-center justify-center"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] glass rounded-2xl border border-border/50 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-heading font-semibold text-foreground">Silo AI</p>
                <p className="text-xs text-muted-foreground">Your study assistant</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[360px]">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Hey! I'm your AI study buddy. Ask me anything!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-md gradient-primary flex-shrink-0 flex items-center justify-center mt-1">
                      <Bot className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-muted/30 text-foreground'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-md bg-muted/50 flex-shrink-0 flex items-center justify-center mt-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-md gradient-primary flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div className="bg-muted/30 rounded-xl px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50">
              <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-muted/30 border-border/50 text-foreground text-sm"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()} className="gradient-primary text-primary-foreground">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
