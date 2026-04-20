import {
  ACSM_GUIDELINES,
  CLINICAL_FLAGS_RULES,
  FREQUENCY_BY_LEVEL,
  applyClinicalOverrides,
  extractPhaseDefaults,
  mapObjectiveToAcsm,
  validatePrescription,
  type TrainingObjective,
} from './acsm-guidelines.engine';

// ─── ACSM_GUIDELINES structure ───────────────────────────────────────────────

describe('ACSM_GUIDELINES', () => {
  const objectives: TrainingObjective[] = [
    'FORCA', 'HIPERTROFIA', 'RESISTENCIA', 'POTENCIA', 'SAUDE_GERAL',
  ];

  test.each(objectives)('%s has required fields', (obj) => {
    const g = ACSM_GUIDELINES[obj];
    expect(g.sets.min).toBeGreaterThan(0);
    expect(g.sets.max).toBeGreaterThanOrEqual(g.sets.min);
    expect(g.percentRM.min).toBeGreaterThan(0);
    expect(g.percentRM.max).toBeGreaterThanOrEqual(g.percentRM.min);
    expect(g.percentRM.max).toBeLessThanOrEqual(100);
    expect(g.restBetweenSetsSeconds.min).toBeGreaterThan(0);
    expect(g.sessionsPerWeek.min).toBeGreaterThan(0);
    expect(g.tempo).toMatch(/^\d+:\d+:\d+:\d+$/);
    expect(g.notes.length).toBeGreaterThan(10);
  });

  test('FORCA has highest %RM (≥80)', () => {
    expect(ACSM_GUIDELINES.FORCA.percentRM.min).toBeGreaterThanOrEqual(80);
  });

  test('RESISTENCIA has most reps (≥15)', () => {
    const reps = ACSM_GUIDELINES.RESISTENCIA.reps;
    if (reps !== 'AMRAP') expect(reps.min).toBeGreaterThanOrEqual(15);
  });

  test('HIPERTROFIA has highest weekly set volume (≥10)', () => {
    expect(ACSM_GUIDELINES.HIPERTROFIA.weeklySetsPerPattern.min).toBeGreaterThanOrEqual(10);
  });

  test('POTENCIA has widest %RM range (30–70)', () => {
    const p = ACSM_GUIDELINES.POTENCIA.percentRM;
    expect(p.min).toBe(30);
    expect(p.max).toBe(70);
  });

  test('RESISTENCIA has shortest rest intervals', () => {
    const res = ACSM_GUIDELINES.RESISTENCIA.restBetweenSetsSeconds;
    const others = ['FORCA', 'HIPERTROFIA', 'POTENCIA', 'SAUDE_GERAL'] as TrainingObjective[];
    others.forEach((obj) => {
      expect(res.max).toBeLessThanOrEqual(ACSM_GUIDELINES[obj].restBetweenSetsSeconds.max);
    });
  });
});

// ─── FREQUENCY_BY_LEVEL ───────────────────────────────────────────────────────

describe('FREQUENCY_BY_LEVEL', () => {
  test('INICIANTE has lowest frequency', () => {
    expect(FREQUENCY_BY_LEVEL.INICIANTE.max).toBeLessThanOrEqual(FREQUENCY_BY_LEVEL.INTERMEDIO.min);
  });

  test('AVANCADO has highest frequency', () => {
    expect(FREQUENCY_BY_LEVEL.AVANCADO.min).toBeGreaterThanOrEqual(FREQUENCY_BY_LEVEL.INTERMEDIO.max);
  });

  test('each level has a split recommendation', () => {
    ['INICIANTE', 'INTERMEDIO', 'AVANCADO'].forEach((level) => {
      expect(FREQUENCY_BY_LEVEL[level as keyof typeof FREQUENCY_BY_LEVEL].splitRecommendation.length).toBeGreaterThan(3);
    });
  });
});

// ─── CLINICAL_FLAGS_RULES ─────────────────────────────────────────────────────

describe('CLINICAL_FLAGS_RULES', () => {
  test('hipertensao avoids EMPURRAR_VERTICAL', () => {
    expect(CLINICAL_FLAGS_RULES.hipertensao.avoid).toContain('EMPURRAR_VERTICAL');
  });

  test('evitar_lombar avoids DOMINANTE_ANCA and prioritizes CORE', () => {
    expect(CLINICAL_FLAGS_RULES.evitar_lombar.avoid).toContain('DOMINANTE_ANCA');
    expect(CLINICAL_FLAGS_RULES.evitar_lombar.prioritize).toContain('CORE');
  });

  test('joelho avoids DOMINANTE_JOELHO', () => {
    expect(CLINICAL_FLAGS_RULES.joelho.avoid).toContain('DOMINANTE_JOELHO');
  });

  test('sedentario has no avoidances but prioritizes CORE and LOCOMOCAO', () => {
    expect(CLINICAL_FLAGS_RULES.sedentario.avoid).toHaveLength(0);
    expect(CLINICAL_FLAGS_RULES.sedentario.prioritize).toContain('CORE');
    expect(CLINICAL_FLAGS_RULES.sedentario.prioritize).toContain('LOCOMOCAO');
  });
});

// ─── applyClinicalOverrides ───────────────────────────────────────────────────

describe('applyClinicalOverrides', () => {
  const basePrescription = { ...ACSM_GUIDELINES.HIPERTROFIA };

  test('returns unchanged prescription when no sensitive flags', () => {
    const result = applyClinicalOverrides(basePrescription, ['sedentario', 'joelho']);
    expect(result.rpeMaxCap).toBeUndefined();
    expect(result).toEqual(basePrescription);
  });

  test('applies rpeMaxCap: 7 for hipertensao flag', () => {
    const result = applyClinicalOverrides(basePrescription, ['hipertensao']);
    expect(result.rpeMaxCap).toBe(7);
  });

  test('applies rpeMaxCap: 7 for HIPERTENSAO (uppercase)', () => {
    const result = applyClinicalOverrides(basePrescription, ['HIPERTENSAO']);
    expect(result.rpeMaxCap).toBe(7);
  });

  test('applies rpeMaxCap: 7 for contraindicado flag', () => {
    const result = applyClinicalOverrides(basePrescription, ['contraindicado']);
    expect(result.rpeMaxCap).toBe(7);
  });

  test('does not mutate original prescription', () => {
    const original = { ...ACSM_GUIDELINES.FORCA };
    applyClinicalOverrides(original, ['hipertensao']);
    expect(original.rpeMaxCap).toBeUndefined();
  });

  test('applies override when one of multiple flags matches', () => {
    const result = applyClinicalOverrides(basePrescription, ['sedentario', 'hipertensao', 'joelho']);
    expect(result.rpeMaxCap).toBe(7);
  });

  test('handles empty flags array', () => {
    const result = applyClinicalOverrides(basePrescription, []);
    expect(result.rpeMaxCap).toBeUndefined();
  });
});

// ─── mapObjectiveToAcsm ───────────────────────────────────────────────────────

describe('mapObjectiveToAcsm', () => {
  test.each([
    ['força', 'FORCA'],
    ['Força Máxima', 'FORCA'],
    ['forca', 'FORCA'],
    ['force', 'FORCA'],
    ['hipertrofia', 'HIPERTROFIA'],
    ['massa muscular', 'HIPERTROFIA'],
    ['músculo', 'HIPERTROFIA'],
    ['resistência', 'RESISTENCIA'],
    ['resistencia muscular', 'RESISTENCIA'],
    ['endurance', 'RESISTENCIA'],
    ['potência', 'POTENCIA'],
    ['potencia', 'POTENCIA'],
    ['explosividade', 'POTENCIA'],
    ['emagrecimento', 'SAUDE_GERAL'],
    ['saúde', 'SAUDE_GERAL'],
    ['', 'SAUDE_GERAL'],
  ])('maps "%s" → %s', (input, expected) => {
    expect(mapObjectiveToAcsm(input)).toBe(expected);
  });

  test('handles null/undefined gracefully', () => {
    expect(mapObjectiveToAcsm(null as any)).toBe('SAUDE_GERAL');
    expect(mapObjectiveToAcsm(undefined as any)).toBe('SAUDE_GERAL');
  });
});

// ─── validatePrescription ─────────────────────────────────────────────────────

describe('validatePrescription', () => {
  test('returns no warnings for valid HIPERTROFIA prescription', () => {
    const warnings = validatePrescription(4, 10, 70, 'HIPERTROFIA');
    expect(warnings).toHaveLength(0);
  });

  test('warns when sets below minimum for HIPERTROFIA', () => {
    const warnings = validatePrescription(1, 10, 70, 'HIPERTROFIA');
    expect(warnings.some((w) => w.includes('séries'))).toBe(true);
  });

  test('warns when sets above maximum for FORCA', () => {
    const warnings = validatePrescription(10, 3, 85, 'FORCA');
    expect(warnings.some((w) => w.includes('séries'))).toBe(true);
  });

  test('warns when reps below minimum for RESISTENCIA', () => {
    const warnings = validatePrescription(2, 8, 50, 'RESISTENCIA');
    expect(warnings.some((w) => w.includes('reps'))).toBe(true);
  });

  test('warns when intensity too low for FORCA', () => {
    const warnings = validatePrescription(4, 3, 60, 'FORCA');
    expect(warnings.some((w) => w.includes('Intensidade'))).toBe(true);
  });

  test('warns when intensity too high for RESISTENCIA', () => {
    const warnings = validatePrescription(2, 20, 80, 'RESISTENCIA');
    expect(warnings.some((w) => w.includes('muito alta'))).toBe(true);
  });

  test('skips %RM validation when percentRM is 0', () => {
    const warnings = validatePrescription(4, 10, 0, 'HIPERTROFIA');
    expect(warnings.every((w) => !w.includes('Intensidade') && !w.includes('alta'))).toBe(true);
  });

  test('returns multiple warnings for multiple violations', () => {
    const warnings = validatePrescription(1, 2, 30, 'HIPERTROFIA');
    expect(warnings.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── extractPhaseDefaults ─────────────────────────────────────────────────────

describe('extractPhaseDefaults', () => {
  const phases = [
    { weeks: 4, forca: { series: '3-4', intervalo: '60-90s' } },
    { weeks: 4, forca: { series: '4-5', intervalo: '2-3min' } },
  ];

  test('returns first phase defaults for week 1', () => {
    const result = extractPhaseDefaults(phases, 1);
    expect(result.sets).toEqual({ min: 3, max: 4 });
    expect(result.restBetweenSetsSeconds).toEqual({ min: 60, max: 90 });
  });

  test('returns first phase defaults for week 4', () => {
    const result = extractPhaseDefaults(phases, 4);
    expect(result.sets).toEqual({ min: 3, max: 4 });
  });

  test('returns second phase defaults for week 5', () => {
    const result = extractPhaseDefaults(phases, 5);
    expect(result.sets).toEqual({ min: 4, max: 5 });
    expect(result.restBetweenSetsSeconds).toEqual({ min: 120, max: 180 });
  });

  test('falls back to last phase for week beyond all phases', () => {
    const result = extractPhaseDefaults(phases, 100);
    expect(result.sets).toEqual({ min: 4, max: 5 });
  });

  test('returns empty object for empty phases array', () => {
    const result = extractPhaseDefaults([], 1);
    expect(result).toEqual({});
  });

  test('handles phase without forca field', () => {
    const result = extractPhaseDefaults([{ weeks: 4 }], 1);
    expect(result).toEqual({});
  });

  test('parses single number series string', () => {
    const result = extractPhaseDefaults([{ weeks: 4, forca: { series: '3' } }], 1);
    expect(result.sets).toEqual({ min: 3, max: 3 });
  });

  test('parses interval in minutes correctly', () => {
    const result = extractPhaseDefaults([{ weeks: 4, forca: { intervalo: '2min' } }], 1);
    expect(result.restBetweenSetsSeconds).toEqual({ min: 120, max: 120 });
  });
});
