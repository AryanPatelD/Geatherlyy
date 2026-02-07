import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function truncateAllTables() {
  console.log('🗑️  Starting truncation of all tables (except users)...\n');

  try {
    // Run deletions sequentially (no transaction to avoid timeout)
    // Order matters due to foreign key constraints
    // Delete child tables first, then parent tables

    // 1. Delete quiz attempts (depends on quizzes and users)
    const deletedAttempts = await prisma.quizAttempt.deleteMany({});
    console.log(`✅ Deleted ${deletedAttempts.count} quiz attempts`);

    // 2. Delete questions (depends on quizzes)
    const deletedQuestions = await prisma.question.deleteMany({});
    console.log(`✅ Deleted ${deletedQuestions.count} questions`);

    // 3. Delete quizzes (depends on clubs)
    const deletedQuizzes = await prisma.quiz.deleteMany({});
    console.log(`✅ Deleted ${deletedQuizzes.count} quizzes`);

    // 4. Delete activities (depends on clubs)
    const deletedActivities = await prisma.activity.deleteMany({});
    console.log(`✅ Deleted ${deletedActivities.count} activities`);

    // 5. Delete resources (depends on clubs and users)
    const deletedResources = await prisma.resource.deleteMany({});
    console.log(`✅ Deleted ${deletedResources.count} resources`);

    // 6. Delete comments (depends on clubs and users)
    const deletedComments = await prisma.comment.deleteMany({});
    console.log(`✅ Deleted ${deletedComments.count} comments`);

    // 7. Delete club member removal requests (depends on clubs and users)
    const deletedRemovalRequests = await prisma.clubMemberRemovalRequest.deleteMany({});
    console.log(`✅ Deleted ${deletedRemovalRequests.count} removal requests`);

    // 8. Delete approval requests (depends on clubs and users)
    const deletedApprovalRequests = await prisma.approvalRequest.deleteMany({});
    console.log(`✅ Deleted ${deletedApprovalRequests.count} approval requests`);

    // 9. Delete club coordinators (depends on clubs and users)
    const deletedCoordinators = await prisma.clubCoordinator.deleteMany({});
    console.log(`✅ Deleted ${deletedCoordinators.count} club coordinators`);

    // 10. Delete club members (depends on clubs and users)
    const deletedMembers = await prisma.clubMember.deleteMany({});
    console.log(`✅ Deleted ${deletedMembers.count} club members`);

    // 11. Delete clubs (parent table for many relations)
    const deletedClubs = await prisma.club.deleteMany({});
    console.log(`✅ Deleted ${deletedClubs.count} clubs`);

    console.log('\n✅ All tables truncated successfully (users preserved)!');
    
    // Show remaining user count
    const userCount = await prisma.user.count();
    console.log(`📊 Users remaining: ${userCount}`);

  } catch (error) {
    console.error('❌ Error truncating tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

truncateAllTables()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
