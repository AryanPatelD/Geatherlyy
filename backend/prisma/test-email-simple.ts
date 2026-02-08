
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ApprovalsService } from '../src/approvals/approvals.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { ApprovalsModule } from '../src/approvals/approvals.module';
import { UsersModule } from '../src/users/users.module';
import { MailerModule } from '../src/common/mailer/mailer.module';
import { PrismaClient, ApprovalStatus, UserRole } from '@prisma/client';

async function main() {
  console.log('Bootstrapping NestJS App Context (Minimal)...');
  try {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        PrismaModule,
        UsersModule,
        MailerModule,
        ApprovalsModule,
      ],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();

    console.log('App initialized.');

    const approvalsService = app.get(ApprovalsService);
    const prisma = app.get(PrismaClient); // Get generic client if possible, or PrismaService

    // 1. Get or Create Faculty
    let faculty = await prisma.user.findFirst({ where: { email: 'test.faculty@getherlyy.com' } });
    if (!faculty) {
        throw new Error('Faculty not found.');
    }

    // 2. Get or Create Member
    let member = await prisma.user.findFirst({ 
        where: { 
            OR: [
                { email: 'test.member@getherlyy.com' },
                { email: 'heetmehta18125@gmail.com' }
            ]
        } 
    });
    
    if (!member) {
         throw new Error('Member not found.');
    }

    // Update email
    console.log('Updating member email to heetmehta18125@gmail.com...');
    member = await prisma.user.update({
        where: { id: member.id },
        data: { email: 'heetmehta18125@gmail.com' }
    });

    // 3. Create a Test Club
    console.log('Creating Test Club...');
    const club = await prisma.club.create({
        data: {
            name: `Test Club ${Date.now()}`,
            description: 'A temporary club for testing emails',
            category: 'Technical',
            approvalStatus: 'APPROVED',
            creator: { connect: { id: faculty.id } },
            convenor: { connect: { id: faculty.id } },
            mentors: { connect: { id: faculty.id } },
            members: {
                create: [
                    { userId: faculty.id },
                    { userId: member.id }
                ]
            }
        }
    });

    // 4. Create Coordinator Request
    console.log('Creating Coordinator Request...');
    const request = await approvalsService.requestCoordinatorRole(member.id, club.id, 'I want to help manage.');
    console.log(`Request created (ID: ${request.id})`);

    // 5. Approve Request
    console.log('Approving Request...');
    await approvalsService.reviewRequest(request.id, faculty.id, ApprovalStatus.APPROVED, false);
    
    console.log('Request approved. CHECK LOGS ABOVE for [NotificationService].');

    await app.close();

  } catch (error) {
    console.error('Error in test script:', error);
    process.exit(1);
  }
}

main();
