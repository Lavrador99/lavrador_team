import React from 'react';
import styled from 'styled-components';

export interface SetState {
  completed: boolean;
  actualLoad: string;
  actualReps: string;
  rpe: number | null;
}

interface Props {
  setNumber: number;
  targetReps: string;
  targetLoad?: number;
  state: SetState;
  onChange: (s: SetState) => void;
  onComplete: () => void; // called when user checks the set
}

const RPE_OPTIONS = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];

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

  return (
    <Row $done={state.completed}>
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

      <CheckBtn $done={state.completed} onClick={handleCheck}>
        {state.completed ? '✓' : '○'}
      </CheckBtn>
    </Row>
  );
};

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
