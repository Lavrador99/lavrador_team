'use client';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { messagesApi, MessageDto, ConversationPartner } from '../../../lib/api/messages.api';
import { clientsApi } from '../../../lib/api/clients.api';
import { useAuthStore } from '../../../lib/stores/authStore';
import { getSocket, disconnectSocket } from '../../../lib/socket';

const displayName = (p: ConversationPartner) => p.client?.name ?? p.email.split('@')[0];

export default function MessagesPage() {
  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.accessToken);

  const [partners, setPartners] = useState<ConversationPartner[]>([]);
  const [selected, setSelected] = useState<ConversationPartner | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState<number | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

  async function sendBroadcast() {
    if (!broadcastContent.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await fetch(`${API}/api/messages/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ content: broadcastContent }),
      });
      const data = await res.json();
      setBroadcastDone(data.sent ?? 0);
      setBroadcastContent('');
    } finally {
      setBroadcastSending(false);
    }
  }
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<ConversationPartner | null>(null);

  const { data: clients = [] } = useSWR('clients-all', clientsApi.getAll);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    if (!token) return;
    const sock = getSocket(token);
    sock.on('new_message', (msg: MessageDto) => {
      const cur = selectedRef.current;
      if (cur && (msg.fromUserId === cur.id || msg.toUserId === cur.id)) {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
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

  function startNewChat(partner: ConversationPartner) {
    if (!partners.find(p => p.id === partner.id)) setPartners(prev => [partner, ...prev]);
    setSelected(partner);
    setShowNewChat(false);
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 bg-surface-container-low flex flex-col">
        <div className="px-4 py-4 flex items-center justify-between border-b border-outline-variant/10">
          <span className="font-headline font-bold text-sm text-on-surface">Mensagens</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowBroadcast(true); setBroadcastDone(null); }}
              className="label-category text-secondary hover:text-on-surface flex items-center gap-1"
              title="Broadcast para todos"
            >
              <span className="material-symbols-outlined text-base">campaign</span>
            </button>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="label-category text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Nova
            </button>
          </div>
        </div>

        {showBroadcast && (
          <div className="border-b border-outline-variant/10 px-3 py-3 bg-surface-container space-y-2">
            <div className="font-label text-xs font-bold text-secondary uppercase tracking-widest">Broadcast para todos</div>
            {broadcastDone !== null ? (
              <div className="font-label text-xs text-primary">✓ Enviado para {broadcastDone} clientes</div>
            ) : (
              <>
                <textarea
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Mensagem para todos os clientes..."
                  rows={2}
                  className="w-full bg-surface-container-highest border-none rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline resize-none outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={sendBroadcast}
                    disabled={!broadcastContent.trim() || broadcastSending}
                    className="kinetic-gradient text-on-primary font-label font-bold text-xs px-3 py-1.5 rounded-lg disabled:opacity-40"
                  >
                    {broadcastSending ? 'A enviar...' : 'Enviar'}
                  </button>
                  <button onClick={() => setShowBroadcast(false)} className="font-label text-xs text-secondary">Cancelar</button>
                </div>
              </>
            )}
          </div>
        )}

        {showNewChat && (
          <div className="border-b border-outline-variant/10 px-3 py-2 max-h-40 overflow-y-auto bg-surface-container">
            {clients.map((c: any) => {
              const partner: ConversationPartner = { id: c.id, email: c.email, role: c.role, client: c.client ?? null };
              return (
                <button
                  key={c.id}
                  onClick={() => startNewChat(partner)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high font-body text-sm text-on-surface transition-colors"
                >
                  {c.client?.name ?? c.email}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {partners.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left px-4 py-3.5 transition-colors border-b border-outline-variant/5 ${
                selected?.id === p.id ? 'bg-primary-fixed/40' : 'hover:bg-surface-container'
              }`}
            >
              <div className="font-body text-sm font-semibold text-on-surface">{displayName(p)}</div>
              <div className="font-label text-xs text-secondary mt-0.5 truncate">{p.email}</div>
            </button>
          ))}
          {partners.length === 0 && (
            <div className="px-4 py-8 text-xs text-secondary text-center">Nenhuma conversa ainda.</div>
          )}
        </div>
      </div>

      {/* Chat area */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container-lowest">
            <div className="font-headline font-bold text-sm text-on-surface">{displayName(selected)}</div>
            <div className="font-label text-xs text-secondary">{selected.email}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-surface">
            {loadingHistory ? (
              <div className="text-xs text-secondary text-center py-8">A carregar...</div>
            ) : (
              messages.map(msg => {
                const isMine = msg.fromUserId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine ? 'kinetic-gradient text-on-primary' : 'bg-surface-container-lowest shadow-sm text-on-surface'}`}>
                      <p className="font-body text-sm">{msg.content}</p>
                      <p className={`font-label text-[9px] mt-1 ${isMine ? 'text-on-primary/60' : 'text-secondary'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-outline-variant/10 flex gap-2 bg-surface-container-lowest">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Mensagem..."
              className="flex-1 bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm text-on-surface font-body placeholder:text-outline focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest outline-none transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-40 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-surface">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-3 block">forum</span>
            <p className="text-sm text-secondary">Selecciona uma conversa</p>
          </div>
        </div>
      )}
    </div>
  );
}
