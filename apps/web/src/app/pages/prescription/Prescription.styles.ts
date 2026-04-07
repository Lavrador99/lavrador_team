import styled from 'styled-components';

// ─── Layout ───────────────────────────────────────────────────────────────────

export const PageWrapper = styled.div`
  padding: 40px 32px;
  max-width: 860px;
`;

export const WizardHeader = styled.div`
  margin-bottom: 40px;
`;

export const WizardTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #e8e8f0;
`;

export const WizardSubtitle = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  letter-spacing: 2px;
  margin-top: 6px;
`;

// ─── Step nav ─────────────────────────────────────────────────────────────────

export const StepsNav = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 36px;
`;

export const StepDot = styled.div<{ $active?: boolean; $done?: boolean }>`
  height: 3px;
  flex: 1;
  border-radius: 2px;
  background: ${({ $active, $done }) =>
    $active ? '#c8f542' : $done ? 'rgba(200,245,66,0.3)' : '#2a2a35'};
  transition: background 0.3s;
`;

export const StepLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #c8f542;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 6px;
`;

export const SectionTitle = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 24px;
`;

// ─── Form elements ────────────────────────────────────────────────────────────

export const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

export const Grid3 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 11px;
  color: #666677;
  font-family: 'DM Mono', monospace;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

export const Input = styled.input`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 11px 14px;
  color: #e8e8f0;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  &:focus { border-color: #c8f542; }
  &::placeholder { color: #444455; }
  &[readonly] { color: #c8f542; cursor: default; }
`;

export const Select = styled.select`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 11px 14px;
  color: #e8e8f0;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
  width: 100%;
  &:focus { border-color: #c8f542; }
  option { background: #18181f; }
`;

export const Divider = styled.div`
  height: 1px;
  background: #2a2a35;
  margin: 24px 0;
`;

export const SectionLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #666677;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 12px;
`;

// ─── Toggle chips ─────────────────────────────────────────────────────────────

export const ChipGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

export const Chip = styled.button<{ $selected?: boolean; $warn?: boolean }>`
  padding: 8px 14px;
  border-radius: 4px;
  border: 1px solid ${({ $selected, $warn }) =>
    $warn && $selected ? '#ff6b35' : $selected ? '#c8f542' : '#2a2a35'};
  background: ${({ $selected, $warn }) =>
    $warn && $selected ? 'rgba(255,107,53,0.08)' : $selected ? 'rgba(200,245,66,0.06)' : '#18181f'};
  color: ${({ $selected, $warn }) =>
    $warn && $selected ? '#ff6b35' : $selected ? '#c8f542' : '#666677'};
  font-size: 12px;
  font-family: 'DM Mono', monospace;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${({ $warn }) => $warn ? '#ff6b35' : '#c8f542'}; color: #e8e8f0; }
`;

// ─── Flag box ─────────────────────────────────────────────────────────────────

export const FlagBox = styled.div`
  background: rgba(255,59,59,0.08);
  border: 1px solid #ff3b3b;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 20px 0;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

export const FlagTitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
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
  margin-top: 32px;
`;

export const BtnPrimary = styled.button`
  padding: 13px 28px;
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 6px;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.2s;
  &:hover:not(:disabled) { background: #d4ff55; transform: translateY(-1px); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

export const BtnSecondary = styled.button`
  padding: 13px 24px;
  background: transparent;
  border: 1px solid #2a2a35;
  color: #666677;
  border-radius: 6px;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #666677; color: #e8e8f0; }
`;

// ─── Score badges ─────────────────────────────────────────────────────────────

export const ScoreRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

export const ScoreBadge = styled.div`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 8px;
  padding: 12px 16px;
  flex: 1;
  min-width: 120px;
`;

export const ScoreBadgeLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #666677;
  letter-spacing: 2px;
  margin-bottom: 4px;
`;

export const ScoreBadgeVal = styled.div<{ $color?: string }>`
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: ${({ $color }) => $color ?? '#e8e8f0'};
`;

export const NoteBox = styled.div`
  background: rgba(66,165,245,0.06);
  border: 1px solid rgba(66,165,245,0.2);
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 13px;
  color: #aad4ff;
  line-height: 1.6;
  margin: 16px 0;
  strong { color: #42a5f5; font-weight: 500; }
`;

export const ErrorMsg = styled.p`
  font-size: 13px;
  color: #ff6b6b;
  padding: 10px 14px;
  background: rgba(255,59,59,0.08);
  border: 1px solid rgba(255,59,59,0.2);
  border-radius: 6px;
  margin-top: 8px;
`;
