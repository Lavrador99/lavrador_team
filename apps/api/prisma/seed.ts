import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { exerciseSeedData } from "./exercises-seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 A correr seed...");

  // ── Admin ──────────────────────────────────────────────────────────────
  const adminEmail = "admin@lavrador.pt";
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash("Admin123!", 12);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: Role.ADMIN },
    });
    console.log(`✅ Admin criado: ${adminEmail} / Admin123!`);
    console.log("⚠️  Alterar a password após o primeiro login!");
  } else {
    console.log("ℹ️  Admin já existe.");
  }

  // ── Cliente André Amaro ──────────────────────────────────────────────
  const clientEmail = "andre.amaro@email.com";
  const existingClientUser = await prisma.user.findUnique({
    where: { email: clientEmail },
  });

  if (!existingClientUser) {
    const passwordHash = await bcrypt.hash("Cliente123!", 12);
    const user = await prisma.user.create({
      data: { email: clientEmail, passwordHash, role: Role.CLIENT },
    });
    await prisma.client.create({
      data: {
        userId: user.id,
        name: "André Amaro",
        // birthDate, phone, notes: adicionar se quiseres
      },
    });
    console.log(`✅ Cliente criado: ${clientEmail} / Cliente123!`);
  } else {
    console.log("ℹ️  Cliente André Amaro já existe.");
  }

  // ── Exercícios — upsert por nome (idempotente) ─────────────────────────
  let created = 0;
  let updated = 0;

  for (const ex of exerciseSeedData) {
    const result = await prisma.exercise.upsert({
      where: { name: ex.name } as any,
      update: {
        pattern: ex.pattern,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        level: ex.level,
        clinicalNotes: ex.clinicalNotes ?? [],
        isActive: true,
      },
      create: {
        name: ex.name,
        pattern: ex.pattern,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        level: ex.level,
        clinicalNotes: ex.clinicalNotes ?? [],
        gifUrl: ex.gifUrl,
      },
    });
    if (result) created++;
  }

  console.log(
    `✅ ${exerciseSeedData.length} exercícios sincronizados (criados/actualizados).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
