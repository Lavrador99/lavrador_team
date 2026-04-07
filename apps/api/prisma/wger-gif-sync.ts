/**
 * WGER GIF Sync Script
 * --------------------
 * Fetches exercise images from the free WGER API (https://wger.de) and
 * matches them against our exercise database by name.
 *
 * Run with:  npx ts-node -r tsconfig-paths/register prisma/wger-gif-sync.ts
 *
 * Only updates gifUrl if it's currently null (never overwrites your custom URLs).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Portuguese → English exercise name mapping ────────────────────────────
// Covers the most common exercises. Add more as needed.
const PT_TO_EN: Record<string, string[]> = {
  // DOMINANTE JOELHO
  'Agachamento Livre': ['Squat', 'Back Squat', 'Barbell Squat'],
  'Agachamento com Halteres': ['Goblet Squat', 'Dumbbell Squat'],
  'Agachamento Búlgaro': ['Bulgarian Split Squat', 'Split Squat'],
  'Afundo': ['Lunge', 'Forward Lunge'],
  'Afundo Lateral': ['Side Lunge', 'Lateral Lunge'],
  'Leg Press': ['Leg Press'],
  'Extensão de Joelho': ['Leg Extension', 'Knee Extension'],
  'Agachamento Hack': ['Hack Squat'],
  'Pistol Squat': ['Pistol Squat', 'Single Leg Squat'],
  'Step Up': ['Step Up', 'Box Step Up'],
  'Wall Sit': ['Wall Sit'],
  'Agachamento Sumô': ['Sumo Squat'],
  'Leg Extension na Máquina': ['Leg Extension'],
  'Agachamento no Smith': ['Smith Machine Squat'],

  // DOMINANTE ANCA
  'Levantamento Terra': ['Deadlift', 'Conventional Deadlift'],
  'Levantamento Terra Romeno': ['Romanian Deadlift', 'RDL'],
  'Hip Thrust': ['Hip Thrust', 'Barbell Hip Thrust'],
  'Glute Bridge': ['Glute Bridge', 'Hip Bridge'],
  'Stiff Leg Deadlift': ['Stiff Leg Deadlift', 'Straight Leg Deadlift'],
  'Good Morning': ['Good Morning'],
  'Curl de Femoral': ['Leg Curl', 'Hamstring Curl', 'Lying Leg Curl'],
  'Nordic Curl': ['Nordic Curl', 'Nordic Hamstring'],
  'Kettlebell Swing': ['Kettlebell Swing'],
  'Curl de Femoral em Pé': ['Standing Leg Curl'],
  'Curl de Femoral Sentado': ['Seated Leg Curl'],
  'Levantamento Terra Trap Bar': ['Trap Bar Deadlift', 'Hex Bar Deadlift'],
  'Single Leg Romanian Deadlift': ['Single Leg Romanian Deadlift', 'Single-Leg RDL'],
  'Donkey Kick': ['Donkey Kick'],
  'Fire Hydrant': ['Fire Hydrant'],
  'Abdução de Anca no Cabo': ['Cable Hip Abduction'],

  // EMPURRAR HORIZONTAL
  'Supino Plano com Barra': ['Bench Press', 'Barbell Bench Press'],
  'Supino Plano com Halteres': ['Dumbbell Bench Press', 'Dumbbell Fly'],
  'Supino Inclinado com Barra': ['Incline Bench Press', 'Incline Barbell Bench Press'],
  'Supino Inclinado com Halteres': ['Incline Dumbbell Press'],
  'Supino Declinado': ['Decline Bench Press'],
  'Flexão de Braços': ['Push-up', 'Push Up'],
  'Flexão de Braços Diamante': ['Diamond Push-up', 'Close Grip Push-up'],
  'Flexão de Braços Inclinada': ['Incline Push Up', 'Pike Push Up'],
  'Crossover': ['Cable Crossover', 'Cable Fly'],
  'Peck Deck': ['Pec Deck', 'Machine Fly', 'Chest Fly'],
  'Press no Smith': ['Smith Machine Bench Press'],
  'Crucifixo com Halteres': ['Dumbbell Fly', 'Chest Fly'],
  'Flexão de Braços com Apoio Elevado': ['Decline Push Up'],

  // EMPURRAR VERTICAL
  'Desenvolvimento com Barra': ['Overhead Press', 'Military Press', 'Barbell Press'],
  'Desenvolvimento com Halteres': ['Dumbbell Shoulder Press', 'Arnold Press'],
  'Desenvolvimento Arnold': ['Arnold Press'],
  'Elevação Lateral': ['Lateral Raise', 'Side Raise'],
  'Elevação Frontal': ['Front Raise'],
  'Handstand Push Up': ['Handstand Push Up', 'HSPU'],
  'Press Militar': ['Military Press'],
  'Push Press': ['Push Press'],

  // PUXAR HORIZONTAL
  'Remada Curvada com Barra': ['Bent Over Row', 'Barbell Row'],
  'Remada com Halteres': ['Dumbbell Row', 'One Arm Dumbbell Row'],
  'Remada no Cabo': ['Cable Row', 'Seated Cable Row'],
  'Remada na Máquina': ['Machine Row', 'Chest Supported Row'],
  'Remada Invertida': ['Inverted Row', 'Body Row'],
  'Face Pull': ['Face Pull'],
  'Remada com Kettlebell': ['Kettlebell Row'],

  // PUXAR VERTICAL
  'Puxada na Polia': ['Lat Pulldown', 'Pulldown'],
  'Barra Fixa': ['Pull-up', 'Chin-up'],
  'Barra Fixa Supinada': ['Chin-up', 'Supinated Pull-up'],
  'Puxada com Triângulo': ['Close Grip Pulldown'],
  'Puxada Unilateral no Cabo': ['Single Arm Pulldown'],
  'Pullover': ['Pullover', 'Dumbbell Pullover'],

  // CORE
  'Prancha': ['Plank'],
  'Prancha Lateral': ['Side Plank'],
  'Crunch': ['Crunch', 'Abdominal Crunch'],
  'Crunch Bicicleta': ['Bicycle Crunch'],
  'Russian Twist': ['Russian Twist'],
  'Dead Bug': ['Dead Bug'],
  'Bird Dog': ['Bird Dog'],
  'Hollow Body': ['Hollow Body'],
  'Ab Wheel': ['Ab Roller', 'Ab Wheel'],
  'Leg Raise': ['Leg Raise', 'Hanging Leg Raise'],
  'Mountain Climber': ['Mountain Climber'],
  'Pallof Press': ['Pallof Press'],
  'Superman': ['Superman', 'Back Extension'],

  // BÍCEPS / TRÍCEPS
  'Rosca Bíceps com Barra': ['Barbell Curl', 'Bicep Curl'],
  'Rosca Alternada com Halteres': ['Dumbbell Curl', 'Alternating Curl'],
  'Rosca Martelo': ['Hammer Curl'],
  'Rosca Concentrada': ['Concentration Curl'],
  'Rosca Scott': ['Preacher Curl', 'Scott Curl'],
  'Rosca no Cabo': ['Cable Curl'],
  'Tríceps Pulley': ['Tricep Pushdown', 'Triceps Pushdown'],
  'Tríceps Testa': ['Skull Crusher', 'Lying Tricep Extension'],
  'Tríceps Corda': ['Rope Pushdown', 'Tricep Rope Pushdown'],
  'Fundos': ['Dips', 'Tricep Dips', 'Parallel Bar Dips'],
  'Tríceps Francês': ['French Press', 'Overhead Tricep Extension'],
  'Extensão de Tríceps': ['Overhead Tricep Extension'],
  'Extensão de Tríceps no Cabo': ['Cable Overhead Tricep Extension'],

  // OMBROS
  'Rotação Externa de Ombro': ['External Rotation', 'Cable External Rotation'],
  'Pássaro': ['Rear Delt Fly', 'Bent Over Lateral Raise'],
  'Encolhimento de Ombros': ['Shrug', 'Barbell Shrug'],
  'Elevação Lateral com Cabo': ['Cable Lateral Raise'],
  'Press no Cabo': ['Cable Overhead Press'],

  // CARDIO / LOCOMOÇÃO
  'Corrida na Passadeira': ['Treadmill Running', 'Running'],
  'Bicicleta Estacionária': ['Stationary Bike', 'Cycling'],
  'Burpee': ['Burpee'],
  'Jumping Jack': ['Jumping Jack', 'Jumping Jacks'],
  'Jump Squat': ['Jump Squat'],
  'Box Jump': ['Box Jump'],
  'Corda de Saltar': ['Jump Rope', 'Skipping'],

  // PANTURRILHA
  'Elevação de Calcanhar em Pé': ['Standing Calf Raise'],
  'Elevação de Calcanhar Sentado': ['Seated Calf Raise'],
  'Donkey Calf Raise': ['Donkey Calf Raise'],
};

// ─── Normalize string for fuzzy matching ──────────────────────────────────
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '')    // keep only alphanumeric
    .replace(/\s+/g, ' ')
    .trim();
}

// Word overlap score: ratio of shared words
function wordOverlap(a: string, b: string): number {
  const wa = new Set(normalize(a).split(' '));
  const wb = new Set(normalize(b).split(' '));
  let matches = 0;
  for (const w of wa) {
    if (wb.has(w) && w.length > 2) matches++;
  }
  return matches / Math.max(wa.size, wb.size);
}

// ─── WGER API types ────────────────────────────────────────────────────────
interface WgerImage {
  id: number;
  image: string;
  is_main: boolean;
}

interface WgerTranslation {
  id: number;
  name: string;
  language: number; // 2=English, 12=Portuguese (BR)
}

interface WgerExercise {
  id: number;
  translations: WgerTranslation[];
  images: WgerImage[];
}

interface WgerResponse {
  count: number;
  next: string | null;
  results: WgerExercise[];
}

// ─── Fetch all WGER exercises ──────────────────────────────────────────────
async function fetchAllWgerExercises(): Promise<WgerExercise[]> {
  const all: WgerExercise[] = [];
  let url: string | null = 'https://wger.de/api/v2/exerciseinfo/?format=json&limit=100&offset=0';

  console.log('⟳  Fetching exercises from WGER API...');
  let page = 1;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WGER API error: ${res.status}`);
    const data: WgerResponse = await res.json() as WgerResponse;
    all.push(...data.results.filter((e) => e.images.length > 0));
    console.log(`   Page ${page}: ${data.results.length} exercises (${data.results.filter(e => e.images.length > 0).length} with images)`);
    url = data.next;
    page++;
    // Respect rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`✓  Fetched ${all.length} WGER exercises with images\n`);
  return all;
}

// ─── Match WGER exercise to our DB exercise ────────────────────────────────
function findBestWgerMatch(
  ourName: string,
  wgerExercises: WgerExercise[],
): { exercise: WgerExercise; score: number; matchedName: string } | null {
  // 1. Check manual mapping first
  const candidates = PT_TO_EN[ourName] ?? [];

  let bestScore = 0;
  let bestMatch: WgerExercise | null = null;
  let bestMatchedName = '';

  for (const wgerEx of wgerExercises) {
    const allNames = wgerEx.translations.map((t) => t.name);

    for (const wgerName of allNames) {
      // Exact match with candidates
      for (const candidate of candidates) {
        if (normalize(wgerName) === normalize(candidate)) {
          return { exercise: wgerEx, score: 1.0, matchedName: wgerName };
        }
      }

      // Partial word overlap
      const score = wordOverlap(ourName, wgerName);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = wgerEx;
        bestMatchedName = wgerName;
      }

      // Also check against manual mapping candidates
      for (const candidate of candidates) {
        const s = wordOverlap(candidate, wgerName);
        if (s > bestScore) {
          bestScore = s;
          bestMatch = wgerEx;
          bestMatchedName = wgerName;
        }
      }
    }
  }

  if (bestMatch && bestScore >= 0.5) {
    return { exercise: bestMatch, score: bestScore, matchedName: bestMatchedName };
  }
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏋️  WGER GIF Sync\n');

  // Fetch from WGER
  const wgerExercises = await fetchAllWgerExercises();

  // Load our exercises (only those without a gifUrl already set)
  const ourExercises = await prisma.exercise.findMany({
    where: { isActive: true, gifUrl: null },
    orderBy: { name: 'asc' },
  });

  console.log(`📋 Exercises in our DB without gifUrl: ${ourExercises.length}\n`);

  let updated = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const ex of ourExercises) {
    const match = findBestWgerMatch(ex.name, wgerExercises);

    if (!match) {
      unmatched.push(ex.name);
      skipped++;
      continue;
    }

    // Pick the main image, or first available
    const img = match.exercise.images.find((i) => i.is_main) ?? match.exercise.images[0];
    const gifUrl = `https://wger.de${img.image.startsWith('/') ? '' : '/'}${img.image}`;

    await prisma.exercise.update({
      where: { id: ex.id },
      data: { gifUrl },
    });

    console.log(`✓ "${ex.name}" → WGER "${match.matchedName}" (score: ${match.score.toFixed(2)})`);
    updated++;
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  No match: ${skipped}`);

  if (unmatched.length > 0) {
    console.log(`\n📝 Exercises without a WGER match (add videoUrl manually):`);
    unmatched.forEach((name) => console.log(`   - ${name}`));
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
