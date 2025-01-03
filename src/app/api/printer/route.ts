import { NextResponse } from 'next/server';
import { getPrinterConfig, updatePrinterConfig } from '@/lib/db';
import type { PrinterConfig } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const printerConfigSchema = z.object({
    name: z.string().default('Default Printer'),
    printer_name: z.string(),
    host: z.string(),
    port: z.number().int().min(1).max(65535),
    virtual_printing: z.boolean(),
    type: z.string().default('IPP'),
    config: z.string().default('')
});

type ValidatedPrinterConfig = z.infer<typeof printerConfigSchema>;

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
                'Cache-Control': 'no-store'
            }
        }
    );
};

export async function GET() {
    try {
        const config = getPrinterConfig();
        if (!config) {
            const defaultConfig: ValidatedPrinterConfig = {
                name: 'Default Printer',
                printer_name: '',
                host: '',
                port: 631,
                virtual_printing: false,
                type: 'IPP',
                config: ''
            };
            updatePrinterConfig(defaultConfig);
            return NextResponse.json(defaultConfig);
        }
        return NextResponse.json(config);
    } catch (error) {
        return handleApiError(error, 'Failed to fetch printer configuration');
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        logger.debug('Received printer config update', { data });
        
        // Validate input with defaults
        const validatedConfig = printerConfigSchema.parse({
            name: 'Default Printer',
            type: 'IPP',
            config: '',
            ...data
        });
        
        logger.debug('Validated printer config update', { validatedConfig });
        updatePrinterConfig(validatedConfig);
        
        const updatedConfig = getPrinterConfig();
        logger.debug('Updated printer config', { updatedConfig });
        
        return NextResponse.json(updatedConfig);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid printer configuration', details: error.format() },
                { status: 400 }
            );
        }
        return handleApiError(error, 'Failed to update printer configuration');
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        
        // Validate input with defaults
        const validatedConfig = printerConfigSchema.parse({
            name: 'Default Printer',
            type: 'IPP',
            config: '',
            ...data
        });
        
        updatePrinterConfig(validatedConfig);
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid printer configuration', details: error.format() },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 400 }
        );
    }
} 