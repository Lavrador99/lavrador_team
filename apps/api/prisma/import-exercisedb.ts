/**
 * import-exercisedb.ts
 * Importa 873 exercícios do repositório yuhonas/free-exercise-db (open source, 180p images).
 *
 * Executar:
 *   cd apps/api && yarn ts-node prisma/import-exercisedb.ts
 */

import { PrismaClient, MovementPattern, Equipment, TrainingLevel } from "@prisma/client";
import * as https from "https";

const prisma = new PrismaClient();
const EXERCISES_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

interface FreeExercise {
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

// ─── Level ───────────────────────────────────────────────────────────────────
function mapLevel(level: string): TrainingLevel {
  if (level === "beginner") return TrainingLevel.INICIANTE;
  if (level === "intermediate") return TrainingLevel.INTERMEDIO;
  return TrainingLevel.AVANCADO; // expert
}

// ─── Equipment ───────────────────────────────────────────────────────────────
function mapEquipment(eq: string | null): Equipment[] {
  const e = (eq ?? "").toLowerCase().trim();
  switch (e) {
    case "barbell":
    case "e-z curl bar":
      return [Equipment.BARRA];
    case "dumbbell":
      return [Equipment.HALTERES];
    case "cable":
      return [Equipment.CABO];
    case "machine":
      return [Equipment.MAQUINAS];
    case "kettlebells":
      return [Equipment.KETTLEBELL];
    case "bands":
      return [Equipment.RESISTANCE_BAND];
    case "foam roll":
      return [Equipment.FOAM_ROLLER];
    case "body only":
    case "":
    default:
      return [Equipment.PESO_CORPORAL];
  }
}

// ─── Pattern (best-effort heuristic) ─────────────────────────────────────────
function guessPattern(ex: FreeExercise): MovementPattern {
  const p = ex.primaryMuscles.join(" ").toLowerCase();
  const cat = (ex.category ?? "").toLowerCase();
  const force = (ex.force ?? "").toLowerCase();

  // Cardio / locomotion
  if (
    cat === "cardio" ||
    cat === "plyometrics" ||
    cat === "strongman" ||
    cat === "olympic weightlifting"
  )
    return MovementPattern.LOCOMOCAO;

  // Core / stability
  if (
    p.includes("abdominal") ||
    p.includes("lower back") ||
    (p.includes("neck") && !p.includes("chest"))
  )
    return MovementPattern.CORE;

  // Stretching / flexibility → core as default
  if (cat === "stretching") return MovementPattern.CORE;

  // Knee-dominant (squat patterns)
  if (p.includes("quadricep")) return MovementPattern.DOMINANTE_JOELHO;

  // Hip-dominant (hinge patterns)
  if (p.includes("glute") || p.includes("hamstring"))
    return MovementPattern.DOMINANTE_ANCA;

  // Horizontal push (chest press, push-up)
  if (p.includes("chest")) return MovementPattern.EMPURRAR_HORIZONTAL;

  // Vertical push (shoulder press, overhead)
  if (p.includes("shoulder") && (force === "push" || !force))
    return MovementPattern.EMPURRAR_VERTICAL;

  // Vertical pull (pulldown, pull-up)
  if (p.includes("lats") && force === "pull")
    return MovementPattern.PUXAR_VERTICAL;
  if (p.includes("lats")) return MovementPattern.PUXAR_VERTICAL;

  // Horizontal pull (row, reverse fly)
  if (
    p.includes("middle back") ||
    p.includes("traps") ||
    (p.includes("bicep") && force === "pull")
  )
    return MovementPattern.PUXAR_HORIZONTAL;

  // Isolated arms — classify by force
  if (p.includes("tricep")) return MovementPattern.EMPURRAR_HORIZONTAL;
  if (p.includes("bicep") || p.includes("forearm"))
    return MovementPattern.PUXAR_HORIZONTAL;

  // Calves / adductors / abductors
  if (
    p.includes("calve") ||
    p.includes("adductor") ||
    p.includes("abductor")
  )
    return MovementPattern.DOMINANTE_JOELHO;

  // Powerlifting fallback
  if (cat === "powerlifting") return MovementPattern.DOMINANTE_JOELHO;

  return MovementPattern.EMPURRAR_HORIZONTAL; // safe default
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────
function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("⬇️  A descarregar exercícios do free-exercise-db...");
  const exercises = await fetchJson<FreeExercise[]>(EXERCISES_URL);
  console.log(`📦 ${exercises.length} exercícios recebidos.`);

  let created = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const gifUrl =
      ex.images.length > 0 ? `${IMAGE_BASE}${ex.images[0]}` : null;

    try {
      await prisma.exercise.upsert({
        where: { name: ex.name },
        update: {
          pattern: guessPattern(ex),
          level: mapLevel(ex.level),
          primaryMuscles: ex.primaryMuscles,
          secondaryMuscles: ex.secondaryMuscles,
          equipment: mapEquipment(ex.equipment),
          gifUrl,
          isActive: true,
        },
        create: {
          name: ex.name,
          pattern: guessPattern(ex),
          level: mapLevel(ex.level),
          primaryMuscles: ex.primaryMuscles,
          secondaryMuscles: ex.secondaryMuscles,
          equipment: mapEquipment(ex.equipment),
          clinicalNotes: [],
          gifUrl,
        },
      });
      created++;
    } catch (e: any) {
      console.warn(`⚠️  Skipped "${ex.name}": ${e.message}`);
      skipped++;
    }
  }

  console.log(`✅ ${created} exercícios importados, ${skipped} ignorados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
