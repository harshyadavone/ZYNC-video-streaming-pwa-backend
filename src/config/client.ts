import { PrismaClient } from '@prisma/client';

// Extend the global object to include our prisma instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Type for our exported prisma instance
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// Type for the options of connectWithRetry
interface ConnectWithRetryOptions {
  retries?: number;
  delay?: number;
}

// ConnectWithRetry function with types
const connectWithRetry = async ({ retries = 5, delay = 5000 }: ConnectWithRetryOptions = {}): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('Successfully connected to the database');
      return;
    } catch (err) {
      console.log(`Failed to connect to the database. Retrying in ${delay/1000} seconds...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Unable to connect to the database after multiple retries');
};

// Attempt to connect
connectWithRetry()
  .catch((e: Error) => {
    console.error('Failed to connect to the database:', e);
    process.exit(1);
  });
 
// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Disconnected from the database');
  process.exit(0);
});

export default prisma;