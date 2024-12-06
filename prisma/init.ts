import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Run migrations
    console.log('Running migrations...');
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy');
    
    // Check if database is empty
    const drawerCount = await prisma.drawer.count();
    
    if (drawerCount === 0) {
      console.log('Initializing database with default data...');
      // Add any default data here if needed
      // await prisma.drawer.create({ data: {...} });
    } else {
      console.log('Database already contains data.');
    }
    
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 