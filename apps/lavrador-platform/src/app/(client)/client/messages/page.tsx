'use client';
import { useEffect, useRef, useState } from 'react';
import { messagesApi, MessageDto, ConversationPartner } from '../../../../lib/api/messages.api';
import { useAuthStore } from '../../../../lib/stores/authStore';
import { getSocket, disconnectSocket } from '../../../../lib/socket';

export default function ClientMessagesPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  const [partners, setPartners] = useState<ConversationPartner[]>([]);
  const [selected, setSelected] = useState<ConversationPartner | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<ConversationPartner | null>(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    if (!token) return;
    const sock = getSocket(token);
    sock.on('new_message', (msg: MessageDto) => {
      const cur = selectedRef.current;
      if (cur && (msg.fromUserId === cur.id || msg.toUserId === cur.id)) {
        setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      }
      messagesApi.getPartners().then(setPartners).catch(() => {});
    });
    return () => { sock.off('new_message'); disconnectSocket(); };
  }, [token]);

  useEffect(() => { messagesApi.getPartners().then(setPartners).catch(() => {}); }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingHistory(true);
    messagesApi.getHistory(selected.id).then(setMessages).catch(() => {}).finally(() => setLoadingHistory(false));
    if (token) getSocket(token).emit('mark_read', { fromUserId: selected.id });
  }, [selected, token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!draft.trim() || !selected || !token) return;
    getSocket(token).emit('send_message', { toUserId: selected.id, content: draft.trim() });
    setDraft('');
  };

  const displayName = (p: ConversationPartner) => p.client?.name ?? p.email.split('@')[0];

  return (
    <div className="flex h-[calc(100vh-180px)] gap-0 bg-panel border border-border rounded-xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <span className="font-syne font-bold text-sm text-white">Mensagens</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {partners.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)}
              className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${selected?.id === p.id ? 'bg-accent/5' : 'hover:bg-white/5'}`}>
              <div className="font-sans text-sm font-medium text-white">{displayName(p)}</div>
              <div className="font-mono text-[10px] text-muted mt-0.5">{p.email}</div>
            </button>
          ))}
          {partners.length === 0 && (
            <div className="px-4 py-8 font-mono text-xs text-muted text-center">Nenhuma conversa ainda.</div>
          )}
        </div>
      </div>

      {/* Chat area */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-border">
            <div className="font-syne font-bold text-sm text-white">{displayName(selected)}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingHistory ? (
              <div className="font-mono text-xs text-muted text-center py-8">A carregar...</div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.fromUserId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-accent text-dark' : 'bg-[#1e1e28] text-white'}`}>
                      <p className={`font-sans text-sm ${isMine ? 'text-dark' : 'text-white'}`}>{msg.content}</p>
                      <p className={`font-mono text-[9px] mt-1 ${isMine ? 'text-dark/60' : 'text-muted'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
          <div className="px-4 py-3 border-t border-border flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Mensagem..."
              className="flex-1 bg-[#0d0d13] border border-border rounded-xl px-4 py-2 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent" />
            <button onClick={handleSend} disabled={!draft.trim()}
              className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-xl disabled:opacity-50">→</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="font-mono text-sm text-muted text-center">Selecciona uma conversa</div>
        </div>
      )}
    </div>
  );
}
