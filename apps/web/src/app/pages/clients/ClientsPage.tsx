import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../../utils/api/clients.api';
import { UserDto } from '@libs/types';
import styled from 'styled-components';

const STATUS_COLOR: Record<string, string> = {
  INICIANTE: '#ff8c5a',
  INTERMEDIO: '#42a5f5',
  AVANCADO: '#c8f542',
};

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<UserDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientsApi.getAll()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) =>
    c.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Page>
      <Header>
        <div>
          <Title>Clientes</Title>
          <Subtitle>// {clients.length} clientes registados</Subtitle>
        </div>
        <NewBtn $secondary onClick={() => navigate('/clients/new')}>+ Novo Cliente</NewBtn>
        <NewBtn onClick={() => navigate('/prescription')}>+ Nova Prescrição</NewBtn>
      </Header>

      <SearchInput
        placeholder="Pesquisar cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <Empty>A carregar clientes...</Empty>
      ) : filtered.length === 0 ? (
        <Empty>Nenhum cliente encontrado.</Empty>
      ) : (
        <ClientGrid>
          {filtered.map((c) => (
            <ClientCard key={c.id} onClick={() => navigate(`/clients/${c.client?.id}`)}>
              <Avatar>{(c.client?.name ?? c.email)[0].toUpperCase()}</Avatar>
              <CardInfo>
                <ClientName>{c.client?.name ?? '—'}</ClientName>
                <ClientEmail>{c.email}</ClientEmail>
                <TagRow>
                  <Tag $color="#2a2a35" $text="#888">
                    {new Date(c.createdAt).toLocaleDateString('pt-PT')}
                  </Tag>
                  {c.client?.birthDate && (
                    <Tag $color="#1a2a1a" $text="#c8f542">
                      {getAge(c.client.birthDate)} anos
                    </Tag>
                  )}
                </TagRow>
              </CardInfo>
              <ArrowIcon>→</ArrowIcon>
            </ClientCard>
          ))}
        </ClientGrid>
      )}
    </Page>
  );
};

function getAge(birthDate: string) {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Page = styled.div`padding: 40px 32px; max-width: 900px;`;

const Header = styled.div`
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
`;

const Title = styled.h1`
  font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #e8e8f0;
`;

const Subtitle = styled.p`
  font-family: 'DM Mono', monospace; font-size: 11px; color: #666677; margin-top: 4px;
`;

const NewBtn = styled.button<{ $secondary?: boolean }>`
  ${({ $secondary }) => $secondary
    ? 'background: transparent; border: 1px solid #2a2a35; color: #666677;'
    : 'background: #c8f542; color: #0a0a0f; border: none;'}

  background: #c8f542; color: #0a0a0f; border: none; border-radius: 6px;
  padding: 12px 20px; font-family: 'Syne', sans-serif; font-weight: 700;
  font-size: 13px; cursor: pointer; transition: background 0.2s;
  &:hover { background: #d4ff55; }
`;

const SearchInput = styled.input`
  background: #18181f; border: 1px solid #2a2a35; border-radius: 6px;
  padding: 11px 16px; color: #e8e8f0; font-size: 14px; outline: none;
  width: 100%; max-width: 360px; margin-bottom: 24px; font-family: 'DM Sans', sans-serif;
  transition: border-color 0.2s;
  &:focus { border-color: #c8f542; }
  &::placeholder { color: #444455; }
`;

const ClientGrid = styled.div`display: flex; flex-direction: column; gap: 10px;`;

const ClientCard = styled.div`
  display: flex; align-items: center; gap: 16px;
  background: #111118; border: 1px solid #2a2a35; border-radius: 10px;
  padding: 16px 20px; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: rgba(200,245,66,0.3); transform: translateX(4px); }
`;

const Avatar = styled.div`
  width: 44px; height: 44px; border-radius: 8px; background: rgba(200,245,66,0.1);
  border: 1px solid rgba(200,245,66,0.2); display: flex; align-items: center;
  justify-content: center; font-family: 'Syne', sans-serif; font-size: 18px;
  font-weight: 800; color: #c8f542; flex-shrink: 0;
`;

const CardInfo = styled.div`flex: 1;`;

const ClientName = styled.div`
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
  color: #e8e8f0; margin-bottom: 2px;
`;

const ClientEmail = styled.div`
  font-family: 'DM Mono', monospace; font-size: 11px; color: #666677; margin-bottom: 6px;
`;

const TagRow = styled.div`display: flex; gap: 6px; flex-wrap: wrap;`;

const Tag = styled.span<{ $color: string; $text: string }>`
  font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1px;
  padding: 3px 8px; border-radius: 3px;
  background: ${({ $color }) => $color}; color: ${({ $text }) => $text};
`;

const ArrowIcon = styled.span`color: #2a2a35; font-size: 18px; flex-shrink: 0;`;

const Empty = styled.div`
  font-family: 'DM Mono', monospace; font-size: 13px; color: #666677;
  padding: 48px 0; text-align: center;
`;
