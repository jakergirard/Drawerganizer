import { NextResponse } from 'next/server';
import { getDrawer, updateDrawer, deleteDrawer } from '@/lib/db';
import type { Drawer } from '@/lib/db';

interface RouteParams {
    params: { id: string }
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const drawer = await getDrawer(params.id);
        if (!drawer) {
            return NextResponse.json({ error: 'Drawer not found' }, { status: 404 });
        }
        return NextResponse.json(drawer);
    } catch (error) {
        console.error('Failed to fetch drawer:', error);
        return NextResponse.json({ error: 'Failed to fetch drawer' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const data = await request.json() as Partial<Drawer>;
        await updateDrawer(params.id, data);
        const updatedDrawer = await getDrawer(params.id);
        return NextResponse.json(updatedDrawer);
    } catch (error) {
        console.error('Failed to update drawer:', error);
        return NextResponse.json({ error: 'Failed to update drawer' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        await deleteDrawer(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete drawer:', error);
        return NextResponse.json({ error: 'Failed to delete drawer' }, { status: 500 });
    }
} 