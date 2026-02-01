import { PrismaClient, UserRole, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const password = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@gatherly.com',
      name: 'System Admin',
      role: UserRole.ADMIN,
      department: 'Administration',
    },
    {
      email: 'faculty1@gatherly.com',
      name: 'Dr. John Doe',
      role: UserRole.FACULTY,
      department: 'Computer Science',
    },
    {
      email: 'faculty2@gatherly.com',
      name: 'Prof. Jane Smith',
      role: UserRole.FACULTY,
      department: 'Mechanical Engineering',
    },
    {
      email: 'faculty3@gatherly.com',
      name: 'Dr. Alan Turing',
      role: UserRole.FACULTY,
      department: 'Mathematics',
    },
    {
      email: 'active.coordinator@gatherly.com',
      name: 'Alice Coordinator',
      role: UserRole.COORDINATOR,
      department: 'Computer Science',
    },
    {
        email: 'coding.coordinator@gatherly.com',
        name: 'Bob Coder',
        role: UserRole.COORDINATOR,
        department: 'Information Technology'
    },
    {
      email: 'student1@gatherly.com',
      name: 'Charlie Student',
      role: UserRole.MEMBER,
      department: 'Civil Engineering',
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          ...user,
          password,
          googleId: `g_${user.email}`, // Dummy Google ID
          universityId: `U_${user.email.split('@')[0].toUpperCase()}`,
          year: '4',
          phone: '1234567890',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
          approvalStatus: ApprovalStatus.APPROVED,
        },
      });
      console.log(`✅ Created user: ${user.email}`);
    } else {
        // Update password just in case
        await prisma.user.update({
            where: { email: user.email },
            data: { 
                password,
                role: user.role, // Ensure role matches
                approvalStatus: ApprovalStatus.APPROVED 
            }
        });
        console.log(`🔄 Updated user: ${user.email}`);
    }
  }

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
