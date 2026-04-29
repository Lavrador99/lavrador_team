import { SuggestionService } from './suggestion.service';
import { SuggestionRepository } from '../repositories/suggestion.repository';

// ─── getAlternatives unit tests ──────────────────────────────────────────────

describe('SuggestionService.getAlternatives', () => {
  function makePrisma(original: any, candidates: any[]) {
    return {
      exercise: {
        findUnique: jest.fn().mockResolvedValue(original),
        findMany: jest.fn().mockResolvedValue(candidates),
      },
    } as any;
  }

  function makeService(prisma: any) {
    return new SuggestionService(prisma, {} as any, {} as SuggestionRepository);
  }

  it('returns [] when exercise not found', async () => {
    const svc = makeService(makePrisma(null, []));
    expect(await svc.getAlternatives('unknown-id')).toEqual([]);
  });

  it('returns [] when pattern is in avoided patterns for client flags', async () => {
    const original = { id: 'ex1', name: 'Leg Press', pattern: 'DOMINANTE_JOELHO', level: 'INICIANTE', equipment: [] };
    const svc = makeService(makePrisma(original, []));
    // evitar_joelho should avoid DOMINANTE_JOELHO
    expect(await svc.getAlternatives('ex1', ['evitar_joelho'])).toEqual([]);
  });

  it('returns mapped alternatives sorted by score', async () => {
    const original = { id: 'ex1', name: 'Supino', pattern: 'EMPURRAR_HORIZONTAL', level: 'INICIANTE', equipment: [] };
    const candidates = [
      { id: 'ex2', name: 'Flexões', pattern: 'EMPURRAR_HORIZONTAL', primaryMuscles: ['peitoral'], equipment: [], preferenceScores: [{ score: 1.5 }] },
      { id: 'ex3', name: 'Push-up Inclinado', pattern: 'EMPURRAR_HORIZONTAL', primaryMuscles: ['peitoral_superior'], equipment: [], preferenceScores: [{ score: 2.0 }] },
    ];
    const svc = makeService(makePrisma(original, candidates));
    const result = await svc.getAlternatives('ex1', [], 6);
    expect(result).toHaveLength(2);
    // sorted by score desc
    expect(result[0].name).toBe('Push-up Inclinado');
    expect(result[1].name).toBe('Flexões');
    expect(result[0].exerciseId).toBe('ex3');
  });

  it('uses fallback pool when primary candidates are empty', async () => {
    const original = { id: 'ex1', name: 'Supino', pattern: 'EMPURRAR_HORIZONTAL', level: 'AVANCADO', equipment: [] };
    const fallbackCandidates = [
      { id: 'ex5', name: 'Flexões', pattern: 'EMPURRAR_HORIZONTAL', primaryMuscles: ['peitoral'], equipment: [], preferenceScores: [] },
    ];
    const prisma = {
      exercise: {
        findUnique: jest.fn().mockResolvedValue(original),
        findMany: jest.fn()
          .mockResolvedValueOnce([])               // primary (with level filter) → empty
          .mockResolvedValueOnce(fallbackCandidates), // fallback (no level filter)
      },
    } as any;
    const svc = makeService(prisma);
    const result = await svc.getAlternatives('ex1', [], 6);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Flexões');
  });

  it('respects limit parameter', async () => {
    const original = { id: 'ex1', name: 'Supino', pattern: 'EMPURRAR_HORIZONTAL', level: 'INICIANTE', equipment: [] };
    const candidates = Array.from({ length: 10 }, (_, i) => ({
      id: `ex${i + 2}`,
      name: `Alt ${i}`,
      pattern: 'EMPURRAR_HORIZONTAL',
      primaryMuscles: ['peitoral'],
      equipment: [],
      preferenceScores: [{ score: i }],
    }));
    const svc = makeService(makePrisma(original, candidates));
    const result = await svc.getAlternatives('ex1', [], 3);
    expect(result).toHaveLength(3);
  });

  it('uses default score 1.0 when no preference scores', async () => {
    const original = { id: 'ex1', name: 'Supino', pattern: 'EMPURRAR_HORIZONTAL', level: 'INICIANTE', equipment: [] };
    const candidates = [
      { id: 'ex2', name: 'Flexões', pattern: 'EMPURRAR_HORIZONTAL', primaryMuscles: ['peitoral'], equipment: [], preferenceScores: [] },
    ];
    const svc = makeService(makePrisma(original, candidates));
    const [alt] = await svc.getAlternatives('ex1');
    expect(alt.score).toBe(1.0);
  });
});
