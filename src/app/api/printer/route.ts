import { NextResponse } from 'next/server';
import { getPrinterConfig, updatePrinterConfig } from '@/lib/db';
import type { PrinterConfig } from '@/lib/db';

export async function GET() {
    try {
        const config = await getPrinterConfig();
        if (!config) {
            return NextResponse.json({ error: 'Printer config not found' }, { status: 404 });
        }
        return NextResponse.json(config);
    } catch (error) {
        console.error('Failed to fetch printer config:', error);
        return NextResponse.json({ error: 'Failed to fetch printer config' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json() as Partial<PrinterConfig>;
        await updatePrinterConfig(data);
        const updatedConfig = await getPrinterConfig();
        return NextResponse.json(updatedConfig);
    } catch (error) {
        console.error('Failed to update printer config:', error);
        return NextResponse.json({ error: 'Failed to update printer config' }, { status: 500 });
    }
} 