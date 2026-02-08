import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateGetherlyyPasswords() {
  console.log('Updating passwords for all @getherlyy.com email users...');

  const defaultPassword = 'getherlyy.com';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Find all users with @getherlyy.com email
  const getherlyyUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@getherlyy.com',
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log(`Found ${getherlyyUsers.length} users with @getherlyy.com emails`);

  // Update all these users' passwords
  const result = await prisma.user.updateMany({
    where: {
      email: {
        endsWith: '@getherlyy.com',
      },
    },
    data: {
      password: hashedPassword,
      mustChangePassword: true, // Force password change on next login
    },
  });

  console.log(`Updated ${result.count} user passwords to 'getherlyy.com'`);

  // List all updated users
  console.log('\nUpdated users:');
  getherlyyUsers.forEach((user) => {
    console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
  });

  console.log('\nPassword update completed.');
}

updateGetherlyyPasswords()
  .catch((e) => {
    console.error('Error updating passwords:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
