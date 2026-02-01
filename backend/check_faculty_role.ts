
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'faculty@gatherly.com' }
  });
  console.log('User Role Check:', user ? `${user.email} is ${user.role}` : 'User not found');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
