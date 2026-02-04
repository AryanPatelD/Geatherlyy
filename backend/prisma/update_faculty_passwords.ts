import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateFacultyPasswords() {
  console.log('Updating all faculty passwords to "geatherlyy.com"...');

  const defaultPassword = 'geatherlyy.com';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Update all faculty users' passwords
  const result = await prisma.user.updateMany({
    where: {
      role: UserRole.FACULTY,
    },
    data: {
      password: hashedPassword,
      mustChangePassword: true, // Force password change on next login
    },
  });

  console.log(`Updated ${result.count} faculty passwords to 'geatherlyy.com'`);

  // List all updated faculty members
  const facultyUsers = await prisma.user.findMany({
    where: {
      role: UserRole.FACULTY,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log('\nUpdated faculty users:');
  facultyUsers.forEach((user) => {
    console.log(`  - ${user.name} (${user.email})`);
  });

  console.log('\nFaculty password update completed.');
}

updateFacultyPasswords()
  .catch((e) => {
    console.error('Error updating faculty passwords:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
