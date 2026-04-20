import { calcBlockDuration, calcWorkoutDuration, type BlockInput } from './workout-duration.calculator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSequential(overrides: Partial<BlockInput> = {}): BlockInput {
  return {
    type: 'SEQUENTIAL',
    exercises: [
      { sets: 3, reps: '10', restAfterSet: 60 },
      { sets: 3, reps: '10', restAfterSet: 60 },
    ],
    restBetweenSets: 60,
    restAfterBlock: 0,
    ...overrides,
  };
}

// ─── calcBlockDuration ────────────────────────────────────────────────────────

describe('calcBlockDuration', () => {
  describe('TABATA', () => {
    test('calculates duration correctly for standard tabata', () => {
      const block: BlockInput = {
        type: 'TABATA',
        exercises: [],
        restBetweenSets: 0,
        restAfterBlock: 0,
        tabata: { workSeconds: 20, restSeconds: 10, rounds: 8 },
      };
      expect(calcBlockDuration(block)).toBe(8 * 30); // 240s
    });

    test('adds restAfterBlock to tabata duration', () => {
      const block: BlockInput = {
        type: 'TABATA',
        exercises: [],
        restBetweenSets: 0,
        restAfterBlock: 120,
        tabata: { workSeconds: 20, restSeconds: 10, rounds: 8 },
      };
      expect(calcBlockDuration(block)).toBe(240 + 120);
    });
  });

  describe('CARDIO', () => {
    test('uses cardioDurationMin when provided', () => {
      const block: BlockInput = {
        type: 'CARDIO',
        exercises: [],
        restBetweenSets: 0,
        restAfterBlock: 0,
        cardioDurationMin: 30,
      };
      expect(calcBlockDuration(block)).toBe(30 * 60);
    });

    test('defaults to 20 min when cardioDurationMin not provided', () => {
      const block: BlockInput = {
        type: 'CARDIO',
        exercises: [],
        restBetweenSets: 0,
        restAfterBlock: 0,
      };
      expect(calcBlockDuration(block)).toBe(20 * 60);
    });
  });

  describe('FLEXIBILITY / WARMUP', () => {
    test('calculates flexibility block with default hold', () => {
      const block: BlockInput = {
        type: 'FLEXIBILITY',
        exercises: [{ sets: 1, reps: '3' }],
        restBetweenSets: 0,
        restAfterBlock: 0,
        holdSeconds: 30,
      };
      // 3 reps × (0 + 30 + 3) = 99s
      expect(calcBlockDuration(block)).toBe(99);
    });

    test('adds PNF contraction time', () => {
      const block: BlockInput = {
        type: 'FLEXIBILITY',
        exercises: [{ sets: 1, reps: '2' }],
        restBetweenSets: 0,
        restAfterBlock: 0,
        holdSeconds: 30,
        stretchMethod: 'PNF',
        contractionSeconds: 6,
      };
      // 2 reps × (6 + 30 + 3) = 78s
      expect(calcBlockDuration(block)).toBe(78);
    });

    test('WARMUP uses same calculation path as FLEXIBILITY', () => {
      const block: BlockInput = {
        type: 'WARMUP',
        exercises: [{ sets: 1, reps: '3' }],
        restBetweenSets: 0,
        restAfterBlock: 0,
        holdSeconds: 20,
      };
      expect(calcBlockDuration(block)).toBe(3 * (0 + 20 + 3));
    });

    test('defaults to 5 min when no exercises', () => {
      const block: BlockInput = {
        type: 'FLEXIBILITY',
        exercises: [],
        restBetweenSets: 0,
        restAfterBlock: 0,
      };
      expect(calcBlockDuration(block)).toBe(5 * 60);
    });
  });

  describe('SEQUENTIAL', () => {
    test('accumulates time per exercise', () => {
      const block: BlockInput = {
        type: 'SEQUENTIAL',
        exercises: [
          { sets: 3, reps: '10', restAfterSet: 60 }, // 3 × (10×4 + 60) = 300s
        ],
        restBetweenSets: 60,
        restAfterBlock: 0,
      };
      expect(calcBlockDuration(block)).toBe(3 * (10 * 4 + 60));
    });

    test('uses restBetweenSets as fallback when no restAfterSet on exercise', () => {
      const block: BlockInput = {
        type: 'SEQUENTIAL',
        exercises: [{ sets: 2, reps: '10' }],
        restBetweenSets: 90,
        restAfterBlock: 0,
      };
      expect(calcBlockDuration(block)).toBe(2 * (10 * 4 + 90));
    });

    test('uses tempo to calculate rep duration', () => {
      const block: BlockInput = {
        type: 'SEQUENTIAL',
        exercises: [{ sets: 3, reps: '5', tempoExecution: '3:1:3:1', restAfterSet: 60 }],
        restBetweenSets: 60,
        restAfterBlock: 0,
      };
      // tempo sum = 8s per rep; 3 × (5×8 + 60) = 300s
      expect(calcBlockDuration(block)).toBe(3 * (5 * 8 + 60));
    });

    test('handles isometric exercises using isometricSeconds', () => {
      const block: BlockInput = {
        type: 'SEQUENTIAL',
        exercises: [{ sets: 3, reps: '5', isometricSeconds: 30, restAfterSet: 60 }],
        restBetweenSets: 60,
        restAfterBlock: 0,
      };
      // 30s per rep; 3 × (5×30 + 60) = 630s
      expect(calcBlockDuration(block)).toBe(3 * (5 * 30 + 60));
    });

    test('adds restAfterBlock', () => {
      const block = makeSequential({ restAfterBlock: 120 });
      const withoutRest = calcBlockDuration(makeSequential({ restAfterBlock: 0 }));
      expect(calcBlockDuration(block)).toBe(withoutRest + 120);
    });

    test('handles AMRAP reps as 12 reps estimate', () => {
      const block: BlockInput = {
        type: 'SEQUENTIAL',
        exercises: [{ sets: 3, reps: 'AMRAP', restAfterSet: 60 }],
        restBetweenSets: 60,
        restAfterBlock: 0,
      };
      expect(calcBlockDuration(block)).toBe(3 * (12 * 4 + 60));
    });
  });

  describe('SUPERSET', () => {
    test('removes duplicate rest intervals between exercises in same round', () => {
      const block: BlockInput = {
        type: 'SUPERSET',
        exercises: [
          { sets: 3, reps: '10', restAfterSet: 60 },
          { sets: 3, reps: '10', restAfterSet: 60 },
        ],
        restBetweenSets: 60,
        restAfterBlock: 0,
      };
      const sequential = calcBlockDuration({
        ...block,
        type: 'SEQUENTIAL',
      });
      expect(calcBlockDuration(block)).toBeLessThan(sequential);
    });

    test('result is non-negative', () => {
      const block: BlockInput = {
        type: 'SUPERSET',
        exercises: [
          { sets: 3, reps: '10' },
          { sets: 3, reps: '10' },
        ],
        restBetweenSets: 0,
        restAfterBlock: 0,
      };
      expect(calcBlockDuration(block)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CIRCUIT', () => {
    test('applies same rest reduction as SUPERSET', () => {
      const block: BlockInput = {
        type: 'CIRCUIT',
        exercises: [
          { sets: 3, reps: '10', restAfterSet: 60 },
          { sets: 3, reps: '10', restAfterSet: 60 },
          { sets: 3, reps: '10', restAfterSet: 60 },
        ],
        restBetweenSets: 60,
        restAfterBlock: 0,
      };
      const result = calcBlockDuration(block);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(3 * 3 * (10 * 4 + 60)); // less than sequential total
    });
  });

  describe('rep string parsing', () => {
    test('parses range "8-12" using max value', () => {
      const block: BlockInput = {
        type: 'SEQUENTIAL',
        exercises: [{ sets: 1, reps: '8-12', restAfterSet: 0 }],
        restBetweenSets: 0,
        restAfterBlock: 0,
      };
      // 12 reps × 4s = 48s
      expect(calcBlockDuration(block)).toBe(48);
    });

    test('parses time-based reps like "30s"', () => {
      const block: BlockInput = {
        type: 'SEQUENTIAL',
        exercises: [{ sets: 2, reps: '30s', restAfterSet: 0 }],
        restBetweenSets: 0,
        restAfterBlock: 0,
      };
      expect(calcBlockDuration(block)).toBeGreaterThan(0);
    });
  });
});

// ─── calcWorkoutDuration ──────────────────────────────────────────────────────

describe('calcWorkoutDuration', () => {
  test('returns 0 minutes for empty blocks', () => {
    const result = calcWorkoutDuration([]);
    expect(result.totalMin).toBe(0);
    expect(result.breakdown).toHaveLength(0);
    expect(result.warning).toBeUndefined();
  });

  test('sums multiple blocks correctly', () => {
    const blocks: BlockInput[] = [
      { type: 'CARDIO', exercises: [], restBetweenSets: 0, restAfterBlock: 0, cardioDurationMin: 10 },
      { type: 'CARDIO', exercises: [], restBetweenSets: 0, restAfterBlock: 0, cardioDurationMin: 20 },
    ];
    const result = calcWorkoutDuration(blocks);
    expect(result.totalMin).toBe(30);
  });

  test('returns breakdown with correct number of entries', () => {
    const blocks: BlockInput[] = [
      { type: 'CARDIO', exercises: [], restBetweenSets: 0, restAfterBlock: 0, cardioDurationMin: 10 },
      makeSequential(),
    ];
    const result = calcWorkoutDuration(blocks);
    expect(result.breakdown).toHaveLength(2);
  });

  test('issues warning when duration exceeds 90 min', () => {
    const longBlock: BlockInput = {
      type: 'CARDIO',
      exercises: [],
      restBetweenSets: 0,
      restAfterBlock: 0,
      cardioDurationMin: 95,
    };
    const result = calcWorkoutDuration([longBlock]);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain('90 min');
  });

  test('no warning when duration is exactly 90 min', () => {
    const block: BlockInput = {
      type: 'CARDIO',
      exercises: [],
      restBetweenSets: 0,
      restAfterBlock: 0,
      cardioDurationMin: 90,
    };
    const result = calcWorkoutDuration([block]);
    expect(result.warning).toBeUndefined();
  });

  test('breakdown labels include block type', () => {
    const block: BlockInput = {
      type: 'TABATA',
      exercises: [],
      restBetweenSets: 0,
      restAfterBlock: 0,
      tabata: { workSeconds: 20, restSeconds: 10, rounds: 8 },
    };
    const result = calcWorkoutDuration([block]);
    expect(result.breakdown[0].label).toContain('TABATA');
  });
});
