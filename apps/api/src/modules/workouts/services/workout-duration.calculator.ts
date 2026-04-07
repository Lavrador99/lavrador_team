/**
 * Calcula a duração estimada de um workout baseado nos princípios FITT-VP
 * e nas tabelas do documento de prescrição (séries, reps, repouso por objetivo).
 */

export interface BlockInput {
  type: string;
  exercises: {
    sets: number;
    reps: string;
    isometricSeconds?: number;
    tempoExecution?: string;
    restAfterSet?: number;
  }[];
  restBetweenSets: number;
  restAfterBlock: number;
  tabata?: { workSeconds: number; restSeconds: number; rounds: number };
  cardioDurationMin?: number;
  holdSeconds?: number;
  contractionSeconds?: number;
  stretchMethod?: string;
}

/**
 * Estima o tempo de execução de uma repetição em segundos.
 * Usa o tempo de execução (ex: "2:1:2:0") se disponível,
 * caso contrário usa 4s como default conservador.
 */
function parseRepSeconds(reps: string, tempo?: string, isometricSec?: number): number {
  if (isometricSec) return isometricSec;

  // AMRAP ou formato de tempo
  if (reps.toLowerCase().includes('s') || reps.toLowerCase().includes('min')) {
    const match = reps.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
  }

  if (tempo) {
    // ex: "2:1:2:0" → soma = 5s por rep
    const parts = tempo.split(':').map(Number);
    return parts.reduce((a, b) => a + b, 0);
  }

  // Default: 4s por rep (2s concêntrico + 2s excêntrico)
  return 4;
}

/**
 * Extrai número de reps (usa o valor máximo do intervalo se "8-12").
 */
function parseRepsCount(reps: string): number {
  if (reps.toLowerCase() === 'amrap') return 12; // estimativa
  const range = reps.match(/(\d+)-(\d+)/);
  if (range) return parseInt(range[2]); // usa o máximo
  const single = reps.match(/(\d+)/);
  return single ? parseInt(single[1]) : 10;
}

/**
 * Calcula duração de um bloco em segundos.
 */
export function calcBlockDuration(block: BlockInput): number {
  const type = block.type;

  // ── TABATA / HIIT ─────────────────────────────────────────────────────
  if (type === 'TABATA' && block.tabata) {
    const { workSeconds, restSeconds, rounds } = block.tabata;
    const tabataSec = rounds * (workSeconds + restSeconds);
    return tabataSec + block.restAfterBlock;
  }

  // ── CARDIO ────────────────────────────────────────────────────────────
  if (type === 'CARDIO') {
    return (block.cardioDurationMin ?? 20) * 60 + block.restAfterBlock;
  }

  // ── FLEXIBILITY ───────────────────────────────────────────────────────
  if (type === 'FLEXIBILITY' || type === 'WARMUP') {
    const holdSec = block.holdSeconds ?? 20;
    const contractionSec = block.stretchMethod === 'PNF'
      ? (block.contractionSeconds ?? 6)
      : 0;
    const perExercise = block.exercises.length > 0
      ? block.exercises.reduce((acc, ex) => {
          const repsCount = parseRepsCount(ex.reps);
          return acc + repsCount * (contractionSec + holdSec + 3); // +3s transição
        }, 0)
      : 60 * 5; // default 5 min se sem exercícios

    return perExercise + block.restAfterBlock;
  }

  // ── SEQUENTIAL / SUPERSET / CIRCUIT ──────────────────────────────────
  let totalSec = 0;

  for (const ex of block.exercises) {
    const repSec = parseRepSeconds(ex.reps, ex.tempoExecution, ex.isometricSeconds);
    const repsCount = parseRepsCount(ex.reps);
    const setDuration = repsCount * repSec;
    const restPerSet = ex.restAfterSet ?? block.restBetweenSets;

    // sets × (execução + descanso entre séries)
    totalSec += ex.sets * (setDuration + restPerSet);
  }

  // SUPERSET / CIRCUIT: os exercícios são feitos em conjunto,
  // o repouso é depois do grupo completo, não por exercício
  if (type === 'SUPERSET' || type === 'CIRCUIT') {
    // Repouso só uma vez por round, não por exercício
    const maxSets = Math.max(...block.exercises.map((e) => e.sets));
    const restOvercount = (block.exercises.length - 1) * maxSets * block.restBetweenSets;
    totalSec -= restOvercount;
  }

  return Math.max(0, totalSec) + block.restAfterBlock;
}

/**
 * Calcula a duração total estimada do workout em minutos.
 * Alerta se exceder 90 min (recomendação NASM).
 */
export function calcWorkoutDuration(blocks: BlockInput[]): {
  totalMin: number;
  warning?: string;
  breakdown: { label: string; minutes: number }[];
} {
  const breakdown: { label: string; minutes: number }[] = [];
  let totalSec = 0;

  for (let i = 0; i < blocks.length; i++) {
    const sec = calcBlockDuration(blocks[i]);
    const min = Math.round(sec / 60);
    totalSec += sec;
    breakdown.push({ label: `Bloco ${i + 1} (${blocks[i].type})`, minutes: min });
  }

  const totalMin = Math.round(totalSec / 60);
  const warning = totalMin > 90
    ? `⚠ Duração estimada (${totalMin} min) excede os 90 min recomendados (NASM).`
    : undefined;

  return { totalMin, warning, breakdown };
}
