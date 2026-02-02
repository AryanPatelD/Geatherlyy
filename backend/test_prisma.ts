import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('--- Testing Prisma Connection ---');
  console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('Connecting...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    // Test a simple query
    // Adjust based on your schema, e.g.
    // const count = await prisma.user.count(); 
    // console.log('User count:', count);
    
    await prisma.$disconnect();
    console.log('Disconnected.');
  } catch (e) {
    console.error('❌ Connection failed:', e);
    process.exit(1);
  }
}

main();
