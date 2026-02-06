
import { PrismaClient, UserRole, ApprovalStatus } from '@prisma/client';

const prisma = new PrismaClient();

// minimal mock of the notification/mailer service logic to test the flow conceptually
// in a real integration test we'd import the actual service, but this script checks if the *data* state changes correct
// and we rely on the console logs we added to the service to see if it *tried* to send.
// ideally, we run this script, and because the app is running in dev mode, we might not see the service logs here 
// unless we import the service. 
// However, the `ApprovalsService` is part of the NestJS app context. 
// A standalone script won't use the running NestJS app's services easily without bootstrapping the app.

// BETTER APPROACH for this script:
// Just perform the DB operations that would happen *before* the approval.
// Then we manually call the approval logic if we could, OR we just use this script to SET UP the data
// and then we ask the user to hit the endpoint via curl/browser.
// OR we can bootstrap the NestJS app here.

// Let's try bootstrapping the NestJS app to actually call the service methods.
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ApprovalsService } from '../src/approvals/approvals.service';
import { UsersService } from '../src/users/users.service';
import { ClubsService } from '../src/clubs/clubs.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { ApprovalsModule } from '../src/approvals/approvals.module';
import { UsersModule } from '../src/users/users.module';
import { MailerModule } from '../src/common/mailer/mailer.module';
import { ClubsModule } from '../src/clubs/clubs.module';

async function main() {
  console.log('Bootstrapping NestJS App Context (Specific Modules)...');
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
      PrismaModule,
      UsersModule,
      ApprovalsModule,
      MailerModule,
      ClubsModule // For clubs logic
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const approvalsService = app.get(ApprovalsService);
  const usersService = app.get(UsersService);
  const clubsService = app.get(ClubsService);
  const prismaService = app.get<PrismaClient>(PrismaClient); // Assuming PrismaService provides PrismaClient interface or similar

  console.log('App initialized. Preparing test data...');

  // 1. Get or Create Faculty
  let faculty = await prisma.user.findFirst({ where: { email: 'test.faculty@geatherlyy.com' } });
  if (!faculty) {
      console.error('Faculty not found. Run seed first.');
      process.exit(1);
  }

  // 2. Get or Create Member
  let member = await prisma.user.findFirst({ 
      where: { 
          OR: [
              { email: 'test.member@geatherlyy.com' },
              { email: 'heetmehta18125@gmail.com' }
          ]
      } 
  });
  
  if (!member) {
      console.error('Member not found. Run seed first.');
      process.exit(1);
  }

  // Update email to the one requested by user
  console.log('Updating member email to heetmehta18125@gmail.com...');
  member = await prisma.user.update({
      where: { id: member.id },
      data: { email: 'heetmehta18125@gmail.com' }
  });

  // 3. Create a Test Club
  console.log('Creating Test Club...');
  // We need to bypass the service which expects DTOs and files, maybe just direct DB or carefully mock
  // actually using the service is better to test integration, but `create` expects files.
  // user `prisma` directly for setup to avoid file upload complexity
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
                  { userId: member.id } // Member must be in club usually? or not required for coord request?
              ]
          }
      }
  });
  console.log(`Club created: ${club.name} (ID: ${club.id})`);

  // 4. Create Coordinator Request
  console.log('Creating Coordinator Request...');
  const request = await approvalsService.requestCoordinatorRole(member.id, club.id, 'I want to help manage.');
  console.log(`Request created (ID: ${request.id})`);

  // 5. Approve Request
  console.log('Approving Request...');
  // Faculty approves it (since they are mentor)
  await approvalsService.reviewRequest(request.id, faculty.id, ApprovalStatus.APPROVED, false);
  
  console.log('Request approved. CHECK LOGS ABOVE for [ApprovalsService] and [NotificationService] output.');

  await app.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
