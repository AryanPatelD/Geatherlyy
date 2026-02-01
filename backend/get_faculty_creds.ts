
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Try to find an existing FACULTY user
  let faculty = await prisma.user.findFirst({
    where: { role: UserRole.FACULTY }
  });

  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  if (faculty) {
    console.log(`Found existing faculty: ${faculty.email}`);
    // Update password to be sure
    await prisma.user.update({
      where: { id: faculty.id },
      data: { password: hashedPassword }
    });
    console.log(`Updated password for ${faculty.email} to '${password}'`);
  } else {
    // Create new faculty
    faculty = await prisma.user.create({
      data: {
        email: 'faculty@gatherly.com',
        name: 'Faculty Member',
        password: hashedPassword,
        role: UserRole.FACULTY,
        department: 'CSE',
        profileComplete: true,
        approvalStatus: 'APPROVED'
      }
    });
    console.log(`Created new faculty: ${faculty.email} with password '${password}'`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
