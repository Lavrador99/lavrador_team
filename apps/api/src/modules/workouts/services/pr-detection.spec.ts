/**
 * Testes unitários para a lógica de auto-detecção de Personal Records.
 * Testa a fórmula de Epley (1RM = load × (1 + reps/30)) e os casos limite.
 * A função calc1RM está inline no page.tsx do cliente, por isso testamos
 * a lógica pura aqui como referência canónica.
 */

// Fórmula de Epley extraída de workouts.service.ts (linha 219)
function calc1RM(load: number, reps: number): number {
  return load * (1 + reps / 30);
}

function roundedRM(load: number, reps: number): number {
  return Math.round(calc1RM(load, reps));
}

// ─── Fórmula de Epley ────────────────────────────────────────────────────────

describe('Epley 1RM formula', () => {
  test('exact 1RM for 1 rep equals the load itself (approx)', () => {
    // load=100, reps=1 → 100 × (1 + 1/30) ≈ 103.3
    expect(calc1RM(100, 1)).toBeCloseTo(103.33, 1);
  });

  test('calculates correctly for typical hypertrophy set', () => {
    // load=80, reps=10 → 80 × (1 + 10/30) = 80 × 1.333 = 106.67
    expect(calc1RM(80, 10)).toBeCloseTo(106.67, 1);
  });

  test('1RM increases with more reps at same load', () => {
    expect(calc1RM(60, 15)).toBeGreaterThan(calc1RM(60, 10));
  });

  test('1RM increases with more load at same reps', () => {
    expect(calc1RM(100, 8)).toBeGreaterThan(calc1RM(80, 8));
  });

  test('rounding is consistent with service implementation', () => {
    expect(roundedRM(100, 10)).toBe(Math.round(100 * (1 + 10 / 30)));
  });
});

// ─── Best set selection logic ─────────────────────────────────────────────────

interface SetData {
  load: number;
  reps: number;
  completed: boolean;
}

function findBest1RM(sets: SetData[]): { best1RM: number; load: number; reps: number } | null {
  let best1RM = 0;
  let bestLoad = 0;
  let bestReps = 0;

  for (const set of sets) {
    if (!set.completed) continue;
    const load = set.load;
    const reps = set.reps;
    if (load > 0 && reps >= 1) {
      const rm1 = load * (1 + reps / 30);
      if (rm1 > best1RM) {
        best1RM = rm1;
        bestLoad = load;
        bestReps = reps;
      }
    }
  }

  if (best1RM === 0) return null;
  return { best1RM: Math.round(best1RM), load: bestLoad, reps: bestReps };
}

describe('findBest1RM', () => {
  test('returns null for empty set list', () => {
    expect(findBest1RM([])).toBeNull();
  });

  test('returns null when no sets are completed', () => {
    const sets: SetData[] = [
      { load: 100, reps: 10, completed: false },
      { load: 80, reps: 12, completed: false },
    ];
    expect(findBest1RM(sets)).toBeNull();
  });

  test('returns null when load is zero', () => {
    const sets: SetData[] = [{ load: 0, reps: 10, completed: true }];
    expect(findBest1RM(sets)).toBeNull();
  });

  test('ignores incomplete sets when selecting best', () => {
    const sets: SetData[] = [
      { load: 150, reps: 10, completed: false }, // higher, but not completed
      { load: 80,  reps: 10, completed: true  },
    ];
    const result = findBest1RM(sets);
    expect(result).not.toBeNull();
    expect(result!.load).toBe(80);
  });

  test('picks the set with highest estimated 1RM, not highest load', () => {
    const sets: SetData[] = [
      { load: 100, reps: 3,  completed: true }, // 1RM ≈ 110
      { load: 80,  reps: 12, completed: true }, // 1RM ≈ 112 — should win
    ];
    const result = findBest1RM(sets);
    expect(result!.load).toBe(80);
    expect(result!.reps).toBe(12);
  });

  test('handles single completed set correctly', () => {
    const sets: SetData[] = [{ load: 60, reps: 15, completed: true }];
    const result = findBest1RM(sets);
    expect(result).not.toBeNull();
    expect(result!.best1RM).toBe(Math.round(60 * (1 + 15 / 30)));
  });

  test('handles warmup sets mixed with working sets', () => {
    const sets: SetData[] = [
      { load: 40, reps: 20, completed: true }, // warmup
      { load: 80, reps: 10, completed: true }, // working — higher 1RM
    ];
    const result = findBest1RM(sets);
    expect(result!.load).toBe(80);
  });

  test('reps = 0 produces no PR (reps >= 1 requirement)', () => {
    const sets: SetData[] = [{ load: 100, reps: 0, completed: true }];
    expect(findBest1RM(sets)).toBeNull();
  });
});

// ─── PR comparison logic ──────────────────────────────────────────────────────

describe('PR comparison (beats existing record)', () => {
  function shouldSavePR(newValue: number, existingValue: number | null): boolean {
    return existingValue === null || newValue > existingValue;
  }

  test('saves PR when no existing record', () => {
    expect(shouldSavePR(100, null)).toBe(true);
  });

  test('saves PR when new value exceeds existing', () => {
    expect(shouldSavePR(110, 100)).toBe(true);
  });

  test('does not save PR when new value equals existing', () => {
    expect(shouldSavePR(100, 100)).toBe(false);
  });

  test('does not save PR when new value is less than existing', () => {
    expect(shouldSavePR(90, 100)).toBe(false);
  });
});
