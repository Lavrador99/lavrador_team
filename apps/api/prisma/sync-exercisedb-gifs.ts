/**
 * sync-exercisedb-gifs.ts
 * Sincroniza GIFs animados do ExerciseDB (RapidAPI) para os exercícios locais.
 *
 * Pré-requisitos:
 *   1. Conta no RapidAPI: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
 *   2. Subscrever o plano gratuito (Basic, sem cartão de crédito)
 *   3. Copiar a "X-RapidAPI-Key" da página do endpoint
 *
 * Executar:
 *   RAPIDAPI_KEY=<a_tua_key> yarn db:sync-exercisedb-gifs
 */

import { PrismaClient } from "@prisma/client";
import * as https from "https";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "exercisedb.p.rapidapi.com";
const BATCH_SIZE = 100;
// ExerciseDB v1 tem ~1300 exercícios
const TOTAL_LIMIT = 1500;

interface ExerciseDBEntry {
  id: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
}

function get(path: string): Promise<ExerciseDBEntry[]> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: RAPIDAPI_HOST,
      path,
      method: "GET",
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY!,
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.message) reject(new Error(parsed.message));
          else resolve(parsed);
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

/** Normaliza nome para comparação: lowercase, sem pontuação extra */
function norm(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

async function main() {
  if (!RAPIDAPI_KEY) {
    console.error("❌ Define a variável RAPIDAPI_KEY antes de correr o script.");
    console.error("   Exemplo: RAPIDAPI_KEY=xxxxxxxx yarn db:sync-exercisedb-gifs");
    process.exit(1);
  }

  console.log("📥 A descarregar exercícios do ExerciseDB API...");

  // Fetch all in one go (limit=1500 devolve todos disponíveis)
  let remoteExercises: ExerciseDBEntry[] = [];
  try {
    remoteExercises = await get(`/exercises?limit=${TOTAL_LIMIT}&offset=0`);
    console.log(`📦 ${remoteExercises.length} exercícios recebidos do ExerciseDB.`);
  } catch (err: any) {
    console.error("❌ Erro ao contactar ExerciseDB:", err.message);
    process.exit(1);
  }

  // Construir lookup: nome normalizado → gifUrl
  const gifMap = new Map<string, string>();
  for (const ex of remoteExercises) {
    if (ex.gifUrl) gifMap.set(norm(ex.name), ex.gifUrl);
  }

  // Buscar todos os exercícios locais
  const localExercises = await prisma.exercise.findMany({
    select: { id: true, name: true, gifUrl: true },
  });
  console.log(`🔍 ${localExercises.length} exercícios locais a processar...`);

  let updated = 0;
  let noMatch = 0;

  for (const local of localExercises) {
    const key = norm(local.name);
    const gifUrl = gifMap.get(key);

    if (gifUrl && gifUrl !== local.gifUrl) {
      await prisma.exercise.update({
        where: { id: local.id },
        data: { gifUrl },
      });
      updated++;
    } else if (!gifUrl) {
      noMatch++;
    }
  }

  console.log(`✅ ${updated} GIFs actualizados.`);
  if (noMatch > 0) {
    console.log(`ℹ️  ${noMatch} exercícios sem correspondência no ExerciseDB (nomes diferentes).`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
