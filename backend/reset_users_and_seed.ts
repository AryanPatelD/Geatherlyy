
import { PrismaClient, UserRole, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Cleaning up database...');

  // Delete in order to satisfy foreign key constraints
  // Tables depending on Club
  await prisma.activity.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.clubMemberRemovalRequest.deleteMany({});
  
  // Pivot tables/Relations
  await prisma.clubMember.deleteMany({});
  await prisma.clubCoordinator.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  
  // Check for implicity many-to-many tables if any, but prisma client doesn't expose deleteMany on them directly usually unless via raw query.
  // However, deleting records usually cascades to implicit join tables.
  
  // Delete Clubs (dependent on User)
  await prisma.club.deleteMany({});

  // Delete Users
  await prisma.user.deleteMany({});

  console.log('✨ Database cleared.');

  console.log('🌱 Seeding fresh Faculty user...');
  
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const faculty = await prisma.user.create({
    data: {
      email: 'faculty@gatherly.com',
      name: 'Dr. Fresh Faculty',
      password: hashedPassword,
      role: UserRole.FACULTY,
      department: 'Computer Science',
      universityId: 'FAC001',
      profileComplete: true,
      approvalStatus: ApprovalStatus.APPROVED,
    }
  });

  console.log('\n✅ Created Faculty User:');
  console.log(`   Email: ${faculty.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ${faculty.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Error resetting database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
