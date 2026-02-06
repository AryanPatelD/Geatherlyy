import { PrismaClient, UserRole, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database reset and seeding...');

  const tableNames = [
    'users',
    'approval_requests',
    'clubs',
    'club_members',
    'club_coordinators',
    'activities',
    'quizzes',
    'questions',
    'quiz_attempts',
    'resources',
    'comments',
    'club_member_removal_requests',
  ];

  console.log('Truncating tables...');
  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
      console.log(`Truncated table: ${tableName}`);
    } catch (error) {
      console.warn(`Could not truncate table ${tableName}: ${error.message}`);
    }
  }
  console.log('All tables truncated.');

  const password = 'geatherlyy.com';
  const hashedPassword = await bcrypt.hash(password, 10);

  const facultyMembers = [
    {
      name: 'Test Faculty',
      email: 'test.faculty@geatherlyy.com',
      department: 'Computer Engineering',
    },
    {
      name: 'Mrugrendrasinh Rahevar',
      email: 'mrugrendrasinh.rahevar@geatherlyy.com',
      department: 'Computer Engineering',
    },
    {
      name: 'Martin Parmar',
      email: 'martin.parmar@geatherlyy.com',
      department: 'Computer Engineering',
    },
    {
      name: 'Krunal Maheriya',
      email: 'krunal.maheriya@geatherlyy.com',
      department: 'Computer Engineering',
    },
    {
      name: 'Test Admin',
      email: 'test.admin@geatherlyy.com',
      department: 'Administration',
    },
  ];

  const memberUsers = [
    {
      name: 'Test Member',
      email: 'test.member@geatherlyy.com',
      department: 'Computer Engineering',
    },
  ];

  console.log('Seeding faculty members...');
  for (const faculty of facultyMembers) {
    await prisma.user.create({
      data: {
        email: faculty.email,
        name: faculty.name,
        password: hashedPassword,
        role: faculty.department === 'Administration' ? UserRole.ADMIN : UserRole.FACULTY,
        department: faculty.department,
        profileComplete: true,
        approvalStatus: ApprovalStatus.APPROVED,
      },
    });
    console.log(`Created faculty: ${faculty.name} (${faculty.email})`);
  }

  console.log('Seeding member users...');
  for (const member of memberUsers) {
    await prisma.user.create({
      data: {
        email: member.email,
        name: member.name,
        password: hashedPassword,
        role: UserRole.MEMBER,
        department: member.department,
        profileComplete: true,
        approvalStatus: ApprovalStatus.APPROVED,
      },
    });
    console.log(`Created member: ${member.name} (${member.email})`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
