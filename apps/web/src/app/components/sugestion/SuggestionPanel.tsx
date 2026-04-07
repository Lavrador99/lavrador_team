import React, { useState } from 'react';
import { suggestionApi, SuggestionResult, ExerciseSuggestion } from '../../utils/api/suggestion.api';
import styled from 'styled-components';

const OBJECTIVES = [
  { value: 'HIPERTROFIA', label: '💪 Hipertrofia' },
  { value: 'FORCA',       label: '🏋️ Força' },
  { value: 'RESISTENCIA', label: '🏃 Resistência Muscular' },
  { value: 'POTENCIA',    label: '⚡ Potência' },
  { value: 'SAUDE_GERAL', label: '❤️ Saúde Geral' },
];

const PATTERNS = [
  { value: '',                   label: 'Todos os padrões' },
  { value: 'EMPURRAR_HORIZONTAL',label: '🧠 Peito / Empurrar H.' },
  { value: 'PUXAR_VERTICAL',     label: '🦾 Costas / Puxar V.' },
  { value: 'PUXAR_HORIZONTAL',   label: '🦾 Costas / Puxar H.' },
  { value: 'EMPURRAR_VERTICAL',  label: '💪 Ombros / Empurrar V.' },
  { value: 'DOMINANTE_JOELHO',   label: '🦵 Pernas / Dom. Joelho' },
  { value: 'DOMINANTE_ANCA',     label: '🦵 Pernas / Dom. Anca' },
  { value: 'CORE',               label: '🧱 Core' },
  { value: 'LOCOMOCAO',          label: '🧩 Full Body / Cardio' },
];

const ORIGIN_COLOR: Record<string, string> = {
  PT_PREFERENCE: '#c8f542',
  ACSM_DEFAULT:  '#42a5f5',
  CORRECTIVE:    '#ff8c5a',
};

const ORIGIN_LABEL: Record<string, string> = {
  PT_PREFERENCE: '★ Preferência do PT',
  ACSM_DEFAULT:  '◎ Guideline ACSM',
  CORRECTIVE:    '⚠ Corretivo',
};

interface Props {
  clientId:   string;
  level:      string;
  objective?: string;
  flags?:     string[];
  equipment?: string[];
  forceOpen?: boolean;
  onClose?:   () => void;
  onImport?:  (exercise: ExerciseSuggestion) => void;
}

export const SuggestionPanel: React.FC<Props> = ({
  clientId, level, objective: defaultObjective = 'HIPERTROFIA',
  flags = [], equipment = [], forceOpen, onClose, onImport,
}) => {
  const [openInternal, setOpenInternal] = useState(false);
  const isOpen = forceOpen ?? openInternal;

  const handleClose = () => {
    if (onClose) onClose();
    else setOpenInternal(false);
  };
  const [objective, setObjective] = useState(defaultObjective);
  const [pattern, setPattern] = useState('');
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const res = await suggestionApi.suggest({
        clientId, level, objective, flags, equipment,
        pattern: pattern || undefined,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (ex: ExerciseSuggestion, chosen: boolean) => {
    await suggestionApi.recordChoose({
      exerciseId: ex.exerciseId, level, pattern: ex.pattern,
      objective, chosen,
    });
    // Feedback visual rápido
    if (chosen && onImport) onImport(ex);
  };

  return (
    <Wrapper>
      {forceOpen === undefined && (
        <TriggerBtn onClick={() => setOpenInternal(!openInternal)} $active={openInternal}>
          🧠 Sugestão Lavrador-Brain
        </TriggerBtn>
      )}

      {isOpen && (
        <Panel $inline={forceOpen !== undefined}>
          <PanelHeader>
            <PanelTitle>🧠 Lavrador-Team Brain</PanelTitle>
            <CloseBtn onClick={handleClose}>✕</CloseBtn>
          </PanelHeader>

          {/* Controlos */}
          <Controls>
            <ControlField>
              <CtrlLabel>Objectivo</CtrlLabel>
              <SmSelect value={objective} onChange={(e) => setObjective(e.target.value)}>
                {OBJECTIVES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </SmSelect>
            </ControlField>
            <ControlField>
              <CtrlLabel>Padrão de movimento</CtrlLabel>
              <SmSelect value={pattern} onChange={(e) => setPattern(e.target.value)}>
                {PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </SmSelect>
            </ControlField>
          </Controls>

          <SuggestBtn onClick={handleSuggest} disabled={loading}>
            {loading ? 'A calcular...' : 'Calcular sugestões →'}
          </SuggestBtn>

          {result && (
            <ResultArea>

              {/* Estado do sistema */}
              <StatusBar $active={result.systemStatus.learningActive}>
                {result.systemStatus.learningActive
                  ? `★ Aprendizagem activa — ${result.systemStatus.currentWorkouts} treinos analisados`
                  : `◎ Modo ACSM — cria mais ${result.systemStatus.threshold - result.systemStatus.currentWorkouts} treinos para activar aprendizagem`}
              </StatusBar>

              {/* Prescrição ACSM */}
              <PrescriptionBox>
                <BoxTitle>Prescrição ACSM 2026 — {result.prescription.objective}</BoxTitle>
                <PrescGrid>
                  <PrescItem>
                    <PrescLabel>Séries</PrescLabel>
                    <PrescVal>{result.prescription.sets.min}–{result.prescription.sets.max}</PrescVal>
                  </PrescItem>
                  <PrescItem>
                    <PrescLabel>Reps</PrescLabel>
                    <PrescVal>
                      {typeof result.prescription.reps === 'string'
                        ? result.prescription.reps
                        : `${result.prescription.reps.min}–${result.prescription.reps.max}`}
                    </PrescVal>
                  </PrescItem>
                  <PrescItem>
                    <PrescLabel>% 1RM</PrescLabel>
                    <PrescVal>{result.prescription.percentRM.min}–{result.prescription.percentRM.max}%</PrescVal>
                  </PrescItem>
                  <PrescItem>
                    <PrescLabel>RIR alvo</PrescLabel>
                    <PrescVal>{result.prescription.rirTarget}</PrescVal>
                  </PrescItem>
                  <PrescItem>
                    <PrescLabel>Repouso</PrescLabel>
                    <PrescVal>
                      {Math.floor(result.prescription.restBetweenSetsSeconds.min / 60)}–
                      {Math.floor(result.prescription.restBetweenSetsSeconds.max / 60)} min
                    </PrescVal>
                  </PrescItem>
                  <PrescItem>
                    <PrescLabel>Tempo exec.</PrescLabel>
                    <PrescVal>{result.prescription.tempo}</PrescVal>
                  </PrescItem>
                </PrescGrid>
                <PrescNote>{result.prescription.notes}</PrescNote>
                <PrescFreq>📅 {result.frequencyRecommendation}</PrescFreq>
              </PrescriptionBox>

              {/* Avisos clínicos */}
              {result.warnings.length > 0 && (
                <WarningsBox>
                  {result.warnings.map((w, i) => <Warning key={i}>⚠ {w}</Warning>)}
                </WarningsBox>
              )}

              {/* Exercícios sugeridos */}
              {result.suggestions.length > 0 && (
                <ExSection>
                  <ExTitle>Exercícios sugeridos ({result.suggestions.length})</ExTitle>
                  {result.suggestions.map((ex) => (
                    <ExCard key={ex.exerciseId}>
                      <ExInfo>
                        <ExName>{ex.name}</ExName>
                        <ExMeta>
                          {ex.primaryMuscles.slice(0, 2).join(', ')}
                          <OriginTag $color={ORIGIN_COLOR[ex.origin]}>
                            {ORIGIN_LABEL[ex.origin]}
                          </OriginTag>
                          <ScoreBadge>{ex.score.toFixed(1)} pts</ScoreBadge>
                        </ExMeta>
                      </ExInfo>
                      <ExBtns>
                        {onImport && (
                          <ImportBtn onClick={() => handleFeedback(ex, true)}>
                            ⬇
                          </ImportBtn>
                        )}
                        <RejectBtn onClick={() => handleFeedback(ex, false)} title="Não gosto">
                          ✕
                        </RejectBtn>
                      </ExBtns>
                    </ExCard>
                  ))}
                </ExSection>
              )}

              {/* Corretivos */}
              {result.correctiveExercises.length > 0 && (
                <ExSection>
                  <ExTitle style={{ color: '#ff8c5a' }}>Exercícios corretivos (20%)</ExTitle>
                  {result.correctiveExercises.map((ex) => (
                    <ExCard key={ex.exerciseId} $corrective>
                      <ExInfo>
                        <ExName>{ex.name}</ExName>
                        {ex.notes && <ExNotes>{ex.notes}</ExNotes>}
                      </ExInfo>
                      {onImport && (
                        <ImportBtn onClick={() => { onImport(ex); }}>⬇</ImportBtn>
                      )}
                    </ExCard>
                  ))}
                </ExSection>
              )}

            </ResultArea>
          )}
        </Panel>
      )}
    </Wrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`position: relative;`;

const TriggerBtn = styled.button<{ $active?: boolean }>`
  padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;
  font-family: 'DM Mono', monospace; transition: all .15s;
  background: ${({ $active }) => $active ? 'rgba(200,245,66,0.15)' : 'rgba(200,245,66,0.08)'};
  border: 1px solid ${({ $active }) => $active ? '#c8f542' : 'rgba(200,245,66,0.25)'};
  color: #c8f542;
  &:hover { background: rgba(200,245,66,0.15); border-color: #c8f542; }
`;

const Panel = styled.div<{ $inline?: boolean }>`
  ${({ $inline }) => $inline
    ? 'position: static; width: 100%; max-height: none;'
    : 'position: absolute; top: calc(100% + 8px); right: 0; z-index: 50; width: 480px; max-width: 95vw; max-height: 80vh;'}
  overflow-y: auto;
  background: #111118; border: 1px solid #2a2a35; border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.7);
`;

const PanelHeader = styled.div`display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #1e1e28;position:sticky;top:0;background:#111118;z-index:1;`;
const PanelTitle = styled.div`font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#e8e8f0;`;
const CloseBtn = styled.button`background:none;border:none;color:#444455;cursor:pointer;&:hover{color:#e8e8f0;}`;

const Controls = styled.div`display:flex;gap:10px;padding:14px 18px 10px;flex-wrap:wrap;`;
const ControlField = styled.div`display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px;`;
const CtrlLabel = styled.div`font-family:'DM Mono',monospace;font-size:9px;color:#666677;letter-spacing:1px;text-transform:uppercase;`;
const SmSelect = styled.select`background:#18181f;border:1px solid #2a2a35;border-radius:4px;padding:7px 8px;color:#e8e8f0;font-size:12px;outline:none;width:100%;option{background:#18181f;}`;

const SuggestBtn = styled.button`width:calc(100% - 36px);margin:0 18px 14px;background:rgba(200,245,66,0.1);border:1px solid rgba(200,245,66,0.25);color:#c8f542;padding:10px;border-radius:6px;font-family:'DM Mono',monospace;font-size:12px;cursor:pointer;transition:all .15s;&:hover:not(:disabled){background:rgba(200,245,66,0.18);}&:disabled{opacity:.4;}`;

const ResultArea = styled.div`padding:0 18px 18px;`;

const StatusBar = styled.div<{ $active?: boolean }>`font-family:'DM Mono',monospace;font-size:10px;padding:8px 12px;border-radius:6px;margin-bottom:14px;background:${p=>p.$active?'rgba(200,245,66,0.06)':'rgba(66,165,245,0.06)'};color:${p=>p.$active?'#c8f542':'#42a5f5'};border:1px solid ${p=>p.$active?'rgba(200,245,66,0.2)':'rgba(66,165,245,0.2)'};`;

const PrescriptionBox = styled.div`background:#18181f;border:1px solid #2a2a35;border-radius:8px;padding:14px;margin-bottom:14px;`;
const BoxTitle = styled.div`font-family:'DM Mono',monospace;font-size:10px;color:#666677;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;`;
const PrescGrid = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px;`;
const PrescItem = styled.div``;
const PrescLabel = styled.div`font-family:'DM Mono',monospace;font-size:9px;color:#444455;letter-spacing:1px;margin-bottom:2px;`;
const PrescVal = styled.div`font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#e8e8f0;`;
const PrescNote = styled.div`font-size:11px;color:#666677;line-height:1.5;border-top:1px solid #2a2a35;padding-top:8px;margin-top:4px;`;
const PrescFreq = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#42a5f5;margin-top:6px;`;

const WarningsBox = styled.div`margin-bottom:14px;display:flex;flex-direction:column;gap:6px;`;
const Warning = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#ff8c5a;background:rgba(255,107,53,0.06);border:1px solid rgba(255,107,53,0.15);border-radius:4px;padding:8px 10px;`;

const ExSection = styled.div`margin-bottom:14px;`;
const ExTitle = styled.div`font-family:'DM Mono',monospace;font-size:10px;color:#666677;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;`;
const ExCard = styled.div<{ $corrective?: boolean }>`display:flex;align-items:center;gap:10px;background:${p=>p.$corrective?'rgba(255,107,53,0.04)':'#18181f'};border:1px solid ${p=>p.$corrective?'rgba(255,107,53,0.15)':'#2a2a35'};border-radius:6px;padding:10px 12px;margin-bottom:6px;`;
const ExInfo = styled.div`flex:1;overflow:hidden;`;
const ExName = styled.div`font-size:13px;color:#e8e8f0;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const ExMeta = styled.div`display:flex;align-items:center;gap:6px;margin-top:3px;font-family:'DM Mono',monospace;font-size:10px;color:#666677;flex-wrap:wrap;`;
const ExNotes = styled.div`font-family:'DM Mono',monospace;font-size:10px;color:#ff8c5a;margin-top:3px;`;
const OriginTag = styled.span<{ $color: string }>`font-size:9px;padding:1px 6px;border-radius:3px;background:${p=>p.$color}18;color:${p=>p.$color};border:1px solid ${p=>p.$color}30;white-space:nowrap;`;
const ScoreBadge = styled.span`font-size:9px;color:#444455;`;
const ExBtns = styled.div`display:flex;gap:4px;flex-shrink:0;`;
const ImportBtn = styled.button`background:rgba(200,245,66,0.08);border:1px solid rgba(200,245,66,0.2);color:#c8f542;width:28px;height:28px;border-radius:4px;cursor:pointer;font-size:13px;&:hover{background:rgba(200,245,66,0.18);}`;
const RejectBtn = styled.button`background:transparent;border:1px solid #2a2a35;color:#444455;width:28px;height:28px;border-radius:4px;cursor:pointer;font-size:11px;&:hover{border-color:#ff3b3b;color:#ff6b6b;}`;
