// @ts-nocheck
import { PrismaClient, UserRole } from '@prisma/client';
import { QuizzesService } from './src/quizzes/quizzes.service';

// Mock Redis Service (No-op)
class MockRedisService {
  async get(key: string) { return null; }
  async set(key: string, value: any, ttl?: number) { }
  async del(key: string) { }
  async reset() { }
  async getQuizData(key: string) { return null; }
  async setQuizData(key: string, data: any, ttl?: number) { }
  async getLeaderboard(key: string) { return null; }
  async setLeaderboard(key: string, data: any, ttl?: number) { }
}

async function main() {
  console.log('🚀 Starting Quiz Concurrency Load Test (200 Users)...');

  const prisma = new PrismaClient();
  const redis = new MockRedisService();
  const quizzesService = new QuizzesService(prisma, redis);
  
  // 1. Setup
  const timestamp = Date.now();
  const facultyEmail = `faculty_${timestamp}@test.com`;
  
  console.log('📦 1. Setting up Test Environment...');
  
  const faculty = await prisma.user.create({
      data: {
          email: facultyEmail,
          name: 'Faculty LoadTest',
          role: UserRole.FACULTY,
          department: 'CS',
          approvalStatus: 'APPROVED',
          password: 'hash' // Dummy
      }
  });
  
  const club = await prisma.club.create({
      data: {
          name: `LoadTestClub_${timestamp}`,
          description: 'Load Testing Club',
          category: 'Technical',
          approvalStatus: 'APPROVED',
          approvedBy: undefined, 
          createdBy: faculty.id,
          convenorId: faculty.id,
          coordinators: { create: { userId: faculty.id } }
      }
  });
  
  const quiz = await prisma.quiz.create({
      data: {
          clubId: club.id,
          title: 'Concurrency Test Quiz',
          timeLimit: 10,
          totalMarks: 50,
          passingMarks: 20,
          maxAttempts: 5,
          isActive: true,
          questions: {
              create: [
                  { text: 'Q1?', options: ['A', 'B', 'C', 'D'], correctAnswer: ['0'], marks: 10, type: 'MCQ' },
                  { text: 'Q2?', options: ['A', 'B', 'C', 'D'], correctAnswer: ['1'], marks: 10, type: 'MCQ' },
                  { text: 'Q3?', options: ['A', 'B', 'C', 'D'], correctAnswer: ['2'], marks: 10, type: 'MCQ' },
                  { text: 'Q4?', options: ['A', 'B', 'C', 'D'], correctAnswer: ['3'], marks: 10, type: 'MCQ' },
                  { text: 'Q5?', options: ['A', 'B', 'C', 'D'], correctAnswer: ['0'], marks: 10, type: 'MCQ' },
              ]
          }
      },
      include: { questions: true }
  });
  
  console.log(`✅ Environment Ready: Club ${club.id}, Quiz ${quiz.id}`);

  // 2. Create 200 Users
  console.log('👥 2. Creating 200 Dummy Users...');
  const userIds: number[] = [];
  const chunkSize = 50;
  
  for (let i = 0; i < 200; i+=chunkSize) {
      const promises = [];
      for(let j=0; j<chunkSize; j++) {
         promises.push(prisma.user.create({
             data: {
                  email: `user_${timestamp}_${i+j}@test.com`,
                  name: `Test User ${i+j}`,
                  role: UserRole.MEMBER,
                  department: 'CS',
                  approvalStatus: 'APPROVED',
                  memberOfClubs: { create: { clubId: club.id } }
             },
             select: { id: true }
         }));
      }
      const created = await Promise.all(promises);
      created.forEach(u => userIds.push(u.id));
      process.stdout.write('.');
  }
  console.log(`\n✅ Created ${userIds.length} users.`);

  // 3. Execute Load
  console.log('🔥 3. Executing Concurrent Submissions...');
  const payloads = userIds.map(uId => ({
      uId,
      answers: { [quiz.questions[0].id]: 0 } // Just answer Q1
  }));

  const startTime = Date.now();
  const results = await Promise.allSettled(
      payloads.map(p => quizzesService.submitQuizAttempt(quiz.id, p.uId, p.answers))
  );
  const duration = (Date.now() - startTime) / 1000;
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  console.log(`\n📊 RESULTS: ${succeeded}/200 Success in ${duration.toFixed(2)}s`);
  
  // Cleanup
  await prisma.quiz.delete({ where: { id: quiz.id } });
  await prisma.club.delete({ where: { id: club.id } });
  await prisma.user.deleteMany({ where: { email: { contains: `_${timestamp}_` } } });
}

main().catch(console.error);
