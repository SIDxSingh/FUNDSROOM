import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/db';

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   Health: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n📴 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
