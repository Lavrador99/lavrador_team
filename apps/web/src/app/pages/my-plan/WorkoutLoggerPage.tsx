import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { WorkoutDto, WorkoutBlock, BlockExercise, CreateWorkoutLogRequest, WorkoutLogEntry } from '@libs/types';
import { workoutsApi } from '../../utils/api/workouts.api';
import { SetLogger, SetState } from './components/SetLogger';
import { RestTimer } from './components/RestTimer';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExSetsMap = Record<string, SetState[]>; // key: `${blockId}_${exId}`

interface ActiveTimer {
  seconds: number;
}

// key: exerciseName → best set from last log
type LastValues = Record<string, { load: number | null; reps: number }>;

// exerciseId → new 1RM
type NewPRs = Record<string, number>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildKey = (blockId: string, exId: string) => `${blockId}_${exId}`;

const initSets = (ex: BlockExercise): SetState[] =>
  Array.from({ length: ex.sets }, () => ({
    completed: false,
    actualLoad: ex.load ? String(ex.load) : '',
    actualReps: '',
    rpe: null,
    setType: 'NORMAL' as const,
  }));

const BLOCK_TYPE_COLOR: Record<string, string> = {
  WARMUP: '#42a5f5',
  SEQUENTIAL: '#c8f542',
  SUPERSET: '#ff8c5a',
  CIRCUIT: '#c084fc',
  TABATA: '#f472b6',
  CARDIO: '#34d399',
  FLEXIBILITY: '#60a5fa',
};

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: 'Aquecimento',
  SEQUENTIAL: 'Sequencial',
  SUPERSET: 'Superset',
  CIRCUIT: 'Circuito',
  TABATA: 'Tabata',
  CARDIO: 'Cardio',
  FLEXIBILITY: 'Flexibilidade',
};

function formatElapsed(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const WorkoutLoggerPage: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<WorkoutDto | null>(null);
  const [loading, setLoading] = useState(true);

  // per-set state: key → SetState[]
  const [setsMap, setSetsMap] = useState<ExSetsMap>({});

  // rest timer
  const [timer, setTimer] = useState<ActiveTimer | null>(null);

  // elapsed stopwatch
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // last values badge (from previous log)
  const [lastValues, setLastValues] = useState<LastValues>({});

  // PRs detected in this session
  const [newPRs, setNewPRs] = useState<NewPRs>({});

  // summary modal
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionRpe, setSessionRpe] = useState<number | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');

  // load workout + last log for "last values" badges
  useEffect(() => {
    if (!workoutId) return;
    Promise.all([
      workoutsApi.getById(workoutId),
      workoutsApi.getLogsByWorkout(workoutId),
    ])
      .then(([w, logs]) => {
        setWorkout(w);
        const map: ExSetsMap = {};
        w.blocks.forEach((b) => {
          b.exercises.forEach((ex) => {
            map[buildKey(b.id, ex.id)] = initSets(ex);
          });
        });
        setSetsMap(map);

        // Build last values from most recent log
        if (logs.length > 0) {
          const lastLog = logs[0]; // already ordered desc by date
          const lv: LastValues = {};
          for (const entry of lastLog.entries as any[]) {
            const best = (entry.sets as any[])
              .filter((s: any) => s.completed && s.reps > 0)
              .sort((a: any, b: any) => (b.load ?? 0) - (a.load ?? 0))[0];
            if (best) {
              lv[entry.exerciseName] = { load: best.load ?? null, reps: best.reps };
            }
          }
          setLastValues(lv);
        }
      })
      .catch(() => navigate('/my-plan'))
      .finally(() => setLoading(false));
  }, [workoutId, navigate]);

  // start stopwatch on mount
  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, []);

  const updateSet = (key: string, idx: number, s: SetState) => {
    setSetsMap((prev) => {
      const arr = [...(prev[key] ?? [])];
      arr[idx] = s;
      return { ...prev, [key]: arr };
    });
  };

  const handleSetComplete = (block: WorkoutBlock, ex: BlockExercise) => {
    const rest = ex.restAfterSet ?? block.restBetweenSets;
    if (rest > 0) setTimer({ seconds: rest });
  };

  const buildLogEntries = (): WorkoutLogEntry[] => {
    if (!workout) return [];
    const entries: WorkoutLogEntry[] = [];
    workout.blocks.forEach((b) => {
      b.exercises.forEach((ex) => {
        const key = buildKey(b.id, ex.id);
        const sets = setsMap[key] ?? [];
        entries.push({
          blockId: b.id,
          exerciseId: ex.exerciseId ?? ex.id,
          exerciseName: ex.exerciseName,
          sets: sets.map((s, i) => ({
            setNumber: i + 1,
            reps: Number(s.actualReps) || 0,
            load: s.actualLoad ? Number(s.actualLoad) : undefined,
            rpe: s.rpe ?? undefined,
            completed: s.completed,
            setType: s.setType,
          })),
        });
      });
    });
    return entries;
  };

  const handleFinish = () => {
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    setTimer(null);

    // Detect new PRs (Epley 1RM)
    const prs: NewPRs = {};
    const entries = buildLogEntries();
    for (const entry of entries) {
      let best1RM = 0;
      for (const s of entry.sets) {
        if (!s.completed || !s.load || !s.reps) continue;
        const rm = s.load * (1 + s.reps / 30);
        if (rm > best1RM) best1RM = rm;
      }
      if (best1RM > 0) {
        const prev = lastValues[entry.exerciseName];
        const prevRM = prev?.load ? prev.load * (1 + prev.reps / 30) : 0;
        if (best1RM > prevRM) {
          prs[entry.exerciseName] = Math.round(best1RM);
        }
      }
    }
    setNewPRs(prs);
    setDone(true);
  };

  const handleSave = async () => {
    if (!workout) return;
    setSaving(true);
    try {
      const body: CreateWorkoutLogRequest = {
        workoutId: workout.id,
        date: new Date().toISOString(),
        entries: buildLogEntries(),
        durationMin: Math.round(elapsed / 60),
        rpe: sessionRpe ?? undefined,
        notes: sessionNotes || undefined,
      };
      await workoutsApi.createLog(body);
      navigate('/my-plan');
    } catch {
      setSaving(false);
    }
  };

  const completedSets = Object.values(setsMap).flat().filter((s) => s.completed).length;
  const totalSets = Object.values(setsMap).flat().length;

  if (loading) {
    return (
      <Page>
        <LoadingText>A carregar treino...</LoadingText>
      </Page>
    );
  }

  if (!workout) return null;

  return (
    <Page>
      {/* ── Header ── */}
      <Header>
        <BackBtn onClick={() => navigate('/my-plan')}>← voltar</BackBtn>
        <HeaderCenter>
          <WorkoutTitle>{workout.name}</WorkoutTitle>
          <ElapsedBadge>{formatElapsed(elapsed)}</ElapsedBadge>
        </HeaderCenter>
        <FinishBtn onClick={handleFinish}>Terminar</FinishBtn>
      </Header>

      {/* ── Progress bar ── */}
      <ProgressBar>
        <ProgressFill $pct={totalSets > 0 ? (completedSets / totalSets) * 100 : 0} />
      </ProgressBar>
      <ProgressLabel>{completedSets} / {totalSets} séries concluídas</ProgressLabel>

      {/* ── Rest timer banner (non-blocking) ── */}
      {timer && (
        <TimerBanner>
          <RestTimer seconds={timer.seconds} onDone={() => setTimer(null)} />
          <TimerSkip onClick={() => setTimer(null)}>saltar</TimerSkip>
        </TimerBanner>
      )}

      {/* ── Blocks ── */}
      <Content>
        {workout.blocks.map((block) => (
          <BlockSection key={block.id}>
            <BlockHeader>
              <BlockTypeBadge $color={BLOCK_TYPE_COLOR[block.type] ?? '#666677'}>
                {BLOCK_TYPE_LABELS[block.type] ?? block.type}
              </BlockTypeBadge>
              {block.label && <BlockLabel>{block.label}</BlockLabel>}
            </BlockHeader>

            {block.exercises.map((ex) => {
              const key = buildKey(block.id, ex.id);
              const sets = setsMap[key] ?? [];
              return (
                <ExerciseSection key={ex.id}>
                  <ExerciseHeader>
                    <ExerciseNameRow>
                      <ExerciseName>{ex.exerciseName}</ExerciseName>
                      {lastValues[ex.exerciseName] && (
                        <LastBadge title="Último treino">
                          prev {lastValues[ex.exerciseName].load != null
                            ? `${lastValues[ex.exerciseName].load}kg × `
                            : ''}
                          {lastValues[ex.exerciseName].reps} reps
                        </LastBadge>
                      )}
                    </ExerciseNameRow>
                    <ExerciseMeta>
                      {ex.sets}× · {ex.reps} reps
                      {ex.load && ` · ${ex.load} kg`}
                      {ex.percentRM && ` · ${ex.percentRM}% RM`}
                    </ExerciseMeta>
                    {(ex.notes || ex.loadNote) && (
                      <ExerciseNote>{ex.notes ?? ex.loadNote}</ExerciseNote>
                    )}
                  </ExerciseHeader>

                  <SetColumns>
                    <ColLabel>#</ColLabel>
                    <ColLabel>Previsto</ColLabel>
                    <ColLabel>Reps</ColLabel>
                    <ColLabel>Carga / Reps</ColLabel>
                    <ColLabel>RPE</ColLabel>
                    <ColLabel></ColLabel>
                  </SetColumns>

                  {sets.map((s, idx) => (
                    <SetLogger
                      key={idx}
                      setNumber={idx + 1}
                      targetReps={ex.reps}
                      targetLoad={ex.load}
                      state={s}
                      onChange={(next) => updateSet(key, idx, next)}
                      onComplete={() => handleSetComplete(block, ex)}
                    />
                  ))}
                </ExerciseSection>
              );
            })}

            {block.restAfterBlock > 0 && (
              <BlockRestNote>⏸ Descanso após bloco: {block.restAfterBlock}s</BlockRestNote>
            )}
          </BlockSection>
        ))}
      </Content>

      {/* ── Summary modal ── */}
      {done && (
        <ModalOverlay>
          <Modal>
            <ModalTitle>Treino concluído 🎉</ModalTitle>
            <ModalStats>
              <StatItem>
                <StatVal>{formatElapsed(elapsed)}</StatVal>
                <StatLabel>duração</StatLabel>
              </StatItem>
              <StatItem>
                <StatVal>{completedSets}/{totalSets}</StatVal>
                <StatLabel>séries</StatLabel>
              </StatItem>
            </ModalStats>

            {Object.keys(newPRs).length > 0 && (
              <PRSection>
                <PRTitle>🏆 Novos Records Pessoais</PRTitle>
                {Object.entries(newPRs).map(([name, rm]) => (
                  <PRBadge key={name}>
                    <PRExercise>{name}</PRExercise>
                    <PRValue>~{rm} kg RM</PRValue>
                  </PRBadge>
                ))}
              </PRSection>
            )}

            <ModalLabel>RPE da sessão</ModalLabel>
            <RpeRow>
              {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((r) => (
                <RpeOption
                  key={r}
                  $active={sessionRpe === r}
                  onClick={() => setSessionRpe(r)}
                >
                  {r}
                </RpeOption>
              ))}
            </RpeRow>

            <ModalLabel>Notas</ModalLabel>
            <NotesInput
              placeholder="Como correu o treino?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              rows={3}
            />

            <ModalActions>
              <SecondaryBtn onClick={() => { setDone(false); elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000); }}>
                Continuar
              </SecondaryBtn>
              <SaveBtn onClick={handleSave} disabled={saving}>
                {saving ? 'A guardar...' : 'Guardar treino'}
              </SaveBtn>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Page>
  );
};

// ─── Styled Components ────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: #0a0a0f;
  animation: ${fadeIn} 0.2s ease;
  padding-bottom: 60px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #111118;
  border-bottom: 1px solid #1e1e28;
  position: sticky;
  top: 0;
  z-index: 10;
  gap: 12px;
`;

const BackBtn = styled.button`
  background: transparent;
  border: none;
  color: #666677;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  white-space: nowrap;
  &:hover { color: #e8e8f0; }
`;

const HeaderCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
`;

const WorkoutTitle = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #e8e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const ElapsedBadge = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #c8f542;
  margin-top: 2px;
`;

const FinishBtn = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover { background: #d4ff55; }
`;

const ProgressBar = styled.div`
  height: 3px;
  background: #1e1e28;
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: #c8f542;
  transition: width 0.4s ease;
`;

const ProgressLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  padding: 6px 20px;
  letter-spacing: 1px;
`;

const TimerBanner = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #111118;
  border-top: 1px solid rgba(200, 245, 66, 0.3);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 30;
`;

const TimerSkip = styled.button`
  background: none;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  color: #444455;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
  &:hover { border-color: #c8f542; color: #c8f542; }
`;

const Content = styled.div`
  padding: 20px;
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const BlockSection = styled.div`
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 12px;
  overflow: hidden;
`;

const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #1e1e28;
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
  font-weight: 600;
  color: #e8e8f0;
`;

const ExerciseSection = styled.div`
  padding: 16px;
  border-bottom: 1px solid #1a1a22;
  &:last-child { border-bottom: none; }
`;

const ExerciseHeader = styled.div`
  margin-bottom: 12px;
`;

const ExerciseNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const ExerciseName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #e8e8f0;
`;

const LastBadge = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #888899;
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 4px;
  padding: 2px 7px;
`;

const ExerciseMeta = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  margin-top: 3px;
`;

const ExerciseNote = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  margin-top: 2px;
`;

const SetColumns = styled.div`
  display: grid;
  grid-template-columns: 20px 44px 44px 1fr 58px 36px;
  gap: 8px;
  padding: 0 0 6px;
  border-bottom: 1px solid #1a1a22;
  margin-bottom: 4px;
`;

const ColLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  letter-spacing: 1.5px;
  color: #333342;
  text-transform: uppercase;
  text-align: center;
  &:nth-child(4) { text-align: left; }
`;

const BlockRestNote = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  padding: 10px 16px;
  border-top: 1px solid #1a1a22;
  letter-spacing: 1px;
`;

const LoadingText = styled.div`
  padding: 80px 24px;
  text-align: center;
  color: #666677;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
`;

// ─── Summary Modal ─────────────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const Modal = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 20px 20px 0 0;
  padding: 32px 24px;
  width: 100%;
  max-width: 560px;
  animation: ${keyframes`from{transform:translateY(100%)}to{transform:translateY(0)}`} 0.3s ease;
`;

const ModalTitle = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #e8e8f0;
  margin-bottom: 20px;
`;

const ModalStats = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatVal = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 24px;
  font-weight: 700;
  color: #c8f542;
`;

const StatLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: #444455;
  text-transform: uppercase;
`;

const ModalLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  color: #444455;
  text-transform: uppercase;
  margin-bottom: 10px;
  margin-top: 20px;
`;

const RpeRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const RpeOption = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? 'rgba(200,245,66,0.15)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? '#c8f542' : '#2a2a35')};
  color: ${({ $active }) => ($active ? '#c8f542' : '#666677')};
  border-radius: 6px;
  padding: 6px 12px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #c8f542; color: #c8f542; }
`;

const NotesInput = styled.textarea`
  width: 100%;
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 8px;
  padding: 10px 12px;
  color: #e8e8f0;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  resize: none;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #c8f542; }
  &::placeholder { color: #333342; }
`;

const PRSection = styled.div`
  background: rgba(200, 245, 66, 0.05);
  border: 1px solid rgba(200, 245, 66, 0.2);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 20px;
`;

const PRTitle = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #c8f542;
  margin-bottom: 10px;
`;

const PRBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(200, 245, 66, 0.1);
  &:last-child { border-bottom: none; }
`;

const PRExercise = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #e8e8f0;
`;

const PRValue = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #c8f542;
  font-weight: 700;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 24px;
`;

const SecondaryBtn = styled.button`
  flex: 1;
  background: transparent;
  border: 1px solid #2a2a35;
  color: #666677;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #666677; color: #e8e8f0; }
`;

const SaveBtn = styled.button`
  flex: 2;
  background: #c8f542;
  border: none;
  color: #0a0a0f;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #d4ff55; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
