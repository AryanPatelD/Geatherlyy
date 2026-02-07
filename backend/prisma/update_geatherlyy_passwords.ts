import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateGeatherlyyPasswords() {
  console.log('Updating passwords for all @geatherlyy.com email users...');

  const defaultPassword = 'geatherlyy.com';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Find all users with @geatherlyy.com email
  const geatherlyyUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@geatherlyy.com',
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log(`Found ${geatherlyyUsers.length} users with @geatherlyy.com emails`);

  // Update all these users' passwords
  const result = await prisma.user.updateMany({
    where: {
      email: {
        endsWith: '@geatherlyy.com',
      },
    },
    data: {
      password: hashedPassword,
      mustChangePassword: true, // Force password change on next login
    },
  });

  console.log(`Updated ${result.count} user passwords to 'geatherlyy.com'`);

  // List all updated users
  console.log('\nUpdated users:');
  geatherlyyUsers.forEach((user) => {
    console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
  });

  console.log('\nPassword update completed.');
}

updateGeatherlyyPasswords()
  .catch((e) => {
    console.error('Error updating passwords:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
