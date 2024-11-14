import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const drawers = await prisma.drawer.findMany();
  return NextResponse.json(drawers);
}

export async function PUT(request: Request) {
  const drawers = await request.json();
  
  // Delete all existing drawers
  await prisma.drawer.deleteMany();
  
  // Create all drawers in batch
  await prisma.drawer.createMany({
    data: drawers
  });
  
  return NextResponse.json({ success: true });
}
