import { NextResponse } from 'next/server';
import { getPrinterConfig, updatePrinterConfig } from '@/lib/db';
import type { PrinterConfig } from '@/lib/db';
import { logger } from '@/lib/logger';
import { validatePrinterConfigInput } from '@/lib/validation';

export async function GET() {
    try {
        const config = getPrinterConfig();
        if (!config) {
            const defaultConfig = {
                printer_name: '',
                host: 'localhost',
                port: 631,
                virtual_printing: false
            };
            updatePrinterConfig(defaultConfig);
            return NextResponse.json(defaultConfig);
        }
        return NextResponse.json(config);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to fetch printer configuration', new Error(errorMessage));
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        logger.debug('Received printer config update', { data });
        
        const sanitizedData = {
            printer_name: data.printer_name || '',
            host: data.host || 'localhost',
            port: data.port || 631,
            virtual_printing: Boolean(data.virtual_printing)
        };
        
        logger.debug('Sanitized printer config update', { sanitizedData });
        updatePrinterConfig(sanitizedData);
        
        const updatedConfig = getPrinterConfig();
        logger.debug('Updated printer config', { updatedConfig });
        
        return NextResponse.json(updatedConfig);
    } catch (error) {
        logger.error('Failed to update printer config:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: 'Failed to update printer config' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        validatePrinterConfigInput(data);

        updatePrinterConfig({
            printer_name: data.printer_name || '',
            host: data.host || 'localhost',
            port: data.port || 631,
            virtual_printing: Boolean(data.virtual_printing)
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
    }
} 