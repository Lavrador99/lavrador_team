import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import { RootState } from '../../store';
import { messagesApi, MessageDto, ConversationPartner } from '../../utils/api/messages.api';
import { getSocket, disconnectSocket } from '../../utils/socket';

const displayName = (p: ConversationPartner) => p.client?.name ?? p.email.split('@')[0];

export const MessagesPage: React.FC = () => {
  const { user, accessToken } = useSelector((s: RootState) => s.auth);

  const [partners, setPartners] = useState<ConversationPartner[]>([]);
  const [selected, setSelected] = useState<ConversationPartner | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Connect socket
  useEffect(() => {
    if (!accessToken) return;
    const sock = getSocket(accessToken);

    sock.on('new_message', (msg: MessageDto) => {
      setMessages((prev) => {
        // Only add if belongs to current conversation
        if (
          selected &&
          (msg.fromUserId === selected.id || msg.toUserId === selected.id)
        ) {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        }
        return prev;
      });
      // Refresh partner list on new message
      messagesApi.getPartners().then(setPartners).catch(() => {});
    });

    return () => {
      sock.off('new_message');
      disconnectSocket();
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load partners
  useEffect(() => {
    messagesApi.getPartners().then(setPartners).catch(() => {});
  }, []);

  // Load history when selected partner changes
  useEffect(() => {
    if (!selected) return;
    setLoadingHistory(true);
    messagesApi.getHistory(selected.id)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));

    // Mark as read
    if (accessToken) {
      const sock = getSocket(accessToken);
      sock.emit('mark_read', { fromUserId: selected.id });
    }
  }, [selected, accessToken]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim() || !selected || !accessToken) return;
    const sock = getSocket(accessToken);
    sock.emit('send_message', { toUserId: selected.id, content: draft.trim() });
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Page>
      <Sidebar>
        <SidebarHeader>
          <SidebarTitle>Mensagens</SidebarTitle>
        </SidebarHeader>
        {partners.length === 0 ? (
          <EmptyPartners>Sem conversas ainda.</EmptyPartners>
        ) : (
          partners.map((p) => (
            <PartnerRow
              key={p.id}
              $active={selected?.id === p.id}
              onClick={() => setSelected(p)}
            >
              <PartnerAvatar>{displayName(p).charAt(0).toUpperCase()}</PartnerAvatar>
              <PartnerInfo>
                <PartnerName>{displayName(p)}</PartnerName>
                <PartnerRole>{p.role === 'ADMIN' ? 'Treinador' : 'Cliente'}</PartnerRole>
              </PartnerInfo>
            </PartnerRow>
          ))
        )}
      </Sidebar>

      <ChatArea>
        {!selected ? (
          <NoChatSelected>
            <NoChatIcon>💬</NoChatIcon>
            <NoChatText>Seleciona uma conversa</NoChatText>
          </NoChatSelected>
        ) : (
          <>
            <ChatHeader>
              <PartnerAvatar>{displayName(selected).charAt(0).toUpperCase()}</PartnerAvatar>
              <ChatHeaderName>{displayName(selected)}</ChatHeaderName>
              <ChatHeaderSub>{selected.role === 'ADMIN' ? 'Treinador' : 'Cliente'}</ChatHeaderSub>
            </ChatHeader>

            <MessageList>
              {loadingHistory ? (
                <LoadingMsg>A carregar...</LoadingMsg>
              ) : messages.length === 0 ? (
                <LoadingMsg>Sem mensagens. Diz olá! 👋</LoadingMsg>
              ) : (
                messages.map((m) => {
                  const isMine = m.fromUserId === user?.id;
                  return (
                    <MessageRow key={m.id} $mine={isMine}>
                      <Bubble $mine={isMine}>
                        <BubbleText>{m.content}</BubbleText>
                        <BubbleTime>
                          {new Date(m.createdAt).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </BubbleTime>
                      </Bubble>
                    </MessageRow>
                  );
                })
              )}
              <div ref={bottomRef} />
            </MessageList>

            <InputRow>
              <MessageInput
                placeholder="Escreve uma mensagem..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <SendBtn onClick={handleSend} disabled={!draft.trim()}>
                →
              </SendBtn>
            </InputRow>
          </>
        )}
      </ChatArea>
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}`;

const Page = styled.div`
  display: flex;
  height: calc(100vh - 60px);
  max-height: 800px;
  background: #0a0a0f;
  border: 1px solid #1e1e28;
  border-radius: 12px;
  overflow: hidden;
  animation: ${fadeIn} 0.2s ease;
  margin: 20px;
`;

const Sidebar = styled.div`
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid #1e1e28;
  display: flex;
  flex-direction: column;
  background: #111118;
`;

const SidebarHeader = styled.div`
  padding: 20px 16px 14px;
  border-bottom: 1px solid #1e1e28;
`;

const SidebarTitle = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #e8e8f0;
`;

const EmptyPartners = styled.div`
  padding: 20px 16px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #444455;
`;

const PartnerRow = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'rgba(200,245,66,0.06)' : 'transparent')};
  border-left: 2px solid ${({ $active }) => ($active ? '#c8f542' : 'transparent')};
  transition: all 0.15s;
  &:hover { background: rgba(200,245,66,0.04); }
`;

const PartnerAvatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #2a2a35;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #c8f542;
  flex-shrink: 0;
`;

const PartnerInfo = styled.div`flex: 1; min-width: 0;`;

const PartnerName = styled.div`
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #e8e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PartnerRole = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  margin-top: 1px;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const NoChatSelected = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const NoChatIcon = styled.div`font-size: 40px;`;

const NoChatText = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #444455;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #1e1e28;
  background: #111118;
`;

const ChatHeaderName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #e8e8f0;
`;

const ChatHeaderSub = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  margin-left: auto;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 2px; }
`;

const LoadingMsg = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #444455;
  text-align: center;
  padding: 20px 0;
`;

const MessageRow = styled.div<{ $mine: boolean }>`
  display: flex;
  justify-content: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
`;

const Bubble = styled.div<{ $mine: boolean }>`
  max-width: 72%;
  background: ${({ $mine }) => ($mine ? 'rgba(200,245,66,0.12)' : '#1a1a22')};
  border: 1px solid ${({ $mine }) => ($mine ? 'rgba(200,245,66,0.25)' : '#2a2a35')};
  border-radius: ${({ $mine }) => ($mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px')};
  padding: 10px 14px;
`;

const BubbleText = styled.div`
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: #e8e8f0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const BubbleTime = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #444455;
  text-align: right;
  margin-top: 4px;
`;

const InputRow = styled.div`
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #1e1e28;
  background: #111118;
`;

const MessageInput = styled.textarea`
  flex: 1;
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 8px;
  padding: 10px 14px;
  color: #e8e8f0;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  resize: none;
  outline: none;
  line-height: 1.5;
  &:focus { border-color: #c8f542; }
  &::placeholder { color: #333342; }
`;

const SendBtn = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 8px;
  width: 44px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
  &:hover:not(:disabled) { background: #d4ff55; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
