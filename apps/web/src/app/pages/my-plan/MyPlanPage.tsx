import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { WorkoutDto } from '@libs/types';
import { workoutsApi } from '../../utils/api/workouts.api';
import { pdf } from '@react-pdf/renderer';
import { WorkoutPlanPdf } from '../../utils/pdf/WorkoutPlanPdf';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: 'Aquecimento',
  SEQUENTIAL: 'Sequencial',
  SUPERSET: 'Superset',
  CIRCUIT: 'Circuito',
  TABATA: 'Tabata',
  CARDIO: 'Cardio',
  FLEXIBILITY: 'Flexibilidade',
};

const BLOCK_TYPE_COLOR: Record<string, string> = {
  WARMUP: '#42a5f5',
  SEQUENTIAL: '#c8f542',
  SUPERSET: '#ff8c5a',
  CIRCUIT: '#c084fc',
  TABATA: '#f472b6',
  CARDIO: '#34d399',
  FLEXIBILITY: '#60a5fa',
};

export const MyPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const [workouts, setWorkouts] = useState<WorkoutDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!workouts.length) return;
    setExportingPdf(true);
    try {
      const blob = await pdf(
        <WorkoutPlanPdf
          workouts={workouts}
          clientName={user?.email?.split('@')[0] ?? 'Cliente'}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plano-de-treino.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    workoutsApi.getMy()
      .then(setWorkouts)
      .catch(() => setError('Não foi possível carregar o plano.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  if (loading) {
    return (
      <PageWrapper>
        <LoadingState>A carregar o teu plano...</LoadingState>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <EmptyState>{error}</EmptyState>
      </PageWrapper>
    );
  }

  if (workouts.length === 0) {
    return (
      <PageWrapper>
        <PageHeader>
          <PageTitle>O meu plano</PageTitle>
          <PageSubtitle>// Treinos activos</PageSubtitle>
        </PageHeader>
        <EmptyState>
          Ainda não tens nenhum plano activo.<br />
          Fala com o teu treinador para começar!
        </EmptyState>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader>
        <div>
          <PageTitle>O meu plano</PageTitle>
          <PageSubtitle>// {workouts.length} treino{workouts.length !== 1 ? 's' : ''}</PageSubtitle>
        </div>
        <PdfBtn onClick={handleExportPdf} disabled={exportingPdf || !workouts.length}>
          {exportingPdf ? '...' : '↓ PDF'}
        </PdfBtn>
      </PageHeader>

      <WorkoutList>
        {workouts.map((workout) => (
          <WorkoutCard key={workout.id}>
            <WorkoutCardHeader>
              <WorkoutMeta>
                <WorkoutDay>
                  {workout.dayLabel ?? `Treino ${workout.order + 1}`}
                  {workout.status === 'DRAFT' && <DraftBadge>rascunho</DraftBadge>}
                </WorkoutDay>
                <WorkoutName>{workout.name}</WorkoutName>
              </WorkoutMeta>
              <WorkoutActions>
                <DurationBadge>
                  ⏱ {workout.durationEstimatedMin} min
                </DurationBadge>
                <StartBtn onClick={() => navigate(`/my-plan/log/${workout.id}`)}>
                  Iniciar treino →
                </StartBtn>
              </WorkoutActions>
            </WorkoutCardHeader>

            <BlockList>
              {workout.blocks.map((block) => (
                <BlockCard key={block.id}>
                  <BlockHeader onClick={() => toggleBlock(block.id)}>
                    <BlockLeft>
                      <BlockTypeBadge $color={BLOCK_TYPE_COLOR[block.type] ?? '#666677'}>
                        {BLOCK_TYPE_LABELS[block.type] ?? block.type}
                      </BlockTypeBadge>
                      {block.label && <BlockLabel>{block.label}</BlockLabel>}
                    </BlockLeft>
                    <BlockRight>
                      <BlockMeta>{block.exercises.length} exercício{block.exercises.length !== 1 ? 's' : ''}</BlockMeta>
                      <ExpandIcon $open={expandedBlocks.has(block.id)}>▼</ExpandIcon>
                    </BlockRight>
                  </BlockHeader>

                  {expandedBlocks.has(block.id) && (
                    <BlockBody>
                      {block.type === 'CARDIO' && (
                        <CardioInfo>
                          {block.cardioMethod && <CardioDetail>Método: {block.cardioMethod.replace(/_/g, ' ')}</CardioDetail>}
                          {block.cardioDurationMin && <CardioDetail>Duração: {block.cardioDurationMin} min</CardioDetail>}
                          {block.cardioZoneLow && block.cardioZoneHigh && (
                            <CardioDetail>FC: {block.cardioZoneLow}–{block.cardioZoneHigh} bpm</CardioDetail>
                          )}
                          {block.cardioNotes && <CardioDetail>{block.cardioNotes}</CardioDetail>}
                        </CardioInfo>
                      )}

                      {block.type === 'TABATA' && block.tabata && (
                        <CardioInfo>
                          <CardioDetail>Trabalho: {block.tabata.workSeconds}s</CardioDetail>
                          <CardioDetail>Descanso: {block.tabata.restSeconds}s</CardioDetail>
                          <CardioDetail>Rounds: {block.tabata.rounds}</CardioDetail>
                          <CardioDetail>Total: {Math.round(block.tabata.totalSeconds / 60)} min</CardioDetail>
                        </CardioInfo>
                      )}

                      <ExerciseTable>
                        <ExerciseTableHead>
                          <tr>
                            <ExerciseTh>Exercício</ExerciseTh>
                            <ExerciseTh center>Séries</ExerciseTh>
                            <ExerciseTh center>Reps</ExerciseTh>
                            <ExerciseTh center>Carga</ExerciseTh>
                            <ExerciseTh center>Desc.</ExerciseTh>
                          </tr>
                        </ExerciseTableHead>
                        <tbody>
                          {block.exercises.map((ex) => (
                            <ExerciseTr key={ex.id}>
                              <ExerciseTd>
                                <ExerciseNameRow>
                                  <ExerciseName>{ex.exerciseName}</ExerciseName>
                                  <HistoryLink
                                    onClick={() => navigate(`/exercise-history/${encodeURIComponent(ex.exerciseName)}`)}
                                    title="Ver evolução"
                                  >
                                    📈
                                  </HistoryLink>
                                </ExerciseNameRow>
                                {ex.notes && <ExerciseNote>{ex.notes}</ExerciseNote>}
                                {ex.loadNote && <ExerciseNote>{ex.loadNote}</ExerciseNote>}
                              </ExerciseTd>
                              <ExerciseTd center>{ex.sets}×</ExerciseTd>
                              <ExerciseTd center>{ex.reps}</ExerciseTd>
                              <ExerciseTd center>
                                {ex.load ? `${ex.load} kg` : ex.percentRM ? `${ex.percentRM}% RM` : '—'}
                              </ExerciseTd>
                              <ExerciseTd center>
                                {ex.restAfterSet ? `${ex.restAfterSet}s` : block.restBetweenSets ? `${block.restBetweenSets}s` : '—'}
                              </ExerciseTd>
                            </ExerciseTr>
                          ))}
                        </tbody>
                      </ExerciseTable>

                      {block.restAfterBlock > 0 && (
                        <RestNote>Descanso após bloco: {block.restAfterBlock}s</RestNote>
                      )}
                    </BlockBody>
                  )}
                </BlockCard>
              ))}
            </BlockList>
          </WorkoutCard>
        ))}
      </WorkoutList>
    </PageWrapper>
  );
};

// ─── Styled Components ────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const PageWrapper = styled.div`
  padding: 40px 32px;
  max-width: 900px;
  animation: ${fadeIn} 0.25s ease;
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
`;

const PageTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: #e8e8f0;
`;

const PageSubtitle = styled.p`
  font-size: 13px;
  color: #666677;
  margin-top: 4px;
  font-family: 'DM Mono', monospace;
`;

const WorkoutList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const WorkoutCard = styled.div`
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 12px;
  overflow: hidden;
`;

const WorkoutCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #1e1e28;
  gap: 16px;
`;

const WorkoutMeta = styled.div``;

const WorkoutDay = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #c8f542;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DraftBadge = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 1px;
  color: #666677;
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 3px;
  padding: 1px 6px;
  text-transform: uppercase;
`;

const WorkoutName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #e8e8f0;
`;

const DurationBadge = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #666677;
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 6px 12px;
  white-space: nowrap;
`;

const BlockList = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BlockCard = styled.div`
  background: #0d0d13;
  border: 1px solid #1e1e28;
  border-radius: 8px;
  overflow: hidden;
`;

const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  gap: 12px;

  &:hover {
    background: rgba(200, 245, 66, 0.03);
  }
`;

const BlockLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BlockRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BlockTypeBadge = styled.span<{ $color: string }>`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 1px;
  padding: 3px 8px;
  border-radius: 3px;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}18;
  border: 1px solid ${({ $color }) => $color}44;
`;

const BlockLabel = styled.span`
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: #e8e8f0;
  font-weight: 600;
`;

const BlockMeta = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #444455;
`;

const ExpandIcon = styled.span<{ $open: boolean }>`
  font-size: 10px;
  color: #444455;
  transition: transform 0.2s;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`;

const BlockBody = styled.div`
  padding: 0 16px 16px;
  border-top: 1px solid #1e1e28;
`;

const CardioInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0;
`;

const CardioDetail = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #888899;
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 4px;
  padding: 4px 10px;
`;

const ExerciseTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
`;

const ExerciseTableHead = styled.thead`
  border-bottom: 1px solid #1e1e28;
`;

const ExerciseTh = styled.th<{ center?: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: #444455;
  text-transform: uppercase;
  padding: 6px 8px;
  text-align: ${({ center }) => (center ? 'center' : 'left')};
  font-weight: 400;
`;

const ExerciseTr = styled.tr`
  border-bottom: 1px solid #1a1a22;

  &:last-child {
    border-bottom: none;
  }
`;

const ExerciseTd = styled.td<{ center?: boolean }>`
  padding: 10px 8px;
  text-align: ${({ center }) => (center ? 'center' : 'left')};
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #888899;
  vertical-align: top;
`;

const ExerciseNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HistoryLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 12px;
  opacity: 0.5;
  transition: opacity 0.15s;
  flex-shrink: 0;
  &:hover { opacity: 1; }
`;

const ExerciseName = styled.div`
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: #e8e8f0;
  font-weight: 500;
`;

const ExerciseNote = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #555566;
  margin-top: 2px;
`;

const RestNote = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  margin-top: 10px;
  letter-spacing: 1px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 24px;
  color: #666677;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  line-height: 1.8;
`;

const LoadingState = styled.div`
  padding: 80px 24px;
  color: #666677;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
`;

const PdfBtn = styled.button`
  background: transparent;
  border: 1px solid #2a2a35;
  color: #666677;
  border-radius: 6px;
  padding: 7px 14px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover:not(:disabled) { border-color: #c8f542; color: #c8f542; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const WorkoutActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

const StartBtn = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 7px;
  padding: 8px 16px;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover { background: #d4ff55; }
`;
