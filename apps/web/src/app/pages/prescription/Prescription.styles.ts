import styled, { keyframes } from 'styled-components';

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

export const PageWrapper = styled.div`
  padding: 40px 40px 80px;
  max-width: 900px;
`;

export const WizardHeader = styled.div`
  margin-bottom: 40px;
`;

export const WizardTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: #e8e8f0;
  letter-spacing: -0.5px;
`;

export const WizardSubtitle = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #444455;
  letter-spacing: 2px;
  margin-top: 6px;
`;

// ─── Step Progress Nav ────────────────────────────────────────────────────────

export const StepsNav = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 48px;
  gap: 0;
`;

export const StepItem = styled.div<{ $active?: boolean; $done?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  position: relative;

  /* connector line */
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 16px;
    left: calc(50% + 16px);
    width: calc(100% - 32px);
    height: 1px;
    background: ${({ $done }) => ($done ? 'rgba(200,245,66,0.4)' : '#2a2a35')};
    transition: background 0.4s;
  }
`;

export const StepCircle = styled.div<{ $active?: boolean; $done?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.3s;
  position: relative;
  z-index: 1;

  ${({ $active, $done }) =>
    $done
      ? `
    background: rgba(200,245,66,0.15);
    border: 1.5px solid rgba(200,245,66,0.5);
    color: #c8f542;
  `
      : $active
        ? `
    background: #c8f542;
    border: 1.5px solid #c8f542;
    color: #0a0a0f;
  `
        : `
    background: transparent;
    border: 1.5px solid #2a2a35;
    color: #444455;
  `}
`;

export const StepLabel = styled.div<{ $active?: boolean; $done?: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-align: center;
  transition: color 0.3s;
  color: ${({ $active, $done }) =>
    $active ? '#c8f542' : $done ? '#444455' : '#333342'};

  @media (max-width: 680px) { display: none; }
`;

// Kept for backward compat but unused
export const StepDot = styled.div<{ $active?: boolean; $done?: boolean }>`
  height: 3px;
  flex: 1;
  border-radius: 2px;
  background: ${({ $active, $done }) =>
    $active ? '#c8f542' : $done ? 'rgba(200,245,66,0.3)' : '#2a2a35'};
  transition: background 0.3s;
`;

// ─── Step body animation ──────────────────────────────────────────────────────

export const StepBody = styled.div`
  animation: ${fadeSlideIn} 0.25s ease;
`;

// ─── Section structure ────────────────────────────────────────────────────────

export const SectionTitle = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 6px;
  letter-spacing: -0.3px;
`;

export const SectionDescription = styled.p`
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #444455;
  margin-bottom: 32px;
  line-height: 1.5;
`;

export const CardSection = styled.div`
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
`;

export const CardSectionTitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 20px;
`;

// ─── Form elements ────────────────────────────────────────────────────────────

export const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

export const Grid3 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  @media (max-width: 700px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Label = styled.label`
  font-size: 11px;
  color: #555566;
  font-family: 'DM Mono', monospace;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

export const Input = styled.input`
  background: #0e0e15;
  border: 1px solid #222230;
  border-radius: 8px;
  padding: 13px 16px;
  color: #e8e8f0;
  font-size: 15px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  &:focus {
    border-color: #c8f542;
    box-shadow: 0 0 0 3px rgba(200,245,66,0.06);
  }
  &::placeholder { color: #333342; }
  &[readonly] { color: #c8f542; cursor: default; background: #0a0a0f; }
`;

export const Select = styled.select`
  background: #0e0e15;
  border: 1px solid #222230;
  border-radius: 8px;
  padding: 13px 16px;
  color: #e8e8f0;
  font-size: 15px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
  width: 100%;
  &:focus { border-color: #c8f542; }
  option { background: #0e0e15; }
`;

export const Divider = styled.div`
  height: 1px;
  background: #1a1a24;
  margin: 24px 0;
`;

export const SectionLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 14px;
`;

// ─── Option cards (gender, lifestyle, objectives) ─────────────────────────────

export const OptionGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols ?? 2}, 1fr);
  gap: 10px;
  margin-bottom: 8px;
  @media (max-width: 600px) { grid-template-columns: 1fr 1fr; }
`;

export const OptionCard = styled.button<{ $selected?: boolean; $warn?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 10px;
  border: 1.5px solid ${({ $selected, $warn }) =>
    $warn && $selected ? '#ff6b35' : $selected ? '#c8f542' : '#1e1e28'};
  background: ${({ $selected, $warn }) =>
    $warn && $selected
      ? 'rgba(255,107,53,0.06)'
      : $selected
        ? 'rgba(200,245,66,0.05)'
        : '#111118'};
  cursor: pointer;
  text-align: left;
  transition: all 0.18s;
  &:hover {
    border-color: ${({ $warn }) => ($warn ? '#ff6b35' : '#c8f542')};
    background: ${({ $warn }) =>
      $warn ? 'rgba(255,107,53,0.04)' : 'rgba(200,245,66,0.03)'};
  }
`;

export const OptionIcon = styled.div`
  font-size: 20px;
  line-height: 1;
`;

export const OptionLabel = styled.div<{ $selected?: boolean; $warn?: boolean }>`
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: ${({ $selected, $warn }) =>
    $warn && $selected ? '#ff8c5a' : $selected ? '#c8f542' : '#888899'};
  transition: color 0.18s;
`;

export const OptionSub = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #333342;
  letter-spacing: 0.5px;
`;

// ─── Toggle chips ─────────────────────────────────────────────────────────────

export const ChipGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

export const Chip = styled.button<{ $selected?: boolean; $warn?: boolean }>`
  padding: 9px 16px;
  border-radius: 8px;
  border: 1.5px solid ${({ $selected, $warn }) =>
    $warn && $selected ? '#ff6b35' : $selected ? '#c8f542' : '#1e1e28'};
  background: ${({ $selected, $warn }) =>
    $warn && $selected
      ? 'rgba(255,107,53,0.08)'
      : $selected
        ? 'rgba(200,245,66,0.07)'
        : '#111118'};
  color: ${({ $selected, $warn }) =>
    $warn && $selected ? '#ff8c5a' : $selected ? '#c8f542' : '#555566'};
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: ${({ $warn }) => ($warn ? '#ff6b35' : '#c8f542')};
    color: ${({ $warn }) => ($warn ? '#ff8c5a' : '#e8e8f0')};
  }
`;

// ─── Number stepper ───────────────────────────────────────────────────────────

export const StepperRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

export const StepperOption = styled.button<{ $selected?: boolean }>`
  width: 52px;
  height: 52px;
  border-radius: 10px;
  border: 1.5px solid ${({ $selected }) => ($selected ? '#c8f542' : '#1e1e28')};
  background: ${({ $selected }) => ($selected ? 'rgba(200,245,66,0.07)' : '#111118')};
  color: ${({ $selected }) => ($selected ? '#c8f542' : '#555566')};
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    border-color: #c8f542;
    color: #e8e8f0;
  }
`;

// ─── Flag box ─────────────────────────────────────────────────────────────────

export const FlagBox = styled.div`
  background: rgba(255,59,59,0.06);
  border: 1px solid rgba(255,59,59,0.25);
  border-radius: 10px;
  padding: 16px 20px;
  margin: 20px 0;
  display: flex;
  gap: 14px;
  align-items: flex-start;
`;

export const FlagTitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #ff3b3b;
  letter-spacing: 2px;
  margin-bottom: 4px;
`;

export const FlagText = styled.p`
  font-size: 13px;
  color: #ffaaaa;
  line-height: 1.5;
`;

// ─── Buttons ──────────────────────────────────────────────────────────────────

export const BtnRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 40px;
`;

export const BtnPrimary = styled.button`
  padding: 14px 32px;
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 8px;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: #d4ff55;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(200,245,66,0.2);
  }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

export const BtnSecondary = styled.button`
  padding: 14px 24px;
  background: transparent;
  border: 1.5px solid #1e1e28;
  color: #555566;
  border-radius: 8px;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #444455;
    color: #e8e8f0;
  }
`;

// ─── Score badges ─────────────────────────────────────────────────────────────

export const ScoreRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 28px;
`;

export const ScoreBadge = styled.div`
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 10px;
  padding: 14px 18px;
  flex: 1;
  min-width: 110px;
`;

export const ScoreBadgeLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  letter-spacing: 2px;
  margin-bottom: 6px;
`;

export const ScoreBadgeVal = styled.div<{ $color?: string }>`
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: ${({ $color }) => $color ?? '#e8e8f0'};
`;

export const NoteBox = styled.div`
  background: rgba(66,165,245,0.05);
  border: 1px solid rgba(66,165,245,0.15);
  border-radius: 10px;
  padding: 16px 18px;
  font-size: 13px;
  color: #7ab8e8;
  line-height: 1.6;
  margin: 16px 0;
  strong { color: #42a5f5; font-weight: 600; }
`;

export const ErrorMsg = styled.p`
  font-size: 13px;
  color: #ff6b6b;
  padding: 12px 16px;
  background: rgba(255,59,59,0.06);
  border: 1px solid rgba(255,59,59,0.18);
  border-radius: 8px;
  margin-top: 12px;
`;
