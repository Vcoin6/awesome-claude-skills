'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { timeAgo } from '@/lib/format';

export default function MessageThread({ threadId, meId, otherId, otherName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages/${threadId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
    }
  }, [threadId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setText('');
    // Optimistic.
    const optimistic = { id: `tmp_${Date.now()}`, fromId: meId, toId: otherId, text: body, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toId: otherId, text: body }),
    }).catch(() => {});
    setSending(false);
    load();
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 sm:px-6">
      <div className="flex items-center gap-3 border-b border-ink-line py-4">
        <Link href="/messages" className="text-white/50 hover:text-white">←</Link>
        <Link href={`/seller/${otherId}`} className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient font-bold text-white">
            {otherName?.[0]?.toUpperCase()}
          </span>
          <span className="font-semibold text-white">{otherName}</span>
        </Link>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-white/40">No messages yet — say hello 👋</p>
        ) : (
          messages.map((m) => {
            const mine = m.fromId === meId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-brand-gradient text-white' : 'bg-ink-card text-white/90 ring-1 ring-ink-line'}`}>
                  <p className="whitespace-pre-wrap text-sm">{m.text}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-white/35'}`}>{timeAgo(m.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-ink-line py-3">
        <input
          className="input flex-1"
          placeholder={`Message ${otherName}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary px-5" disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
