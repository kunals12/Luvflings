import { PrismaClient } from '@prisma/client';
import { setTimeout } from 'timers/promises';

const prisma = new PrismaClient();

const maxRetries = 5;
const retryDelay = 5000; // 5 seconds

async function connectWithRetry(retries = 0) {
  try {
    await prisma.$connect();
    // console.log('Connected to the database');
  } catch (error) {
    if (retries < maxRetries) {
      console.log(
        `Failed to connect to the database. Retrying in ${retryDelay / 1000} seconds...`
      );
      await setTimeout(retryDelay);
      await connectWithRetry(retries + 1);
    } else {
      // console.log('Max retries reached. Could not connect to the database');
      process.exit(1);
    }
  }
}

connectWithRetry();

export default prisma;
