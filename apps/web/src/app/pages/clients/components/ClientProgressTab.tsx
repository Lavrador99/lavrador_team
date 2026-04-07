import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ClientStats, PersonalRecordDto, CreatePersonalRecordRequest, RECORD_TYPE_LABEL, RECORD_TYPE_UNIT, RecordType } from '@libs/types';
import styled from 'styled-components';
import { personalRecordsApi } from '../../../utils/api/personal-records.api';

interface Props {
  stats: ClientStats;
  clientId: string;
}

const LEVEL_ORDER = ['INICIANTE', 'INTERMEDIO', 'AVANCADO'];
const LEVEL_LABEL: Record<string, string> = {
  INICIANTE: 'Iniciante', INTERMEDIO: 'Intermédio', AVANCADO: 'Avançado',
};
const LEVEL_COLOR: Record<string, string> = {
  INICIANTE: '#ff8c5a', INTERMEDIO: '#42a5f5', AVANCADO: '#c8f542',
};

const RECORD_TYPES: RecordType[] = ['WEIGHT_KG', 'REPS_MAX', 'ISOMETRIC_S', 'DISTANCE_M', 'DURATION_S'];

const emptyForm = (): CreatePersonalRecordRequest => ({
  clientId: '',
  exerciseName: '',
  type: 'WEIGHT_KG',
  value: 0,
  notes: '',
});

export const ClientProgressTab: React.FC<Props> = ({ stats, clientId }) => {
  const [records, setRecords] = useState<PersonalRecordDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreatePersonalRecordRequest>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    personalRecordsApi.getBestByClient(clientId).then(setRecords).catch(() => {});
  }, [clientId]);

  const handleSave = async () => {
    if (!form.exerciseName.trim() || form.value <= 0) return;
    setSaving(true);
    try {
      await personalRecordsApi.create({ ...form, clientId });
      const updated = await personalRecordsApi.getBestByClient(clientId);
      setRecords(updated);
      setForm(emptyForm());
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await personalRecordsApi.delete(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };
  const levelData = stats.assessmentHistory.map((a, i) => ({
    date: new Date(a.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
    level: LEVEL_ORDER.indexOf(a.level),
    levelLabel: LEVEL_LABEL[a.level],
    color: LEVEL_COLOR[a.level],
    num: i + 1,
  }));

  return (
    <Wrap>
      {/* ── Sumário ── */}
      <StatRow>
        <StatCard>
          <StatVal $color="#c8f542">{stats.attendanceRate}%</StatVal>
          <StatLabel>Taxa de comparência</StatLabel>
        </StatCard>
        <StatCard>
          <StatVal $color="#42a5f5">{stats.completedSessions}</StatVal>
          <StatLabel>Sessões concluídas</StatLabel>
        </StatCard>
        <StatCard>
          <StatVal $color="#ff3b3b">{stats.noShowSessions + stats.cancelledSessions}</StatVal>
          <StatLabel>Canceladas / Falta</StatLabel>
        </StatCard>
        <StatCard>
          <StatVal $color={LEVEL_COLOR[stats.currentLevel]}>{LEVEL_LABEL[stats.currentLevel]}</StatVal>
          <StatLabel>Nível atual</StatLabel>
        </StatCard>
      </StatRow>

      {/* ── Sessões por semana ── */}
      <ChartWrap>
        <ChartTitle>Sessões por semana (últimas 12)</ChartTitle>
        {stats.sessionHistory.length === 0 ? (
          <Empty>Sem dados de sessões.</Empty>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.sessionHistory} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fill: '#666677', fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#444455', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#18181f', border: '1px solid #2a2a35', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: '#666677', fontFamily: 'DM Mono', fontSize: 10 }}
              />
              <Bar dataKey="completed" name="Concluídas" fill="#c8f542" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cancelled" name="Cancel./Falta" fill="#ff3b3b55" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartWrap>

      {/* ── Evolução de nível ── */}
      <ChartWrap>
        <ChartTitle>Evolução de nível</ChartTitle>
        {levelData.length === 0 ? (
          <Empty>Sem avaliações registadas.</Empty>
        ) : (
          <>
            <Timeline>
              {stats.assessmentHistory.map((a, i) => (
                <TimelineItem key={a.id}>
                  <TimelineDot $color={LEVEL_COLOR[a.level]} />
                  <TimelineContent>
                    <TimelineDate>{new Date(a.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</TimelineDate>
                    <TimelineLevel $color={LEVEL_COLOR[a.level]}>{LEVEL_LABEL[a.level]}</TimelineLevel>
                    {a.flags.length > 0 && (
                      <TimelineFlags>{a.flags.map(f => <FlagTag key={f}>⚠ {f}</FlagTag>)}</TimelineFlags>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </>
        )}
      </ChartWrap>

      {/* ── Plano ativo ── */}
      {stats.activeProgram && (
        <ChartWrap>
          <ChartTitle>Plano ativo</ChartTitle>
          <ProgramName>{stats.activeProgram}</ProgramName>
        </ChartWrap>
      )}

      {/* ── Records pessoais (RMs) ── */}
      <ChartWrap>
        <RmHeader>
          <ChartTitle style={{ marginBottom: 0 }}>Records pessoais</ChartTitle>
          <AddRmBtn onClick={() => setShowForm((v) => !v)}>
            {showForm ? '✕ Cancelar' : '+ Adicionar'}
          </AddRmBtn>
        </RmHeader>

        {showForm && (
          <RmForm>
            <RmFormRow>
              <RmInput
                placeholder="Exercício (ex: Agachamento)"
                value={form.exerciseName}
                onChange={(e) => setForm({ ...form, exerciseName: e.target.value })}
              />
              <RmSelect
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as RecordType })}
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>{RECORD_TYPE_LABEL[t]}</option>
                ))}
              </RmSelect>
              <RmNumberInput
                type="number"
                placeholder="Valor"
                min={0}
                step={0.5}
                value={form.value || ''}
                onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
              />
              <RmUnit>{RECORD_TYPE_UNIT[form.type as RecordType]}</RmUnit>
            </RmFormRow>
            <RmFormRow>
              <RmInput
                placeholder="Notas opcionais"
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={{ flex: 1 }}
              />
              <SaveRmBtn onClick={handleSave} disabled={saving}>
                {saving ? 'A guardar...' : 'Guardar'}
              </SaveRmBtn>
            </RmFormRow>
          </RmForm>
        )}

        {records.length === 0 ? (
          <Empty>Sem records registados. Adiciona o primeiro!</Empty>
        ) : (
          <RmTable>
            <RmTHead>
              <tr>
                <RmTh>Exercício</RmTh>
                <RmTh center>Tipo</RmTh>
                <RmTh center>Melhor</RmTh>
                <RmTh center>Data</RmTh>
                <RmTh center></RmTh>
              </tr>
            </RmTHead>
            <tbody>
              {records.map((r) => (
                <RmTr key={r.id}>
                  <RmTd><RmExName>{r.exerciseName}</RmExName></RmTd>
                  <RmTd center><RmTypeBadge>{RECORD_TYPE_LABEL[r.type]}</RmTypeBadge></RmTd>
                  <RmTd center><RmValue>{r.value} {RECORD_TYPE_UNIT[r.type]}</RmValue></RmTd>
                  <RmTd center><RmDate>{new Date(r.recordedAt).toLocaleDateString('pt-PT')}</RmDate></RmTd>
                  <RmTd center>
                    <RmDeleteBtn onClick={() => handleDelete(r.id)}>✕</RmDeleteBtn>
                  </RmTd>
                </RmTr>
              ))}
            </tbody>
          </RmTable>
        )}
      </ChartWrap>
    </Wrap>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrap = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const StatRow = styled.div`display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; @media(max-width:600px){ grid-template-columns: repeat(2,1fr); }`;
const StatCard = styled.div`background: #18181f; border: 1px solid #2a2a35; border-radius: 8px; padding: 14px;`;
const StatVal = styled.div<{ $color: string }>`font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: ${({ $color }) => $color};`;
const StatLabel = styled.div`font-family: 'DM Mono', monospace; font-size: 10px; color: #666677; margin-top: 3px; letter-spacing: 1px;`;

const ChartWrap = styled.div`background: #111118; border: 1px solid #2a2a35; border-radius: 10px; padding: 18px;`;
const ChartTitle = styled.div`font-family: 'DM Mono', monospace; font-size: 10px; color: #666677; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px;`;
const Empty = styled.div`font-family: 'DM Mono', monospace; font-size: 12px; color: #444455; padding: 20px 0;`;

const Timeline = styled.div`display: flex; flex-direction: column; gap: 0;`;
const TimelineItem = styled.div`display: flex; gap: 14px; padding-bottom: 16px; position: relative; &:not(:last-child)::before { content: ''; position: absolute; left: 5px; top: 14px; width: 2px; height: calc(100% - 14px); background: #2a2a35; }`;
const TimelineDot = styled.div<{ $color: string }>`width: 12px; height: 12px; border-radius: 50%; background: ${({ $color }) => $color}; flex-shrink: 0; margin-top: 2px; z-index: 1;`;
const TimelineContent = styled.div``;
const TimelineDate = styled.div`font-family: 'DM Mono', monospace; font-size: 11px; color: #666677;`;
const TimelineLevel = styled.div<{ $color: string }>`font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: ${({ $color }) => $color}; margin: 2px 0;`;
const TimelineFlags = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;`;
const FlagTag = styled.span`font-family: 'DM Mono', monospace; font-size: 10px; padding: 2px 7px; border-radius: 3px; background: rgba(255,107,53,0.08); border: 1px solid rgba(255,107,53,0.2); color: #ff8c5a;`;
const ProgramName = styled.div`font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #c8f542;`;

// ── Personal Records ──
const RmHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;`;
const AddRmBtn = styled.button`font-family: 'DM Mono', monospace; font-size: 11px; color: #c8f542; background: rgba(200,245,66,0.06); border: 1px solid rgba(200,245,66,0.2); border-radius: 4px; padding: 5px 12px; cursor: pointer; transition: background 0.15s; &:hover { background: rgba(200,245,66,0.12); }`;
const RmForm = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; padding: 14px; background: #0d0d13; border: 1px solid #2a2a35; border-radius: 8px;`;
const RmFormRow = styled.div`display: flex; gap: 8px; align-items: center; flex-wrap: wrap;`;
const RmInput = styled.input`background: #18181f; border: 1px solid #2a2a35; border-radius: 5px; padding: 8px 12px; color: #e8e8f0; font-size: 12px; font-family: 'DM Sans', sans-serif; outline: none; flex: 1; min-width: 160px; &:focus { border-color: #c8f542; } &::placeholder { color: #444455; }`;
const RmSelect = styled.select`background: #18181f; border: 1px solid #2a2a35; border-radius: 5px; padding: 8px 10px; color: #e8e8f0; font-size: 12px; font-family: 'DM Mono', monospace; outline: none; cursor: pointer; &:focus { border-color: #c8f542; } option { background: #18181f; }`;
const RmNumberInput = styled.input`background: #18181f; border: 1px solid #2a2a35; border-radius: 5px; padding: 8px 10px; color: #e8e8f0; font-size: 13px; font-family: 'DM Mono', monospace; outline: none; width: 80px; text-align: right; &:focus { border-color: #c8f542; }`;
const RmUnit = styled.span`font-family: 'DM Mono', monospace; font-size: 11px; color: #666677; min-width: 24px;`;
const SaveRmBtn = styled.button`background: #c8f542; color: #0a0a0f; border: none; border-radius: 5px; padding: 8px 18px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.15s; &:hover:not(:disabled) { background: #d4ff55; } &:disabled { opacity: 0.5; cursor: not-allowed; }`;

const RmTable = styled.table`width: 100%; border-collapse: collapse;`;
const RmTHead = styled.thead`border-bottom: 1px solid #1e1e28;`;
const RmTh = styled.th<{ center?: boolean }>`font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2px; color: #444455; text-transform: uppercase; padding: 6px 8px; text-align: ${({ center }) => (center ? 'center' : 'left')}; font-weight: 400;`;
const RmTr = styled.tr`border-bottom: 1px solid #1a1a22; &:last-child { border-bottom: none; }`;
const RmTd = styled.td<{ center?: boolean }>`padding: 10px 8px; text-align: ${({ center }) => (center ? 'center' : 'left')};`;
const RmExName = styled.div`font-family: 'DM Sans', sans-serif; font-size: 13px; color: #e8e8f0; font-weight: 500;`;
const RmTypeBadge = styled.span`font-family: 'DM Mono', monospace; font-size: 10px; color: #666677; background: #18181f; border: 1px solid #2a2a35; border-radius: 3px; padding: 2px 7px;`;
const RmValue = styled.span`font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 700; color: #c8f542;`;
const RmDate = styled.span`font-family: 'DM Mono', monospace; font-size: 11px; color: #444455;`;
const RmDeleteBtn = styled.button`background: none; border: none; color: #333344; font-size: 12px; cursor: pointer; padding: 2px 6px; border-radius: 3px; transition: color 0.15s; &:hover { color: #ff6b6b; }`;
