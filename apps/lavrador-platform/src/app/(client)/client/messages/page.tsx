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
    <div className="flex h-[calc(100dvh-140px)] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/60">

      {/* ── Conversation list ────────────────────────────────────────────────── */}
      <div className={`flex flex-col border-r border-zinc-800/60 bg-zinc-950 ${selected ? 'hidden md:flex md:w-64 md:flex-shrink-0' : 'flex flex-1 md:w-64 md:flex-shrink-0'}`}>
        <div className="px-4 py-3.5 border-b border-zinc-800/60">
          <span className="font-[Manrope] font-bold text-sm text-white">Chat</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {partners.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left px-4 py-3.5 border-b border-zinc-800/40 transition-colors ${
                selected?.id === p.id ? 'bg-[#005050]/30' : 'hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-[Manrope] font-black text-sm flex-shrink-0 text-black"
                  style={{ background: 'linear-gradient(135deg, #84d4d3, #005050)' }}>
                  {displayName(p)[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{displayName(p)}</div>
                  <div className="text-xs text-zinc-600 truncate">{p.email}</div>
                </div>
              </div>
            </button>
          ))}
          {partners.length === 0 && (
            <div className="px-4 py-12 text-sm text-zinc-600 text-center">Nenhuma conversa ainda.</div>
          )}
        </div>
      </div>

      {/* ── Chat area ────────────────────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-zinc-800/60 flex items-center gap-3 bg-zinc-900">
            <button
              onClick={() => setSelected(null)}
              className="md:hidden text-zinc-600 hover:text-white transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-[Manrope] font-black text-xs flex-shrink-0 text-black"
              style={{ background: 'linear-gradient(135deg, #84d4d3, #005050)' }}>
              {displayName(selected)[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="font-[Manrope] font-bold text-sm text-white truncate">{displayName(selected)}</div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#84d4d3]" />
              <span className="text-[10px] text-zinc-500">online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-950">
            {loadingHistory ? (
              <div className="text-sm text-zinc-600 text-center py-8">A carregar...</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-zinc-600 text-center py-12">Sem mensagens ainda. Começa a conversa!</div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.fromUserId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? 'text-black'
                        : 'bg-zinc-800 border border-zinc-700/60'
                    }`}
                      style={isMine ? { background: 'linear-gradient(135deg, #84d4d3, #005050)' } : {}}
                    >
                      <p className={`text-sm ${isMine ? 'text-black' : 'text-white'}`}>{msg.content}</p>
                      <p className={`text-[11px] mt-1 ${isMine ? 'text-black/50' : 'text-zinc-600'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-zinc-800/60 flex gap-2 bg-zinc-900">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Mensagem..."
              className="flex-1 bg-zinc-800 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#84d4d3]/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-30 active:scale-95 transition-all text-black"
              style={{ background: '#c8f542' }}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-950">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-zinc-700 mb-2 block">chat</span>
            <div className="text-sm text-zinc-600">Selecciona uma conversa</div>
          </div>
        </div>
      )}
    </div>
  );
}
