import { TrainingLevel } from '@prisma/client';

export interface AssessmentData {
  idade: number;
  sexo: 'M' | 'F';
  pas?: number;
  pad?: number;
  sintomas?: string[];
  riscos?: string[];
  pratica?: string;
  tempoTreino?: number;
  diasSemana?: number;
  fcRep?: number;
  vo2max?: number;
}

export interface ClassificationResult {
  level: TrainingLevel;
  flags: string[];
  fcmax: number;
  karvonenZones: {
    z1: { low: number; high: number; label: string };
    z2: { low: number; high: number; label: string };
    z3: { low: number; high: number; label: string };
  };
}

export function classifyAssessment(data: AssessmentData): ClassificationResult {
  // ── Nível de treino ──────────────────────────────────────────────────────
  const level = resolveLevel(data.pratica, data.tempoTreino);

  // ── Flags clínicas ────────────────────────────────────────────────────────
  const flags: string[] = [];
  const clinicSintomas = ['palpitacoes', 'dor_peito', 'dispneia', 'diabetes', 'drc'];

  if (data.sintomas?.some((s) => clinicSintomas.includes(s))) {
    flags.push('SINTOMAS_CLINICOS');
  }
  if ((data.pas ?? 0) >= 140 || (data.pad ?? 0) >= 90) {
    flags.push('HIPERTENSAO');
  }
  if (data.riscos?.includes('fumador')) flags.push('TABAGISMO');
  if (data.riscos?.includes('hist_familiar')) flags.push('HIST_FAMILIAR_DCV');
  if ((data.pas ?? 0) >= 200 || (data.pad ?? 0) >= 110) flags.push('CONTRAINDICADO');

  // ── Karvonen ──────────────────────────────────────────────────────────────
  const fcmax = Math.round(207 - 0.7 * data.idade);
  const fcrep = data.fcRep ?? 70;

  const karvonen = (pct: number) => Math.round((fcmax - fcrep) * pct + fcrep);

  return {
    level,
    flags,
    fcmax,
    karvonenZones: {
      z1: { low: karvonen(0.50), high: karvonen(0.60), label: '50–60% (Ligeira)' },
      z2: { low: karvonen(0.60), high: karvonen(0.75), label: '60–75% (Moderada)' },
      z3: { low: karvonen(0.75), high: karvonen(0.90), label: '75–90% (Vigorosa)' },
    },
  };
}

function resolveLevel(pratica?: string, tempoMeses?: number): TrainingLevel {
  if (!pratica || pratica === 'nao') return TrainingLevel.INICIANTE;
  if (pratica === 'sim_pouco' || (tempoMeses ?? 0) < 2) return TrainingLevel.INICIANTE;
  if (pratica === 'sim' && (tempoMeses ?? 0) < 12) return TrainingLevel.INTERMEDIO;
  if (pratica === 'sim_muito' || (tempoMeses ?? 0) >= 12) return TrainingLevel.AVANCADO;
  return TrainingLevel.INICIANTE;
}
