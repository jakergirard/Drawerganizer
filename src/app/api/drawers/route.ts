import { NextResponse } from 'next/server';
import { getAllDrawers, createDrawer, getDb, deleteDrawer } from '@/lib/db';
import type { Drawer } from '@/lib/db';

export async function GET() {
    try {
        const drawers = await getAllDrawers();
        return NextResponse.json(drawers);
    } catch (error) {
        console.error('Failed to fetch drawers:', error);
        return NextResponse.json({ error: 'Failed to fetch drawers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const drawer = await request.json() as Drawer;
        await createDrawer(drawer);
        return NextResponse.json(drawer);
    } catch (error) {
        console.error('Failed to create drawer:', error);
        return NextResponse.json({ error: 'Failed to create drawer' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const drawers = await request.json();
        const db = await getDb();
        
        // Delete all existing drawers
        await db.run('DELETE FROM Drawer');
        
        // Create new drawers with the updated data
        for (const drawer of drawers) {
            await db.run(
                'INSERT INTO Drawer (id, size, title, name, positions, isRightSection, keywords, spacing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [drawer.id, drawer.size, drawer.title, drawer.name || null, drawer.positions, drawer.isRightSection ? 1 : 0, drawer.keywords, drawer.spacing]
            );
        }
        
        return NextResponse.json({ success: true, count: drawers.length });
    } catch (error) {
        console.error('Failed to update drawers:', error);
        return NextResponse.json({ error: 'Failed to update drawers' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        await deleteDrawer(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete drawer:', error);
        return NextResponse.json({ error: 'Failed to delete drawer' }, { status: 500 });
    }
}
