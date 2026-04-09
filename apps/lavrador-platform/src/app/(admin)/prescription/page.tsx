'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { ExerciseDto, MovementPattern, ProgramPhase } from '@libs/types';
import { usePrescriptionStore, ExerciseSelection } from '../../../lib/stores/prescriptionStore';
import { clientsApi } from '../../../lib/api/clients.api';
import { exercisesApi } from '../../../lib/api/exercises.api';
import { assessmentsApi, programsApi } from '../../../lib/api/prescription.api';

// ─── Shared input classes ───────────────────────────────────────────────────
const inp = 'w-full bg-[#0d0d13] border border-border rounded-lg px-3 py-2 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent';
const card = 'bg-panel border border-border rounded-xl p-5 mb-4';
const chip = (on: boolean, warn?: boolean) =>
  `cursor-pointer px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors ${
    on
      ? warn
        ? 'border-orange-400/60 bg-orange-400/10 text-orange-300'
        : 'border-accent bg-accent/10 text-accent'
      : 'border-border text-muted hover:text-white'
  }`;
const optCard = (on: boolean) =>
  `flex flex-col items-center gap-1 p-3 rounded-xl border cursor-pointer transition-colors ${
    on ? 'border-accent bg-accent/7 text-accent' : 'border-border text-muted hover:border-accent/40'
  }`;
const btnPrimary = 'bg-accent text-dark font-syne font-black text-sm px-5 py-2.5 rounded-lg hover:bg-accent/90 disabled:opacity-50';
const btnSecondary = 'border border-border text-muted font-mono text-xs px-4 py-2.5 rounded-lg hover:text-white hover:border-muted';

// ─── Step labels ────────────────────────────────────────────────────────────
const STEPS = ['Pessoal', 'Anamnese', 'Físico', 'Exercícios', 'Revisão', 'Plano'];

// ─── Step 1 ─────────────────────────────────────────────────────────────────
const SINTOMAS = ['palpitacoes', 'dor_peito', 'dispneia', 'diabetes', 'drc', 'hist_familiar'];
const SINTOMA_LABELS: Record<string, string> = {
  palpitacoes: 'Palpitações', dor_peito: 'Dor no peito', dispneia: 'Dispneia',
  diabetes: 'Diabetes', drc: 'Doença Renal', hist_familiar: 'Hist. familiar DCV',
};
const RISCOS = ['fumador', 'colesterol_alto', 'stress_alto'];
const RISCO_LABELS: Record<string, string> = {
  fumador: 'Fumador', colesterol_alto: 'Colesterol alto', stress_alto: 'Stress elevado',
};
const LIFESTYLE = [
  { value: 'sedentario', icon: '💻', label: 'Sedentário', sub: 'Escritório' },
  { value: 'ativo', icon: '🚶', label: 'Ativo', sub: 'Moderado' },
  { value: 'muito_ativo', icon: '🏃', label: 'Muito ativo', sub: 'Trabalho físico' },
];

function buildFlags(pas: number, pad: number, sintomas: string[], riscos: string[]): string[] {
  const flags: string[] = [];
  if (sintomas.some((s) => ['palpitacoes', 'dor_peito', 'dispneia', 'diabetes', 'drc'].includes(s)))
    flags.push('sintomas clínicos');
  if (pas >= 140 || pad >= 90) flags.push(`hipertensão (${pas}/${pad} mmHg)`);
  if (riscos.includes('fumador')) flags.push('tabagismo');
  if (sintomas.includes('hist_familiar')) flags.push('história familiar DCV');
  return flags;
}

function Step1() {
  const { formData, updateFormData, nextStep } = usePrescriptionStore();
  const [nome, setNome] = useState(formData.nome ?? '');
  const [idade, setIdade] = useState(formData.idade?.toString() ?? '');
  const [sexo, setSexo] = useState(formData.sexo ?? 'M');
  const [profissao, setProfissao] = useState(formData.profissao ?? 'sedentario');
  const [pas, setPas] = useState(formData.pas?.toString() ?? '');
  const [pad, setPad] = useState(formData.pad?.toString() ?? '');
  const [sintomas, setSintomas] = useState<string[]>(formData.sintomas ?? []);
  const [riscos, setRiscos] = useState<string[]>(formData.riscos ?? []);
  const [error, setError] = useState('');

  const toggle = (val: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const flags = buildFlags(parseFloat(pas) || 0, parseFloat(pad) || 0, sintomas, riscos);

  const handleNext = () => {
    if (!nome.trim() || !idade) { setError('Nome e idade são obrigatórios.'); return; }
    updateFormData({
      nome, idade: parseFloat(idade), sexo: sexo as 'M' | 'F', profissao,
      pas: pas ? parseFloat(pas) : undefined, pad: pad ? parseFloat(pad) : undefined,
      sintomas, riscos,
    });
    nextStep();
  };

  return (
    <div>
      <h2 className="font-syne font-black text-xl text-white mb-1">Dados Pessoais</h2>
      <p className="font-mono text-xs text-muted mb-5">Informação básica para contextualizar a prescrição.</p>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Identificação</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-1">Nome completo</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={inp} placeholder="Sara Costa" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-1">Idade</label>
            <input type="number" value={idade} onChange={(e) => setIdade(e.target.value)} className={inp} placeholder="29" min="14" max="90" />
          </div>
        </div>
        <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-2">Género</label>
        <div className="grid grid-cols-2 gap-2">
          {(['M', 'F'] as const).map((g) => (
            <button key={g} onClick={() => setSexo(g)} className={optCard(sexo === g)}>
              <span className="text-lg">{g === 'M' ? '♂' : '♀'}</span>
              <span className="font-mono text-xs">{g === 'M' ? 'Masculino' : 'Feminino'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Estilo de vida</p>
        <div className="grid grid-cols-3 gap-2">
          {LIFESTYLE.map((o) => (
            <button key={o.value} onClick={() => setProfissao(o.value)} className={optCard(profissao === o.value)}>
              <span className="text-xl">{o.icon}</span>
              <span className="font-sans text-sm font-medium">{o.label}</span>
              <span className="font-mono text-[10px] text-faint">{o.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Pressão arterial (opcional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-[10px] text-muted block mb-1">PAS (mmHg)</label>
            <input type="number" value={pas} onChange={(e) => setPas(e.target.value)} className={inp} placeholder="120" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted block mb-1">PAD (mmHg)</label>
            <input type="number" value={pad} onChange={(e) => setPad(e.target.value)} className={inp} placeholder="78" />
          </div>
        </div>
      </div>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Sintomas / Patologias</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {SINTOMAS.map((s) => (
            <button key={s} onClick={() => toggle(s, sintomas, setSintomas)} className={chip(sintomas.includes(s), true)}>
              {SINTOMA_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-2">Fatores de risco</p>
        <div className="flex flex-wrap gap-2">
          {RISCOS.map((r) => (
            <button key={r} onClick={() => toggle(r, riscos, setRiscos)} className={chip(riscos.includes(r), true)}>
              {RISCO_LABELS[r]}
            </button>
          ))}
        </div>
        {flags.length > 0 && (
          <div className="mt-4 bg-orange-400/5 border border-orange-400/25 rounded-xl p-4 flex gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-mono text-xs text-orange-300 font-bold mb-1">AUTORIZAÇÃO MÉDICA RECOMENDADA</p>
              <p className="font-sans text-xs text-muted">Fatores: <strong className="text-white">{flags.join(', ')}</strong></p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="font-mono text-xs text-red-400 mb-3">{error}</p>}
      <div className="flex justify-end">
        <button onClick={handleNext} className={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
}

// ─── Step 2 ─────────────────────────────────────────────────────────────────
const OBJETIVOS = [
  { value: 'Emagrecimento', icon: '🔥', label: 'Emagrecimento', sub: 'Perda de massa gorda' },
  { value: 'Hipertrofia', icon: '💪', label: 'Hipertrofia', sub: 'Ganho muscular' },
  { value: 'Força Máxima', icon: '🏋️', label: 'Força Máxima', sub: 'Performance de força' },
  { value: 'Resistência Cardiovascular', icon: '❤️', label: 'Resistência Cardio', sub: 'Capacidade aeróbica' },
  { value: 'Saúde Geral', icon: '🌿', label: 'Saúde Geral', sub: 'Bem-estar e qualidade' },
  { value: 'Performance Atlética', icon: '⚡', label: 'Performance', sub: 'Rendimento desportivo' },
];
const PRATICA = [
  { value: 'nao', icon: '🛋️', label: 'Não', sub: 'Nunca / recomeçou' },
  { value: 'sim_pouco', icon: '🚶', label: 'Irregular', sub: 'Menos de 2x/sem' },
  { value: 'sim', icon: '🏃', label: 'Regular', sub: '2–3x por semana' },
  { value: 'sim_muito', icon: '⚡', label: 'Intenso', sub: '4+ vezes/sem' },
];
const LESOES_OPT = ['joelho', 'ombro', 'lombar', 'tornozelo', 'cervical'];
const LESAO_LABELS: Record<string, string> = {
  joelho: 'Joelho', ombro: 'Ombro', lombar: 'Lombar', tornozelo: 'Tornozelo', cervical: 'Cervical',
};
const EQUIPAMENTOS = [
  'ginasio_completo', 'barra', 'halteres', 'rack', 'maquinas', 'cabo',
  'kettlebell', 'banco', 'cardio_eq', 'peso_corporal', 'barra_fixa', 'paralelas', 'resistance_band',
];
const EQUIP_LABELS: Record<string, string> = {
  ginasio_completo: 'Ginásio completo', barra: 'Barra', halteres: 'Halteres', rack: 'Rack',
  maquinas: 'Máquinas', cabo: 'Cabo', kettlebell: 'Kettlebell', banco: 'Banco',
  cardio_eq: 'Cardio', peso_corporal: 'Peso corporal', barra_fixa: 'Barra fixa',
  paralelas: 'Paralelas', resistance_band: 'Elásticos',
};
const DIAS = [2, 3, 4, 5, 6];
const DURACAO = [30, 45, 60, 75, 90];
const TEMPO_TREINO = [
  { value: '0', label: '< 1 mês' }, { value: '1', label: '1 mês' },
  { value: '3', label: '3 meses' }, { value: '6', label: '6 meses' },
  { value: '12', label: '1 ano' }, { value: '24', label: '2 anos' },
  { value: '36', label: '3 anos' }, { value: '60', label: '5+ anos' },
];

function Step2() {
  const { formData, updateFormData, nextStep, prevStep } = usePrescriptionStore();
  const [pratica, setPratica] = useState(formData.pratica ?? 'nao');
  const [tempoTreino, setTempoTreino] = useState(formData.tempoTreino?.toString() ?? '0');
  const [diasSemana, setDiasSemana] = useState(formData.diasSemana ?? 3);
  const [duracaoSessao, setDuracaoSessao] = useState(formData.duracaoSessao ?? 60);
  const [objetivo, setObjetivo] = useState(formData.objetivo ?? '');
  const [lesoes, setLesoes] = useState<string[]>(formData.lesoes ?? []);
  const [equipamento, setEquipamento] = useState<string[]>(formData.equipamento ?? []);
  const [error, setError] = useState('');

  const toggle = (val: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const handleNext = () => {
    if (!objetivo) { setError('Seleciona um objetivo principal.'); return; }
    if (equipamento.length === 0) { setError('Seleciona pelo menos um equipamento.'); return; }
    updateFormData({ pratica, tempoTreino: parseFloat(tempoTreino), diasSemana, duracaoSessao, objetivo, lesoes, equipamento });
    nextStep();
  };

  return (
    <div>
      <h2 className="font-syne font-black text-xl text-white mb-1">Anamnese Desportiva</h2>
      <p className="font-mono text-xs text-muted mb-5">Historial de treino, objetivos e equipamento disponível.</p>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Objetivo principal</p>
        <div className="grid grid-cols-3 gap-2">
          {OBJETIVOS.map((o) => (
            <button key={o.value} onClick={() => setObjetivo(o.value)} className={optCard(objetivo === o.value)}>
              <span className="text-xl">{o.icon}</span>
              <span className="font-sans text-xs font-medium text-center">{o.label}</span>
              <span className="font-mono text-[9px] text-faint text-center">{o.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Nível de atividade atual</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {PRATICA.map((o) => (
            <button key={o.value} onClick={() => setPratica(o.value)} className={optCard(pratica === o.value)}>
              <span className="text-lg">{o.icon}</span>
              <span className="font-sans text-xs font-medium">{o.label}</span>
              <span className="font-mono text-[9px] text-faint text-center">{o.sub}</span>
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-2">Há quanto tempo treina?</p>
        <div className="flex flex-wrap gap-2">
          {TEMPO_TREINO.map((t) => (
            <button key={t.value} onClick={() => setTempoTreino(t.value)}
              className={`px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors ${
                tempoTreino === t.value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Disponibilidade semanal</p>
        <div className="mb-4">
          <p className="font-mono text-[10px] text-muted mb-2">Dias por semana</p>
          <div className="flex gap-2">
            {DIAS.map((d) => (
              <button key={d} onClick={() => setDiasSemana(d)}
                className={`w-12 h-12 rounded-xl border font-syne font-bold text-sm transition-colors ${
                  diasSemana === d ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-white'
                }`}>{d}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] text-muted mb-2">Duração por sessão</p>
          <div className="flex gap-2">
            {DURACAO.map((d) => (
              <button key={d} onClick={() => setDuracaoSessao(d)}
                className={`w-14 h-12 rounded-xl border font-syne font-bold text-sm transition-colors ${
                  duracaoSessao === d ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-white'
                }`}>{d}'</button>
            ))}
          </div>
        </div>
      </div>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Problemas ortopédicos / lesões</p>
        <div className="flex flex-wrap gap-2">
          {LESOES_OPT.map((l) => (
            <button key={l} onClick={() => toggle(l, lesoes, setLesoes)} className={chip(lesoes.includes(l), true)}>
              {LESAO_LABELS[l]}
            </button>
          ))}
          <button onClick={() => setLesoes([])} className={chip(lesoes.length === 0)}>Sem lesões</button>
        </div>
      </div>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Equipamento disponível</p>
        <div className="flex flex-wrap gap-2">
          {EQUIPAMENTOS.map((e) => (
            <button key={e} onClick={() => toggle(e, equipamento, setEquipamento)} className={chip(equipamento.includes(e))}>
              {EQUIP_LABELS[e]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-mono text-xs text-red-400 mb-3">{error}</p>}
      <div className="flex justify-between">
        <button onClick={prevStep} className={btnSecondary}>← Voltar</button>
        <button onClick={handleNext} className={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
}

// ─── Step 3 ─────────────────────────────────────────────────────────────────
const MOB_OPTIONS = [{ value: '1', label: 'Limitada' }, { value: '2', label: 'Moderada' }, { value: '3', label: 'Boa' }];

function Step3() {
  const { formData, updateFormData, nextStep, prevStep } = usePrescriptionStore();
  const [altura, setAltura] = useState(formData.altura?.toString() ?? '');
  const [peso, setPeso] = useState(formData.peso?.toString() ?? '');
  const [pctGordura, setPctGordura] = useState(formData.pctGordura?.toString() ?? '');
  const [cc, setCc] = useState(formData.cc?.toString() ?? '');
  const [fcRep, setFcRep] = useState(formData.fcRep?.toString() ?? '70');
  const [vo2max, setVo2max] = useState(formData.vo2max?.toString() ?? '');
  const [pushup, setPushup] = useState(formData.pushup?.toString() ?? '');
  const [rm1Squat, setRm1Squat] = useState(formData.rm1Squat?.toString() ?? '');
  const [rm1Bench, setRm1Bench] = useState(formData.rm1Bench?.toString() ?? '');
  const [mobOmbro, setMobOmbro] = useState(formData.mobOmbro?.toString() ?? '3');
  const [mobCF, setMobCF] = useState(formData.mobCF?.toString() ?? '3');
  const [sarVal, setSarVal] = useState(formData.sarVal?.toString() ?? '');

  const imc = altura && peso ? (parseFloat(peso) / Math.pow(parseFloat(altura) / 100, 2)).toFixed(1) : '';
  const fcmax = formData.idade ? Math.round(207 - 0.7 * formData.idade) : null;
  const fcrep = parseFloat(fcRep) || 70;

  const handleNext = () => {
    updateFormData({
      altura: altura ? parseFloat(altura) : undefined,
      peso: peso ? parseFloat(peso) : undefined,
      pctGordura: pctGordura ? parseFloat(pctGordura) : undefined,
      cc: cc ? parseFloat(cc) : undefined,
      fcRep: parseFloat(fcRep),
      vo2max: vo2max ? parseFloat(vo2max) : undefined,
      pushup: pushup ? parseInt(pushup) : undefined,
      rm1Squat: rm1Squat ? parseFloat(rm1Squat) : undefined,
      rm1Bench: rm1Bench ? parseFloat(rm1Bench) : undefined,
      mobOmbro: parseInt(mobOmbro),
      mobCF: parseInt(mobCF),
      sarVal: sarVal ? parseFloat(sarVal) : undefined,
    });
    nextStep();
  };

  return (
    <div>
      <h2 className="font-syne font-black text-xl text-white mb-1">Avaliação Física</h2>
      <p className="font-mono text-xs text-muted mb-5">Todos os campos são opcionais — preenche o que tiveres disponível.</p>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Antropometria</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'Altura (cm)', val: altura, set: setAltura, placeholder: '170' },
            { label: 'Peso (kg)', val: peso, set: setPeso, placeholder: '75' },
            { label: 'IMC calculado', val: imc ? `${imc} kg/m²` : '—', set: () => {}, placeholder: '', readOnly: true },
            { label: '% Gordura', val: pctGordura, set: setPctGordura, placeholder: '25' },
            { label: 'Circ. Cintura (cm)', val: cc, set: setCc, placeholder: '85' },
            { label: 'FC Repouso (bpm)', val: fcRep, set: setFcRep, placeholder: '70' },
          ].map(({ label, val, set, placeholder, readOnly }) => (
            <div key={label}>
              <label className="font-mono text-[10px] text-muted block mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(e.target.value)}
                className={inp + (readOnly ? ' opacity-60' : '')} placeholder={placeholder} readOnly={readOnly} />
            </div>
          ))}
        </div>
        {fcmax && (
          <div className="bg-[#0d0d13] border border-border rounded-lg p-3 font-mono text-xs text-muted">
            <strong className="text-white">Karvonen · FCmáx = {fcmax} bpm</strong><br />
            Z1 (50–60%): {Math.round((fcmax - fcrep) * 0.5 + fcrep)}–{Math.round((fcmax - fcrep) * 0.6 + fcrep)} bpm
            &nbsp;·&nbsp;Z2 (60–75%): {Math.round((fcmax - fcrep) * 0.6 + fcrep)}–{Math.round((fcmax - fcrep) * 0.75 + fcrep)} bpm
            &nbsp;·&nbsp;Z3 (75–90%): {Math.round((fcmax - fcrep) * 0.75 + fcrep)}–{Math.round((fcmax - fcrep) * 0.9 + fcrep)} bpm
          </div>
        )}
      </div>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Aptidão cardiovascular & Força</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'VO₂máx (ml/kg/min)', val: vo2max, set: setVo2max, placeholder: '35' },
            { label: 'Push-up (reps máx.)', val: pushup, set: setPushup, placeholder: '15' },
            { label: '1RM Squat est. (kg)', val: rm1Squat, set: setRm1Squat, placeholder: '60' },
            { label: '1RM Bench est. (kg)', val: rm1Bench, set: setRm1Bench, placeholder: '50' },
            { label: 'Sit-and-reach (cm)', val: sarVal, set: setSarVal, placeholder: '25' },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label}>
              <label className="font-mono text-[10px] text-muted block mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(e.target.value)} className={inp} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">Mobilidade articular</p>
        <div className="grid grid-cols-2 gap-4">
          {[{ label: 'Ombro', val: mobOmbro, set: setMobOmbro }, { label: 'Coxo-femoral', val: mobCF, set: setMobCF }].map(({ label, val, set }) => (
            <div key={label}>
              <label className="font-mono text-[10px] text-muted block mb-2">{label}</label>
              <div className="grid grid-cols-3 gap-2">
                {MOB_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => set(o.value)} className={optCard(val === o.value)}>
                    <span className="font-sans text-xs font-medium">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={prevStep} className={btnSecondary}>← Voltar</button>
        <button onClick={handleNext} className={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
}

// ─── Step 4 ─────────────────────────────────────────────────────────────────
const PATTERNS: { key: MovementPattern; label: string }[] = [
  { key: 'empurrar_horizontal', label: 'Peito' },
  { key: 'puxar_vertical', label: 'Costas V.' },
  { key: 'puxar_horizontal', label: 'Costas H.' },
  { key: 'empurrar_vertical', label: 'Ombros' },
  { key: 'dominante_joelho', label: 'Pernas Q.' },
  { key: 'dominante_anca', label: 'Pernas G.' },
  { key: 'core', label: 'Core' },
  { key: 'locomocao', label: 'Full Body' },
];
const EQUIP_MAP: Record<string, string> = {
  ginasio_completo: 'BARRA,HALTERES,RACK,MAQUINAS,CABO,KETTLEBELL,BANCO,CARDIO_EQ,BARRA_FIXA,PARALELAS,RESISTANCE_BAND,PESO_CORPORAL',
  barra: 'BARRA', halteres: 'HALTERES', rack: 'RACK', maquinas: 'MAQUINAS',
  cabo: 'CABO', kettlebell: 'KETTLEBELL', banco: 'BANCO', cardio_eq: 'CARDIO_EQ',
  peso_corporal: 'PESO_CORPORAL', barra_fixa: 'BARRA_FIXA', paralelas: 'PARALELAS',
  resistance_band: 'RESISTANCE_BAND',
};
const LEVEL_COLOR: Record<string, string> = { INICIANTE: '#42a5f5', INTERMEDIO: '#c8f542', AVANCADO: '#ff8c5a' };
const LEVEL_LABEL: Record<string, string> = { INICIANTE: 'Iniciante', INTERMEDIO: 'Intermédio', AVANCADO: 'Avançado' };

function Step4() {
  const { formData, selections, addSelection, replaceSelection, nextStep, prevStep } = usePrescriptionStore();
  const [activePattern, setActivePattern] = useState<MovementPattern>('empurrar_horizontal');
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const equipmentFilter = (formData.equipamento ?? [])
    .flatMap((e) => EQUIP_MAP[e]?.split(',') ?? [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(',');

  const swrKey = `exercises-${activePattern}-${equipmentFilter}`;
  const { data: exercises = [], isLoading } = useSWR<ExerciseDto[]>(
    swrKey,
    () => exercisesApi.getAll({ pattern: activePattern, equipment: equipmentFilter || undefined }),
  );

  const visible = showAll ? exercises : exercises.slice(0, 4);
  const preferredForPattern = selections.filter((s) => s.pattern === activePattern && s.type === 'PREFERRED');
  const isSelected = (id: string) => selections.some((s) => s.exerciseId === id);
  const isDone = (key: MovementPattern) => selections.some((s) => s.pattern === key);

  const handleSelect = (ex: ExerciseDto) => {
    if (isSelected(ex.id)) return;
    const sel: ExerciseSelection = { exerciseId: ex.id, pattern: activePattern, type: 'PREFERRED', name: ex.name };
    if (swapTarget && swapTarget !== '_browse') {
      replaceSelection(swapTarget, sel);
      setSwapTarget(null);
    } else {
      addSelection(sel);
      setSwapTarget(null);
    }
    setShowAll(false);
    setDetailId(null);
  };

  return (
    <div>
      <h2 className="font-syne font-black text-xl text-white mb-1">Seleção de Exercícios</h2>
      <p className="font-mono text-xs text-muted mb-5">O motor injetará automaticamente 20% de exercícios corretivos.</p>

      {/* Pattern tabs */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PATTERNS.map((p) => (
          <button key={p.key} onClick={() => { setActivePattern(p.key); setSwapTarget(null); setShowAll(false); setDetailId(null); }}
            className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
              activePattern === p.key ? 'border-accent bg-accent/7 text-accent' : isDone(p.key) ? 'border-accent/30 text-muted' : 'border-border text-muted hover:border-accent/40'
            }`}>
            {isDone(p.key) && <span className="absolute top-1.5 right-2 text-[10px] text-accent">✓</span>}
            <span className="font-mono text-[10px]">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Selected exercises for pattern */}
      {preferredForPattern.length > 0 && (
        <div className={card}>
          <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-2">Selecionados — {PATTERNS.find((p) => p.key === activePattern)?.label}</p>
          {preferredForPattern.map((sel) => (
            <div key={sel.exerciseId} className="flex items-center gap-3 p-2.5 bg-accent/4 border border-accent/15 rounded-lg mb-2">
              <span className="text-accent text-sm">✓</span>
              <span className="flex-1 font-sans text-sm text-accent">{sel.name}</span>
              <button onClick={() => { setSwapTarget(sel.exerciseId); setShowAll(true); }}
                className="font-mono text-[10px] text-muted border border-border rounded px-2 py-1 hover:text-white">Trocar</button>
            </div>
          ))}
        </div>
      )}

      {swapTarget && (
        <div className="bg-orange-400/5 border border-orange-400/25 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
          <span className="font-mono text-xs text-orange-300">
            {swapTarget === '_browse' ? 'A mostrar todos — escolhe um' : 'Modo substituição — escolhe o novo exercício'}
          </span>
          <button onClick={() => { setSwapTarget(null); setShowAll(false); }} className="font-mono text-[10px] text-orange-300 border border-orange-400/30 rounded px-2 py-1">Cancelar</button>
        </div>
      )}

      <p className="font-mono text-[10px] text-faint uppercase tracking-widest mb-3">
        {isLoading ? 'A carregar exercícios...' : `${exercises.length} exercícios disponíveis`}
      </p>

      {isLoading ? (
        <div className="py-8 font-mono text-xs text-muted text-center">A carregar...</div>
      ) : exercises.length === 0 ? (
        <div className="py-8 font-mono text-xs text-orange-400 text-center">Nenhum exercício para o equipamento selecionado.</div>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {visible.map((ex) => (
            <div key={ex.id}
              className={`bg-panel border rounded-xl overflow-hidden cursor-pointer transition-colors ${
                isSelected(ex.id) ? 'border-accent/25 bg-accent/3' : 'border-border hover:border-accent/40'
              }`}
              onClick={() => setDetailId(detailId === ex.id ? null : ex.id)}>
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className={`font-sans text-sm font-medium mb-0.5 ${isSelected(ex.id) ? 'text-accent' : 'text-white'}`}>{ex.name}</div>
                  <div className="font-mono text-[10px] text-faint truncate">
                    {ex.primaryMuscles.slice(0, 3).join(', ')}
                    {(ex.clinicalNotes?.length ?? 0) > 0 && <span className="text-orange-400"> · ⚠ {ex.clinicalNotes?.map((n) => n.replace('evitar_', '')).join(', ')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border" style={{ color: LEVEL_COLOR[ex.level], borderColor: LEVEL_COLOR[ex.level] + '44' }}>
                    {LEVEL_LABEL[ex.level]}
                  </span>
                  {isSelected(ex.id)
                    ? <span className="text-accent text-sm">✓</span>
                    : <span className="font-mono text-[10px] text-blue-400">+ Selecionar</span>}
                </div>
              </div>
              {detailId === ex.id && (
                <div className="px-4 pb-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-3 mt-3 flex-wrap">
                    {ex.primaryMuscles.map((m) => (
                      <span key={m} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">{m.replace(/_/g, ' ')}</span>
                    ))}
                    {ex.secondaryMuscles.map((m) => (
                      <span key={m} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-panel border border-border text-muted">{m.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                  {!isSelected(ex.id) && (
                    <button onClick={() => handleSelect(ex)} className="mt-3 bg-accent text-dark font-syne font-black text-xs px-4 py-2 rounded-lg">
                      + Adicionar ao plano
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {!showAll && exercises.length > 4 && (
            <button onClick={() => { setShowAll(true); setSwapTarget('_browse'); }}
              className="w-full border border-dashed border-border rounded-xl py-3 font-mono text-xs text-muted hover:text-white hover:border-muted transition-colors">
              Ver todos os {exercises.length} exercícios
            </button>
          )}
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between bg-panel border border-border rounded-xl px-4 py-3 mb-4">
        <span className="font-mono text-xs text-muted">{selections.length} exercícios selecionados</span>
        <div className="flex gap-1.5">
          {PATTERNS.map((p) => (
            <div key={p.key} className={`w-2 h-2 rounded-full transition-colors ${isDone(p.key) ? 'bg-accent' : 'bg-border'}`} title={p.label} />
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={prevStep} className={btnSecondary}>← Voltar</button>
        <button onClick={nextStep} className={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
}

// ─── Step 5 ─────────────────────────────────────────────────────────────────
function Step5() {
  const { formData, selections, clientId, assessment, loading, error, prevStep, nextStep, setAssessment, setProgram, setLoading, setError } = usePrescriptionStore();
  const { idade = 30, fcRep = 70, peso, altura, pctGordura, objetivo } = formData;
  const fcmax = Math.round(207 - 0.7 * idade);
  const imc = peso && altura ? (peso / Math.pow(altura / 100, 2)).toFixed(1) : null;
  const z1Low = Math.round((fcmax - fcRep) * 0.5 + fcRep);
  const z1High = Math.round((fcmax - fcRep) * 0.6 + fcRep);
  const z2Low = Math.round((fcmax - fcRep) * 0.6 + fcRep);
  const z2High = Math.round((fcmax - fcRep) * 0.75 + fcRep);
  const z3Low = Math.round((fcmax - fcRep) * 0.75 + fcRep);
  const z3High = Math.round((fcmax - fcRep) * 0.9 + fcRep);

  const flags: string[] = [];
  if (formData.sintomas?.some((s) => ['palpitacoes', 'dor_peito', 'dispneia', 'diabetes', 'drc'].includes(s))) flags.push('Sintomas clínicos');
  if ((formData.pas ?? 0) >= 140 || (formData.pad ?? 0) >= 90) flags.push('Hipertensão arterial');
  if (formData.riscos?.includes('fumador')) flags.push('Tabagismo');

  const handleGenerate = async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      let assessmentId = assessment?.id;
      if (!assessmentId) {
        const a = await assessmentsApi.create({ clientId, data: formData as any });
        setAssessment(a);
        assessmentId = a.id;
      }
      const p = await programsApi.generate({
        assessmentId,
        clientId,
        selectedExercises: selections.map((s) => ({ exerciseId: s.exerciseId, pattern: s.pattern, type: s.type })),
      });
      setProgram(p);
      nextStep();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao gerar plano');
    } finally {
      setLoading(false);
    }
  };

  const statBadge = (label: string, val: string | number, color?: string) => (
    <div className="bg-panel border border-border rounded-xl p-3 text-center">
      <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">{label}</p>
      <p className="font-syne font-black text-lg" style={{ color: color ?? '#c8f542' }}>{val}</p>
    </div>
  );

  return (
    <div>
      <h2 className="font-syne font-black text-xl text-white mb-4">Revisão do Perfil</h2>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {statBadge('Cliente', formData.nome ?? '—', '#e8e8f0')}
        {statBadge('Objetivo', objetivo ?? '—', '#c8f542')}
        {imc && statBadge('IMC', imc, parseFloat(imc) > 25 ? '#ff8c5a' : '#c8f542')}
        {pctGordura && statBadge('% Gordura', `${pctGordura}%`, pctGordura > 28 ? '#ff3b3b' : '#42a5f5')}
        {statBadge('FC Máx', `${fcmax} bpm`, '#42a5f5')}
      </div>

      <div className="bg-[#0d0d13] border border-border rounded-xl p-4 font-mono text-xs text-muted mb-4">
        <strong className="text-white">Zonas Karvonen</strong> · FCmáx = {fcmax} bpm · FCrep = {fcRep} bpm<br />
        Z1 (50–60%): <strong className="text-white">{z1Low}–{z1High}</strong>
        &nbsp;|&nbsp; Z2 (60–75%): <strong className="text-white">{z2Low}–{z2High}</strong>
        &nbsp;|&nbsp; Z3 (75–90%): <strong className="text-white">{z3Low}–{z3High}</strong> bpm
      </div>

      <div className="border-t border-border mb-4" />
      {[
        ['Disponibilidade', `${formData.diasSemana}x/sem · ${formData.duracaoSessao} min/sessão`],
        ['Exercício atual', `${formData.pratica} · ${formData.tempoTreino} meses`],
        ['Lesões', formData.lesoes?.join(', ') || 'Nenhuma'],
        ['Equipamento', formData.equipamento?.join(', ')],
        ['Exercícios selecionados', `${selections.length} exercícios (${selections.filter((s) => s.type === 'PREFERRED').length} preferidos)`],
      ].map(([k, v]) => (
        <div key={k as string} className="flex gap-4 py-2.5 border-b border-border last:border-0">
          <span className="font-mono text-[10px] text-muted uppercase tracking-widest min-w-[160px] pt-0.5">{k}</span>
          <span className="font-sans text-sm text-white">{v}</span>
        </div>
      ))}

      {flags.length > 0 && (
        <div className="mt-4 bg-orange-400/5 border border-orange-400/25 rounded-xl p-4 flex gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-mono text-xs text-orange-300 font-bold mb-1">FLAGS CLÍNICOS DETETADOS</p>
            <p className="font-sans text-xs text-muted">{flags.join(' · ')}</p>
          </div>
        </div>
      )}

      {error && <p className="font-mono text-xs text-red-400 mt-3">{error}</p>}

      <div className="flex justify-between mt-4">
        <button onClick={prevStep} className={btnSecondary}>← Voltar</button>
        <button onClick={handleGenerate} disabled={loading} className={btnPrimary}>
          {loading ? 'A gerar plano...' : 'Gerar Plano →'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 6 ─────────────────────────────────────────────────────────────────
function Step6() {
  const { program, reset } = usePrescriptionStore();
  const [openPhase, setOpenPhase] = useState(0);

  if (!program) return <div className="font-mono text-sm text-muted py-10">Plano não encontrado.</div>;

  const phases = program.phases as unknown as ProgramPhase[];

  return (
    <div>
      <h2 className="font-syne font-black text-xl text-white mb-4">Plano de Prescrição</h2>

      <div className="bg-accent/6 border border-accent/15 rounded-xl p-5 mb-5">
        <h3 className="font-syne font-bold text-lg text-white">{program.name}</h3>
        <p className="font-mono text-xs text-muted mt-1">
          {phases.length} fases · {phases.reduce((a, p) => a + (p.weeks || 0), 0)} semanas
        </p>
      </div>

      {phases.map((phase, i) => (
        <div key={i} className="bg-panel border border-border rounded-xl mb-3 overflow-hidden">
          <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors"
            onClick={() => setOpenPhase(openPhase === i ? -1 : i)}>
            <div className="w-8 h-8 rounded-md bg-accent/8 border border-accent/20 flex items-center justify-center font-mono text-xs text-accent flex-shrink-0">
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="flex-1 text-left">
              <div className="font-syne font-bold text-sm text-white" dangerouslySetInnerHTML={{ __html: phase.name }} />
              <div className="font-mono text-[10px] text-muted">{phase.sub}</div>
            </div>
            <span className="text-muted text-xs">{openPhase === i ? '▴' : '▾'}</span>
          </button>

          {openPhase === i && (
            <div className="px-5 pb-5 border-t border-border">
              <p className="font-sans text-xs text-muted mt-4 mb-3 leading-relaxed">{phase.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {phase.method?.map((m: string) => (
                  <span key={m} className="font-mono text-[9px] px-2 py-0.5 rounded bg-blue-400/8 border border-blue-400/20 text-blue-400">{m}</span>
                ))}
              </div>

              {[
                { title: '🏃 Cardiovascular', color: '#42a5f5', data: phase.cardio, fields: ['freq', 'intensidade', 'tempo', 'tipo', 'volume', 'progressao'] },
                { title: '💪 Força / Resistência Muscular', color: '#c8f542', data: phase.forca, fields: ['freq', 'intensidade', 'series', 'intervalo', 'velocidade', 'progressao'] },
                { title: '🧘 Flexibilidade / Mobilidade', color: '#ff8c5a', data: phase.flex, fields: ['freq', 'tipo', 'tempo', 'volume', 'foco'] },
              ].map(({ title, color, data, fields }) => (
                <div key={title} className="mb-4">
                  <p className="font-mono text-[10px] mb-2" style={{ color }}>{title}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {fields.map((f) => (
                      data?.[f] && (
                        <div key={f} className="bg-[#18181f] border border-border rounded-lg p-2.5">
                          <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">{f}</p>
                          <p className="font-sans text-xs text-white leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{data[f]}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}

              {phase.weekByWeek && phase.weekByWeek.length > 0 && (
                <table className="w-full text-xs mt-2">
                  <thead>
                    <tr>
                      {['Semana', 'Força', 'Cardio', 'Flex'].map((h) => (
                        <th key={h} className="text-left py-2 px-2 font-mono text-[9px] text-faint uppercase tracking-widest border-b border-border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {phase.weekByWeek.map((w: any, wi: number) => (
                      <tr key={wi} className="border-b border-border/50 last:border-0">
                        <td className="py-2 px-2 font-mono text-[10px] text-muted">S{w.wk}</td>
                        <td className="py-2 px-2 font-sans text-xs text-white">{w.forca}</td>
                        <td className="py-2 px-2 font-sans text-xs text-white">{w.cardio}</td>
                        <td className="py-2 px-2 font-sans text-xs text-white">{w.flex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-3 mt-4">
        <a href={`/api/programs/${program.id}/export`} download
          className="bg-accent text-dark font-syne font-black text-sm px-5 py-2.5 rounded-lg hover:bg-accent/90">
          ⬇ Exportar JSON
        </a>
        <button onClick={reset} className={btnSecondary}>↺ Nova Prescrição</button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function PrescriptionPage() {
  const searchParams = useSearchParams();
  const { currentStep, clientId, setClientId, reset } = usePrescriptionStore();
  const { data: clients = [], isLoading } = useSWR('clients-all', clientsApi.getAll);
  const [selectedClientId, setSelectedClientId] = useState('');

  // Pre-select from query param
  useEffect(() => {
    const qId = searchParams.get('clientId');
    if (qId) { setSelectedClientId(qId); setClientId(qId); }
    return () => { reset(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6];
  const StepComponent = STEP_COMPONENTS[currentStep];
  const activeClientName = clients.find((c: any) => c.client?.id === clientId)?.client?.name;

  if (!clientId) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="font-syne font-black text-2xl text-white">Motor de Prescrição</h1>
          <p className="font-mono text-xs text-muted mt-1">// seleciona o cliente para iniciar</p>
        </div>

        <div className="max-w-lg">
          <p className="font-syne font-bold text-base text-white mb-5">Com quem vais trabalhar?</p>
          {isLoading ? (
            <p className="font-mono text-sm text-muted">A carregar clientes...</p>
          ) : clients.length === 0 ? (
            <p className="font-sans text-sm text-orange-400 bg-orange-400/6 border border-orange-400/18 rounded-xl p-4">
              Nenhum cliente registado. Cria primeiro um utilizador com role CLIENT.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {clients.filter((c: any) => c.client).map((c: any) => (
                  <button key={c.id} onClick={() => setSelectedClientId(c.client.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                      selectedClientId === c.client.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/40'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-syne font-black text-accent text-lg flex-shrink-0 ${
                      selectedClientId === c.client.id ? 'bg-accent/12' : 'bg-accent/6'
                    }`}>
                      {c.client.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-syne font-bold text-sm text-white">{c.client.name}</p>
                    </div>
                    {selectedClientId === c.client.id && <span className="text-accent text-base">✓</span>}
                  </button>
                ))}
              </div>
              {selectedClientId && (
                <button onClick={() => setClientId(selectedClientId)}
                  className="bg-accent text-dark font-syne font-black text-sm px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors">
                  Iniciar prescrição →
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-syne font-black text-2xl text-white">Motor de Prescrição</h1>
        {activeClientName && <p className="font-mono text-xs text-muted mt-1">// {activeClientName}</p>}
      </div>

      {/* Steps nav */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-2 ${i === currentStep ? 'text-white' : i < currentStep ? 'text-accent' : 'text-faint'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs border ${
                i < currentStep ? 'border-accent bg-accent/10 text-accent' : i === currentStep ? 'border-white bg-white/10 text-white' : 'border-faint text-faint'
              }`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span className="font-mono text-xs hidden sm:block">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <StepComponent />
    </div>
  );
}
