import { NextResponse } from 'next/server';
import { getAllDrawers, createDrawer, deleteDrawer, updateAllDrawers } from '@/lib/db';
import type { Drawer } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        const drawers = getAllDrawers();
        logger.debug('GET /api/drawers - Retrieved drawers:', { count: drawers.length, drawers });
        return NextResponse.json(drawers);
    } catch (error) {
        logger.error('Failed to fetch drawers', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: 'Failed to fetch drawers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const drawer = await request.json() as Drawer;
        logger.debug('POST /api/drawers - Received drawer:', { drawer });
        drawer.is_right_section = Boolean(drawer.is_right_section);
        createDrawer(drawer);
        logger.debug('POST /api/drawers - Created drawer successfully');
        return NextResponse.json(drawer);
    } catch (error) {
        logger.error('Failed to create drawer', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: 'Failed to create drawer' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const drawers = await request.json() as Drawer[];
        logger.debug('PUT /api/drawers - Received drawers:', { count: drawers.length, drawers });
        
        const normalizedDrawers = drawers.map(drawer => ({
            id: drawer.id,
            size: drawer.size,
            title: drawer.title,
            name: drawer.name,
            positions: drawer.positions,
            is_right_section: Boolean(drawer.is_right_section),
            keywords: drawer.keywords,
            spacing: drawer.spacing
        }));
        
        logger.debug('PUT /api/drawers - Normalized drawers:', { count: normalizedDrawers.length, normalizedDrawers });
        updateAllDrawers(normalizedDrawers);
        
        // Verify the update
        const updatedDrawers = getAllDrawers();
        logger.debug('PUT /api/drawers - Verification after update:', { count: updatedDrawers.length, updatedDrawers });
        
        return NextResponse.json({ success: true, count: drawers.length });
    } catch (error) {
        logger.error('Failed to update drawers', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: 'Failed to update drawers' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        logger.debug('DELETE /api/drawers - Deleting drawer:', { id });
        deleteDrawer(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Failed to delete drawer', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: 'Failed to delete drawer' }, { status: 500 });
    }
}
