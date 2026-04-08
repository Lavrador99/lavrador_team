import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { workoutTemplatesApi, WorkoutTemplateDto } from '../../utils/api/workout-templates.api';

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: 'Aq.', SEQUENTIAL: 'Seq.', SUPERSET: 'SS',
  CIRCUIT: 'Circ.', TABATA: 'Tab.', CARDIO: 'Cardio', FLEXIBILITY: 'Flex.',
};

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkoutTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    workoutTemplatesApi.getAll()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar este template?')) return;
    await workoutTemplatesApi.delete(id);
    load();
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Page>
      <Header>
        <div>
          <Title>Templates</Title>
          <Subtitle>// {templates.length} template{templates.length !== 1 ? 's' : ''}</Subtitle>
        </div>
        <NewBtn onClick={() => navigate('/workouts/editor')}>+ Novo treino</NewBtn>
      </Header>

      <SearchRow>
        <SearchInput
          placeholder="Pesquisar por nome ou tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchRow>

      {loading ? (
        <Empty>A carregar...</Empty>
      ) : filtered.length === 0 ? (
        <Empty>
          {templates.length === 0
            ? 'Ainda não criaste nenhum template.\nGuarda um treino como template no editor de treinos.'
            : 'Sem resultados para essa pesquisa.'}
        </Empty>
      ) : (
        <Grid>
          {filtered.map((t) => (
            <TemplateCard key={t.id}>
              <CardTop>
                <CardName>{t.name}</CardName>
                {t.isPublic && <PublicBadge>público</PublicBadge>}
              </CardTop>

              {t.description && <CardDesc>{t.description}</CardDesc>}

              <BlockPills>
                {t.blocks.map((b, i) => (
                  <BlockPill key={i}>{BLOCK_TYPE_LABELS[b.type] ?? b.type}</BlockPill>
                ))}
              </BlockPills>

              {t.tags.length > 0 && (
                <TagRow>
                  {t.tags.map((tag) => <Tag key={tag}>#{tag}</Tag>)}
                </TagRow>
              )}

              <CardMeta>
                {t.blocks.length} bloco{t.blocks.length !== 1 ? 's' : ''} ·{' '}
                {t.blocks.reduce((s, b) => s + b.exercises.length, 0)} exercícios
              </CardMeta>

              <CardActions>
                <UseBtn onClick={() => navigate('/workouts/editor', { state: { templateBlocks: t.blocks, templateName: t.name } })}>
                  Usar template →
                </UseBtn>
                <DeleteBtn onClick={() => handleDelete(t.id)}>✕</DeleteBtn>
              </CardActions>
            </TemplateCard>
          ))}
        </Grid>
      )}
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

const Page = styled.div`
  padding: 40px 32px;
  max-width: 1100px;
  animation: ${fadeIn} 0.25s ease;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #e8e8f0;
`;

const Subtitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  margin-top: 4px;
`;

const SearchRow = styled.div`margin-bottom: 20px;`;

const SearchInput = styled.input`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 7px;
  padding: 10px 16px;
  color: #e8e8f0;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  width: 320px;
  outline: none;
  &:focus { border-color: #c8f542; }
  &::placeholder { color: #333342; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const TemplateCard = styled.div`
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s;
  &:hover { border-color: rgba(200,245,66,0.2); }
`;

const CardTop = styled.div`display: flex; align-items: center; gap: 8px;`;

const CardName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #e8e8f0;
  flex: 1;
`;

const PublicBadge = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 3px;
  color: #c8f542;
  background: rgba(200,245,66,0.08);
  border: 1px solid rgba(200,245,66,0.2);
`;

const CardDesc = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  line-height: 1.5;
`;

const BlockPills = styled.div`display: flex; flex-wrap: wrap; gap: 5px;`;

const BlockPill = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 3px;
  background: #1a1a22;
  border: 1px solid #2a2a35;
  color: #888899;
`;

const TagRow = styled.div`display: flex; flex-wrap: wrap; gap: 5px;`;

const Tag = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #42a5f5;
`;

const CardMeta = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  margin-top: auto;
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const UseBtn = styled.button`
  flex: 1;
  background: rgba(200,245,66,0.08);
  border: 1px solid rgba(200,245,66,0.2);
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #c8f542;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(200,245,66,0.15); }
`;

const DeleteBtn = styled.button`
  background: transparent;
  border: 1px solid #2a2a35;
  color: #666677;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  &:hover { border-color: #ff3b3b; color: #ff3b3b; }
`;

const NewBtn = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 7px;
  padding: 10px 18px;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #d4ff55; }
`;
const Empty = styled.div`
  padding: 60px 24px;
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #444455;
  line-height: 1.8;
  white-space: pre-line;
`;
