import React from 'react';
import styled from 'styled-components';
import { SetType } from '@libs/types';

export interface SetState {
  completed: boolean;
  actualLoad: string;
  actualReps: string;
  rpe: number | null;
  setType: SetType;
}

interface Props {
  setNumber: number;
  targetReps: string;
  targetLoad?: number;
  state: SetState;
  onChange: (s: SetState) => void;
  onComplete: () => void;
}

const RPE_OPTIONS = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];

const SET_TYPE_OPTIONS: { value: SetType; label: string; color: string }[] = [
  { value: 'NORMAL', label: 'N', color: '#888899' },
  { value: 'WARMUP', label: 'W', color: '#42a5f5' },
  { value: 'DROP',   label: 'D', color: '#f5a442' },
  { value: 'FAILURE', label: 'F', color: '#f54242' },
];

function calc1RM(load: string, reps: string): number | null {
  const l = parseFloat(load);
  const r = parseInt(reps, 10);
  if (!l || !r || r < 2) return null;
  return Math.round(l * (1 + r / 30));
}

export const SetLogger: React.FC<Props> = ({
  setNumber, targetReps, targetLoad, state, onChange, onComplete,
}) => {
  const update = (patch: Partial<SetState>) => onChange({ ...state, ...patch });

  const handleCheck = () => {
    if (!state.completed) {
      update({ completed: true });
      onComplete();
    } else {
      update({ completed: false });
    }
  };

  const rm1 = state.completed ? calc1RM(state.actualLoad, state.actualReps) : null;

  return (
    <Row $done={state.completed}>
      <TypeToggle>
        {SET_TYPE_OPTIONS.map((opt) => (
          <TypeBtn
            key={opt.value}
            $active={state.setType === opt.value}
            $color={opt.color}
            onClick={() => !state.completed && update({ setType: opt.value })}
            title={opt.value}
          >
            {opt.label}
          </TypeBtn>
        ))}
      </TypeToggle>

      <SetNum>{setNumber}</SetNum>

      <Target>
        <TargetVal>{targetLoad ? `${targetLoad} kg` : '—'}</TargetVal>
        <TargetLabel>previsto</TargetLabel>
      </Target>

      <Target>
        <TargetVal>{targetReps}</TargetVal>
        <TargetLabel>reps</TargetLabel>
      </Target>

      <Inputs $done={state.completed}>
        <SetInput
          type="number"
          placeholder={targetLoad ? String(targetLoad) : 'kg'}
          value={state.actualLoad}
          onChange={(e) => update({ actualLoad: e.target.value })}
          disabled={state.completed}
          min={0}
          step={0.5}
        />
        <SetInput
          type="number"
          placeholder={targetReps}
          value={state.actualReps}
          onChange={(e) => update({ actualReps: e.target.value })}
          disabled={state.completed}
          min={0}
        />
      </Inputs>

      <RpeSelect
        value={state.rpe ?? ''}
        onChange={(e) => update({ rpe: e.target.value ? Number(e.target.value) : null })}
        disabled={state.completed}
        title="RPE (Esforço percebido)"
      >
        <option value="">RPE</option>
        {RPE_OPTIONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </RpeSelect>

      {rm1 ? (
        <RmBadge title="1RM estimado (Epley)">~{rm1}kg</RmBadge>
      ) : (
        <RmBadgePlaceholder />
      )}

      <CheckBtn $done={state.completed} onClick={handleCheck}>
        {state.completed ? '✓' : '○'}
      </CheckBtn>
    </Row>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const Row = styled.div<{ $done: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #1a1a22;
  opacity: ${({ $done }) => ($done ? 0.55 : 1)};
  transition: opacity 0.2s;
  &:last-child { border-bottom: none; }
`;

const TypeToggle = styled.div`
  display: flex;
  gap: 2px;
  flex-shrink: 0;
`;

const TypeBtn = styled.button<{ $active: boolean; $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid ${({ $active, $color }) => ($active ? $color : '#2a2a35')};
  background: ${({ $active, $color }) => ($active ? `${$color}22` : 'transparent')};
  color: ${({ $active, $color }) => ($active ? $color : '#333342')};
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  transition: all 0.12s;
  &:hover { border-color: ${({ $color }) => $color}; color: ${({ $color }) => $color}; }
`;

const SetNum = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #444455;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
`;

const Target = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
`;

const TargetVal = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #888899;
`;

const TargetLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: #333342;
  letter-spacing: 1px;
`;

const Inputs = styled.div<{ $done: boolean }>`
  display: flex;
  gap: 6px;
  flex: 1;
`;

const SetInput = styled.input`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 5px;
  padding: 6px 8px;
  color: #e8e8f0;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  width: 60px;
  text-align: center;
  outline: none;
  &:focus { border-color: #c8f542; }
  &:disabled { opacity: 0.4; }
  &::placeholder { color: #333342; }
`;

const RpeSelect = styled.select`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 5px;
  padding: 6px 4px;
  color: #888899;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  width: 58px;
  outline: none;
  cursor: pointer;
  &:disabled { opacity: 0.4; }
  option { background: #18181f; }
`;

const RmBadge = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #c8f542;
  background: rgba(200, 245, 66, 0.08);
  border: 1px solid rgba(200, 245, 66, 0.2);
  border-radius: 4px;
  padding: 2px 5px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const RmBadgePlaceholder = styled.div`
  width: 52px;
  flex-shrink: 0;
`;

const CheckBtn = styled.button<{ $done: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid ${({ $done }) => ($done ? '#c8f542' : '#2a2a35')};
  background: ${({ $done }) => ($done ? 'rgba(200,245,66,0.15)' : 'transparent')};
  color: ${({ $done }) => ($done ? '#c8f542' : '#444455')};
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { border-color: #c8f542; color: #c8f542; }
`;
