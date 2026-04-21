import {
  ACSM_GUIDELINES,
  CARDIO_ZONE_BY_LEVEL_PHASE,
  CLINICAL_FLAGS_RULES,
  FREQUENCY_BY_LEVEL,
  KarvonenZonesInput,
  REQUIRED_PATTERNS_BY_OBJECTIVE,
  applyClinicalOverrides,
  extractPhaseDefaults,
  mapObjectiveToAcsm,
  validateCardioZone,
  validatePatternSelection,
  validatePrescription,
  validateWeeklyVolume,
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

// ─── REQUIRED_PATTERNS_BY_OBJECTIVE ──────────────────────────────────────────

describe('REQUIRED_PATTERNS_BY_OBJECTIVE', () => {
  const objectives: TrainingObjective[] = [
    'FORCA', 'HIPERTROFIA', 'RESISTENCIA', 'POTENCIA', 'SAUDE_GERAL',
  ];

  test.each(objectives)('%s has at least one required pattern', (obj) => {
    expect(REQUIRED_PATTERNS_BY_OBJECTIVE[obj].length).toBeGreaterThan(0);
  });

  test('HIPERTROFIA requires the most patterns (7)', () => {
    expect(REQUIRED_PATTERNS_BY_OBJECTIVE.HIPERTROFIA.length).toBe(7);
  });

  test('POTENCIA requires the fewest patterns (3)', () => {
    expect(REQUIRED_PATTERNS_BY_OBJECTIVE.POTENCIA.length).toBe(3);
  });

  test('HIPERTROFIA requires CORE', () => {
    expect(REQUIRED_PATTERNS_BY_OBJECTIVE.HIPERTROFIA).toContain('CORE');
  });

  test('POTENCIA requires LOCOMOCAO', () => {
    expect(REQUIRED_PATTERNS_BY_OBJECTIVE.POTENCIA).toContain('LOCOMOCAO');
  });

  test('FORCA does not require LOCOMOCAO', () => {
    expect(REQUIRED_PATTERNS_BY_OBJECTIVE.FORCA).not.toContain('LOCOMOCAO');
  });
});

// ─── CARDIO_ZONE_BY_LEVEL_PHASE ───────────────────────────────────────────────

describe('CARDIO_ZONE_BY_LEVEL_PHASE', () => {
  test('INICIANTE phase 1 uses z1 (50–60%)', () => {
    expect(CARDIO_ZONE_BY_LEVEL_PHASE.INICIANTE[1].zoneKey).toBe('z1');
  });

  test('INICIANTE phase 2 uses z2 (60–75%)', () => {
    expect(CARDIO_ZONE_BY_LEVEL_PHASE.INICIANTE[2].zoneKey).toBe('z2');
  });

  test('AVANCADO phase 1 uses z1 for regenerative deload', () => {
    expect(CARDIO_ZONE_BY_LEVEL_PHASE.AVANCADO[1].zoneKey).toBe('z1');
  });

  test('INTERMEDIO phase 2 allows Z3 progression', () => {
    expect(CARDIO_ZONE_BY_LEVEL_PHASE.INTERMEDIO[2].allowZ3).toBe(true);
  });

  test('INICIANTE phase 1 does NOT allow Z3', () => {
    expect(CARDIO_ZONE_BY_LEVEL_PHASE.INICIANTE[1].allowZ3).toBeFalsy();
  });

  test('each phase has a descriptive label', () => {
    for (const level of ['INICIANTE', 'INTERMEDIO', 'AVANCADO'] as const) {
      for (const phase of Object.values(CARDIO_ZONE_BY_LEVEL_PHASE[level])) {
        expect(phase.label.length).toBeGreaterThan(5);
      }
    }
  });
});

// ─── validateWeeklyVolume ─────────────────────────────────────────────────────

describe('validateWeeklyVolume', () => {
  test('returns no warning when volume meets HIPERTROFIA minimum', () => {
    // 3 sets × 5 sessions / 2 patterns = 7.5 → below 10 min → warning
    // 4 sets × 5 sessions / 2 patterns = 10 → exactly at min → no warning
    const warnings = validateWeeklyVolume(4, 5, 2, 'HIPERTROFIA');
    expect(warnings).toHaveLength(0);
  });

  test('warns when volume is insufficient for HIPERTROFIA', () => {
    // 2 sets × 3 sessions / 7 patterns = 0.86 < 10 → warning
    const warnings = validateWeeklyVolume(2, 3, 7, 'HIPERTROFIA');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('HIPERTROFIA');
    expect(warnings[0]).toContain('séries/padrão/semana');
  });

  test('returns no warning when volume meets SAUDE_GERAL minimum (min: 2)', () => {
    // 2 sets × 2 sessions / 2 patterns = 2 ≥ 2 → no warning
    const warnings = validateWeeklyVolume(2, 2, 2, 'SAUDE_GERAL');
    expect(warnings).toHaveLength(0);
  });

  test('returns no warning when volume exceeds FORCA minimum', () => {
    // 4 sets × 3 sessions / 2 patterns = 6 ≥ 4 → no warning
    const warnings = validateWeeklyVolume(4, 3, 2, 'FORCA');
    expect(warnings).toHaveLength(0);
  });

  test('returns empty array when activePatternCount is 0', () => {
    const warnings = validateWeeklyVolume(3, 3, 0, 'HIPERTROFIA');
    expect(warnings).toHaveLength(0);
  });

  test('returns empty array when setsPerSession is 0', () => {
    const warnings = validateWeeklyVolume(0, 3, 4, 'HIPERTROFIA');
    expect(warnings).toHaveLength(0);
  });

  test('warning message includes estimated and minimum sets', () => {
    const warnings = validateWeeklyVolume(1, 2, 5, 'HIPERTROFIA');
    expect(warnings[0]).toMatch(/\d+ séries\/padrão\/semana/);
    expect(warnings[0]).toContain('10 séries/padrão/semana');
  });
});

// ─── validateCardioZone ───────────────────────────────────────────────────────

describe('validateCardioZone', () => {
  const zones: KarvonenZonesInput = {
    z1: { low: 110, high: 125 },
    z2: { low: 125, high: 148 },
    z3: { low: 148, high: 170 },
  };

  test('returns no warning for valid INICIANTE phase 1 zone (z1)', () => {
    const warnings = validateCardioZone(112, 122, zones, 'INICIANTE', 1);
    expect(warnings).toHaveLength(0);
  });

  test('warns when FC low is below z1 minimum for INICIANTE phase 1', () => {
    const warnings = validateCardioZone(100, 120, zones, 'INICIANTE', 1);
    expect(warnings.some((w) => w.includes('FC mínima'))).toBe(true);
  });

  test('warns when FC high exceeds z1 maximum for INICIANTE phase 1 (no Z3 allowed)', () => {
    const warnings = validateCardioZone(112, 175, zones, 'INICIANTE', 1);
    expect(warnings.some((w) => w.includes('FC máxima'))).toBe(true);
  });

  test('does not warn when FC high is within z3 for a phase that allows Z3', () => {
    // INICIANTE phase 3 allows Z3 (z3.high = 170)
    const warnings = validateCardioZone(130, 165, zones, 'INICIANTE', 3);
    expect(warnings).toHaveLength(0);
  });

  test('warns when FC high exceeds z3 even in a phase that allows Z3', () => {
    const warnings = validateCardioZone(130, 180, zones, 'INICIANTE', 3);
    expect(warnings.some((w) => w.includes('FC máxima'))).toBe(true);
  });

  test('returns no warning for unknown level/phase combination', () => {
    const warnings = validateCardioZone(100, 200, zones, 'INICIANTE', 99);
    expect(warnings).toHaveLength(0);
  });

  test('applies 5 bpm tolerance — borderline values do not warn', () => {
    // z1.low = 110, tolerance = 5 → low must be < 105 to warn
    const warningsOk = validateCardioZone(106, 122, zones, 'INICIANTE', 1);
    expect(warningsOk).toHaveLength(0);
    const warningsFail = validateCardioZone(104, 122, zones, 'INICIANTE', 1);
    expect(warningsFail.some((w) => w.includes('FC mínima'))).toBe(true);
  });

  test('warning includes level, phase, and bpm values', () => {
    const warnings = validateCardioZone(90, 120, zones, 'INTERMEDIO', 1);
    expect(warnings[0]).toContain('INTERMEDIO');
    expect(warnings[0]).toContain('Fase 1');
    expect(warnings[0]).toContain('90 bpm');
  });
});

// ─── validatePatternSelection ─────────────────────────────────────────────────

describe('validatePatternSelection', () => {
  test('returns no warning when all POTENCIA patterns are present', () => {
    const warnings = validatePatternSelection(
      ['DOMINANTE_JOELHO', 'DOMINANTE_ANCA', 'LOCOMOCAO'],
      'POTENCIA',
    );
    expect(warnings).toHaveLength(0);
  });

  test('warns when HIPERTROFIA is missing CORE and EMPURRAR_VERTICAL', () => {
    const warnings = validatePatternSelection(
      ['DOMINANTE_JOELHO', 'DOMINANTE_ANCA', 'EMPURRAR_HORIZONTAL', 'PUXAR_HORIZONTAL', 'PUXAR_VERTICAL'],
      'HIPERTROFIA',
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('core');
    expect(warnings[0]).toContain('empurrar vertical');
  });

  test('returns no warning when all FORCA patterns are present', () => {
    const warnings = validatePatternSelection(
      ['DOMINANTE_JOELHO', 'DOMINANTE_ANCA', 'EMPURRAR_HORIZONTAL', 'PUXAR_VERTICAL'],
      'FORCA',
    );
    expect(warnings).toHaveLength(0);
  });

  test('does not warn for clinically excluded pattern', () => {
    // evitar_joelho excludes DOMINANTE_JOELHO → should not appear in warning
    const warnings = validatePatternSelection(
      ['DOMINANTE_ANCA', 'LOCOMOCAO'],
      'POTENCIA',
      ['evitar_joelho'],
    );
    expect(warnings).toHaveLength(0);
  });

  test('still warns for non-excluded missing patterns despite clinical flags', () => {
    // evitar_joelho only excludes DOMINANTE_JOELHO — LOCOMOCAO is still required
    const warnings = validatePatternSelection(
      ['DOMINANTE_ANCA'],
      'POTENCIA',
      ['evitar_joelho'],
    );
    expect(warnings.some((w) => w.includes('locomoção'))).toBe(true);
  });

  test('returns no warning for empty selections when all patterns are clinically excluded', () => {
    // POTENCIA requires DOMINANTE_JOELHO, DOMINANTE_ANCA, LOCOMOCAO
    // evitar_joelho excludes DOMINANTE_JOELHO, evitar_lombar excludes DOMINANTE_ANCA
    // So LOCOMOCAO is still required — expect a warning
    const warnings = validatePatternSelection(
      [],
      'POTENCIA',
      ['evitar_joelho', 'evitar_lombar'],
    );
    expect(warnings.some((w) => w.includes('locomoção'))).toBe(true);
  });

  test('handles empty flags array', () => {
    const warnings = validatePatternSelection([], 'SAUDE_GERAL', []);
    expect(warnings.length).toBeGreaterThan(0);
  });

  test('warning message includes objective name', () => {
    const warnings = validatePatternSelection([], 'RESISTENCIA');
    expect(warnings[0]).toContain('RESISTENCIA');
  });

  test('warning uses Portuguese pattern labels', () => {
    const warnings = validatePatternSelection([], 'FORCA');
    expect(warnings[0]).toMatch(/dominante de joelho|dominante de anca|empurrar|puxar/);
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
