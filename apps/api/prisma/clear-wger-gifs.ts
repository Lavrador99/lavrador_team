/**
 * Limpa todos os gifUrls que apontem para wger.de
 * (não remove gifUrls dos teus próprios uploads em /uploads/)
 *
 * Run: yarn db:clear-wger-gifs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.exercise.updateMany({
    where: {
      gifUrl: { contains: 'wger.de' },
    },
    data: { gifUrl: null },
  });

  console.log(`✅ Cleared ${result.count} WGER gifUrls`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
