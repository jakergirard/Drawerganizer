import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to prevent multiple instances
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export async function GET() {
  try {
    const config = await prisma.printerConfig.findUnique({
      where: { id: 'default' }
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to fetch printer config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch printer config' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const config = await prisma.printerConfig.upsert({
      where: { id: 'default' },
      update: {
        cupsServer: data.cupsServer,
        queueName: data.queueName,
        virtualPrinting: data.virtualPrinting
      },
      create: {
        cupsServer: data.cupsServer,
        queueName: data.queueName,
        virtualPrinting: data.virtualPrinting
      }
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to update printer config:', error);
    return NextResponse.json(
      { error: 'Failed to update printer config' },
      { status: 500 }
    );
  }
} 