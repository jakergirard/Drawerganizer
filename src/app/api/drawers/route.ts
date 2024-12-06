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
    const drawers = await prisma.drawer.findMany();
    return NextResponse.json(drawers);
  } catch (error) {
    console.error('Failed to fetch drawers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drawers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const drawer = await prisma.drawer.create({
      data: {
        id: data.id,
        size: data.size,
        title: data.title,
        name: data.name,
        positions: data.positions,
        isRightSection: data.isRightSection,
        keywords: data.keywords,
        spacing: data.spacing
      }
    });
    return NextResponse.json(drawer);
  } catch (error) {
    console.error('Failed to create drawer:', error);
    return NextResponse.json(
      { error: 'Failed to create drawer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const drawers = await request.json();
    
    // Delete all existing drawers
    await prisma.drawer.deleteMany();
    
    // Create new drawers with the updated data
    const createdDrawers = await prisma.drawer.createMany({
      data: drawers.map((drawer: any) => ({
        id: drawer.id,
        size: drawer.size,
        title: drawer.title,
        name: drawer.name || null,
        positions: drawer.positions,
        isRightSection: drawer.isRightSection,
        keywords: drawer.keywords,
        spacing: drawer.spacing
      }))
    });
    
    return NextResponse.json({ success: true, count: createdDrawers.count });
  } catch (error) {
    console.error('Failed to update drawers:', error);
    return NextResponse.json(
      { error: 'Failed to update drawers' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.drawer.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete drawer:', error);
    return NextResponse.json(
      { error: 'Failed to delete drawer' },
      { status: 500 }
    );
  }
}
