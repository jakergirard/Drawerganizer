import { NextResponse } from 'next/server';
import { getAllDrawers, createDrawer, deleteDrawer, updateAllDrawers } from '@/lib/db';
import type { Drawer } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const drawerSchema = z.object({
    id: z.string().min(1),
    size: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
    title: z.string().min(1),
    name: z.string().nullable(),
    positions: z.string(),
    is_right_section: z.boolean(),
    keywords: z.string(),
    spacing: z.number().int().min(0)
});

const drawersArraySchema = z.array(drawerSchema);

type ValidatedDrawer = z.infer<typeof drawerSchema>;
type ValidatedDrawerArray = z.infer<typeof drawersArraySchema>;

// Error handler utility
const handleApiError = (error: unknown, message: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(message, new Error(errorMessage));
    return NextResponse.json(
        { error: message }, 
        { 
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        }
    );
};

export async function GET() {
    try {
        const drawers = getAllDrawers();
        logger.debug('GET /api/drawers - Retrieved drawers:', { count: drawers.length });
        
        // Cache for 1 second to prevent multiple identical requests
        return new NextResponse(JSON.stringify(drawers), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=1',
                'Surrogate-Control': 'public, max-age=1'
            }
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch drawers');
    }
}

export async function POST(request: Request) {
    try {
        const drawer = await request.json();
        logger.debug('POST /api/drawers - Received drawer:', { drawer });
        
        // Validate input
        const validatedDrawer = drawerSchema.parse(drawer);
        
        createDrawer(validatedDrawer);
        logger.debug('POST /api/drawers - Created drawer successfully');
        
        return NextResponse.json(validatedDrawer, {
            status: 201,
            headers: {
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid drawer data', details: error.format() },
                { status: 400 }
            );
        }
        return handleApiError(error, 'Failed to create drawer');
    }
}

export async function PUT(request: Request) {
    try {
        const drawers = await request.json();
        logger.debug('PUT /api/drawers - Received drawers:', { count: drawers.length });
        
        // Validate input
        const validatedDrawers = drawersArraySchema.parse(drawers) as ValidatedDrawerArray;
        
        const normalizedDrawers = validatedDrawers.map((drawer: ValidatedDrawer) => ({
            id: drawer.id,
            size: drawer.size,
            title: drawer.title,
            name: drawer.name,
            positions: drawer.positions,
            is_right_section: drawer.is_right_section,
            keywords: drawer.keywords,
            spacing: drawer.spacing
        }));
        
        logger.debug('PUT /api/drawers - Normalized drawers:', { count: normalizedDrawers.length, normalizedDrawers });
        updateAllDrawers(normalizedDrawers);
        
        // Verify the update
        const updatedDrawers = getAllDrawers();
        logger.debug('PUT /api/drawers - Update successful:', { count: updatedDrawers.length });
        
        return NextResponse.json(
            { success: true, count: normalizedDrawers.length },
            { 
                headers: {
                    'Cache-Control': 'no-store'
                }
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid drawers data', details: error.format() },
                { status: 400 }
            );
        }
        return handleApiError(error, 'Failed to update drawers');
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        
        // Validate input
        const { id } = z.object({ id: z.string().min(1) }).parse(body);
        
        logger.debug('DELETE /api/drawers - Deleting drawer:', { id });
        deleteDrawer(id);
        
        return NextResponse.json(
            { success: true },
            { 
                headers: {
                    'Cache-Control': 'no-store'
                }
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid drawer ID', details: error.format() },
                { status: 400 }
            );
        }
        return handleApiError(error, 'Failed to delete drawer');
    }
}
