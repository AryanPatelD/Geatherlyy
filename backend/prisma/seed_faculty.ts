import { PrismaClient, UserRole, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const facultyUsers = [
  { name: 'Aayushi', email: 'aayushi@getherlyy.com' },
  { name: 'AshwinKumar Makwana', email: 'ashwinkumar.makwana@getherlyy.com' },
  { name: 'Asif Thakor', email: 'asif.thakor@getherlyy.com' },
  { name: 'Deep Kothadiya', email: 'deep.kothadiya@getherlyy.com' },
  { name: 'Dhaval Kumar Bhoi', email: 'dhavalkumar.bhoi@getherlyy.com' },
  { name: 'Krunal kumar Maheriya', email: 'krunalkumar.maheriya@getherlyy.com' },
  { name: 'Martin Parmar', email: 'martin.parmar@getherlyy.com' },
  { name: 'Mrugendrasinh Rahevar', email: 'mrugendrasinh.rahevar@getherlyy.com' },
  { name: 'MS', email: 'ms@getherlyy.com' },
  { name: 'Muskan Dave', email: 'muskan.dave@getherlyy.com' },
  { name: 'Nikitaben Bhatt', email: 'nikitaben.bhatt@getherlyy.com' },
  { name: 'Ronakkumar Patel', email: 'ronakkumar.patel@getherlyy.com' },
  { name: 'Ronak R Patel', email: 'ronak.r.patel@getherlyy.com' },
  { name: 'Sarita Thummar', email: 'sarita.thummar@getherlyy.com' },
  { name: 'Vaishali koria', email: 'vaishali.koria@getherlyy.com' },
  { name: 'Parmanad Patel', email: 'parmanad.patel@getherlyy.com' },
];

async function main() {
  console.log('Seeding faculty users...');

  const defaultPassword = 'getherlyy.com';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  for (const user of facultyUsers) {
    const exists = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!exists) {
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password: hashedPassword,
          role: UserRole.FACULTY,
          approvalStatus: ApprovalStatus.APPROVED, // Automatically approved
          profileComplete: false, // FORCE PROFILE COMPLETION
          mustChangePassword: true, // FORCE PASSWORD CHANGE
          department: 'Faculty', // Default department
        },
      });
      console.log(`Created user: ${user.name} (${user.email})`);
    } else {
      console.log(`Updating existing user: ${user.email}`);
      await prisma.user.update({
        where: { email: user.email },
        data: { mustChangePassword: true, role: UserRole.FACULTY, profileComplete: false }
      });
    }
  }

  console.log('Faculty seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
