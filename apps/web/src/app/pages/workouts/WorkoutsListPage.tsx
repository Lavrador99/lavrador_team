import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { workoutsApi } from '../../utils/api/workouts.api';
import { programsApi } from '../../utils/api/prescription.api';
import { WorkoutDto, ProgramDto } from '@libs/types';
import styled from 'styled-components';

const STATUS_COLOR: Record<string, string> = {
  DRAFT: '#666677', ACTIVE: '#c8f542', ARCHIVED: '#444455',
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho', ACTIVE: 'Ativo', ARCHIVED: 'Arquivado',
};

export const WorkoutsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get('programId') ?? '';
  const clientId = searchParams.get('clientId') ?? '';

  const [program, setProgram] = useState<ProgramDto | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;
    Promise.all([
      programsApi.getById(programId),
      workoutsApi.getByProgram(programId),
    ]).then(([p, w]) => {
      setProgram(p);
      setWorkouts(w);
    }).finally(() => setLoading(false));
  }, [programId]);

  const handleActivate = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    await workoutsApi.update(id, { status: newStatus as any });
    setWorkouts((prev) => prev.map((w) => w.id === id ? { ...w, status: newStatus as any } : w));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar este treino?')) return;
    await workoutsApi.remove(id);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const totalDuration = workouts.reduce((a, w) => a + (w.durationEstimatedMin ?? 0), 0);

  return (
    <Page>
      <BackBtn onClick={() => navigate(`/clients/${clientId}`)}>← Perfil do cliente</BackBtn>

      <Header>
        <div>
          <Title>Treinos do Plano</Title>
          {program && <Subtitle>// {program.name} · {workouts.length} sessões · ~{totalDuration} min total</Subtitle>}
        </div>
        <NewBtn onClick={() => navigate(`/workouts/editor?programId=${programId}&clientId=${clientId}`)}>
          + Novo Treino
        </NewBtn>
      </Header>

      {loading ? (
        <LoadingMsg>A carregar treinos...</LoadingMsg>
      ) : workouts.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📋</EmptyIcon>
          <EmptyTitle>Ainda não há treinos detalhados.</EmptyTitle>
          <EmptyText>Cria o primeiro treino para este plano.</EmptyText>
          <NewBtn onClick={() => navigate(`/workouts/editor?programId=${programId}&clientId=${clientId}`)}>
            + Criar Primeiro Treino
          </NewBtn>
        </EmptyState>
      ) : (
        <WorkoutGrid>
          {workouts.map((w, i) => (
            <WorkoutCard key={w.id}>
              <CardTop>
                <CardOrder>{String(i + 1).padStart(2, '0')}</CardOrder>
                <CardInfo>
                  <CardName>{w.name}</CardName>
                  {w.dayLabel && <CardDay>{w.dayLabel}</CardDay>}
                </CardInfo>
                <StatusBadge $color={STATUS_COLOR[w.status]}>{STATUS_LABEL[w.status]}</StatusBadge>
              </CardTop>

              <CardStats>
                <Stat>
                  <StatVal>{w.durationEstimatedMin ?? 0}</StatVal>
                  <StatLabel>min est.</StatLabel>
                </Stat>
                <Stat>
                  <StatVal>{(w.blocks as any[])?.length ?? 0}</StatVal>
                  <StatLabel>blocos</StatLabel>
                </Stat>
                <Stat>
                  <StatVal>
                    {(w.blocks as any[])?.reduce((a: number, b: any) => a + (b.exercises?.length ?? 0), 0) ?? 0}
                  </StatVal>
                  <StatLabel>exercícios</StatLabel>
                </Stat>
              </CardStats>

              {/* Block type summary */}
              <BlockTypes>
                {[...new Set((w.blocks as any[])?.map((b: any) => b.type) ?? [])].map((type: string) => (
                  <BlockTypeTag key={type}>{type}</BlockTypeTag>
                ))}
              </BlockTypes>

              <CardActions>
                <EditBtn onClick={() => navigate(`/workouts/editor/${w.id}`)}>✎ Editar</EditBtn>
                <ActivateBtn
                  $active={w.status === 'ACTIVE'}
                  onClick={() => handleActivate(w.id, w.status)}
                >
                  {w.status === 'ACTIVE' ? '⏸ Desativar' : '▶ Ativar'}
                </ActivateBtn>
                <DeleteBtn onClick={() => handleDelete(w.id)}>✕</DeleteBtn>
              </CardActions>
            </WorkoutCard>
          ))}
        </WorkoutGrid>
      )}
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Page = styled.div`padding: 40px 32px; max-width: 960px;`;
const BackBtn = styled.button`background:none;border:none;color:#666677;font-size:13px;cursor:pointer;margin-bottom:24px;font-family:'DM Mono',monospace;padding:0;&:hover{color:#c8f542;}`;
const Header = styled.div`display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:16px;`;
const Title = styled.h1`font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#e8e8f0;`;
const Subtitle = styled.p`font-family:'DM Mono',monospace;font-size:11px;color:#666677;margin-top:4px;`;
const NewBtn = styled.button`background:#c8f542;color:#0a0a0f;border:none;border-radius:6px;padding:11px 20px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:background .2s;&:hover{background:#d4ff55;}`;
const LoadingMsg = styled.p`font-family:'DM Mono',monospace;font-size:13px;color:#666677;padding:40px 0;`;
const EmptyState = styled.div`text-align:center;padding:80px 24px;`;
const EmptyIcon = styled.div`font-size:48px;margin-bottom:16px;`;
const EmptyTitle = styled.h2`font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#e8e8f0;margin-bottom:8px;`;
const EmptyText = styled.p`font-family:'DM Mono',monospace;font-size:12px;color:#666677;margin-bottom:20px;`;

const WorkoutGrid = styled.div`display:flex;flex-direction:column;gap:12px;`;
const WorkoutCard = styled.div`background:#111118;border:1px solid #2a2a35;border-radius:10px;padding:18px 20px;transition:border-color .2s;&:hover{border-color:rgba(200,245,66,0.2);}`;
const CardTop = styled.div`display:flex;align-items:center;gap:14px;margin-bottom:14px;`;
const CardOrder = styled.div`width:32px;height:32px;border-radius:6px;background:rgba(200,245,66,0.08);border:1px solid rgba(200,245,66,0.2);display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:11px;color:#c8f542;flex-shrink:0;`;
const CardInfo = styled.div`flex:1;`;
const CardName = styled.div`font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:#e8e8f0;`;
const CardDay = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#666677;margin-top:2px;`;
const StatusBadge = styled.span<{ $color: string }>`font-family:'DM Mono',monospace;font-size:10px;padding:3px 8px;border-radius:3px;background:${p=>p.$color}18;color:${p=>p.$color};border:1px solid ${p=>p.$color}33;`;
const CardStats = styled.div`display:flex;gap:20px;margin-bottom:12px;`;
const Stat = styled.div``;
const StatVal = styled.div`font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#e8e8f0;`;
const StatLabel = styled.div`font-family:'DM Mono',monospace;font-size:9px;color:#666677;letter-spacing:1px;`;
const BlockTypes = styled.div`display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;`;
const BlockTypeTag = styled.span`font-family:'DM Mono',monospace;font-size:9px;padding:2px 8px;border-radius:3px;background:#18181f;border:1px solid #2a2a35;color:#666677;`;
const CardActions = styled.div`display:flex;gap:8px;`;
const EditBtn = styled.button`background:rgba(200,245,66,0.08);border:1px solid rgba(200,245,66,0.2);color:#c8f542;padding:7px 14px;border-radius:6px;font-size:12px;font-family:'DM Mono',monospace;cursor:pointer;&:hover{background:rgba(200,245,66,0.14);}`;
const ActivateBtn = styled.button<{ $active?: boolean }>`background:${p=>p.$active?'rgba(255,107,53,0.08)':'rgba(66,165,245,0.08)'};border:1px solid ${p=>p.$active?'rgba(255,107,53,0.2)':'rgba(66,165,245,0.2)'};color:${p=>p.$active?'#ff8c5a':'#42a5f5'};padding:7px 14px;border-radius:6px;font-size:12px;font-family:'DM Mono',monospace;cursor:pointer;`;
const DeleteBtn = styled.button`background:transparent;border:1px solid #2a2a35;color:#444455;padding:7px 10px;border-radius:6px;font-size:12px;cursor:pointer;&:hover{border-color:#ff3b3b;color:#ff6b6b;}`;
