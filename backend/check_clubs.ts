
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.club.count();
  console.log('Total Clubs:', count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
