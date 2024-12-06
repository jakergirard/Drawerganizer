import { NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import { drawText } from '@/lib/canvas-txt-wrapper';
import { getPrinterConfig } from '@/lib/db';
import * as ipp from 'ipp';

// Constants for 25x54mm label at 300 DPI
const DPI = 300;
const MM_TO_INCHES = 1 / 25.4;
const LABEL_WIDTH_MM = 54;
const LABEL_HEIGHT_MM = 25;
const LABEL_WIDTH_PIXELS = Math.floor(LABEL_WIDTH_MM * MM_TO_INCHES * DPI);
const LABEL_HEIGHT_PIXELS = Math.floor(LABEL_HEIGHT_MM * MM_TO_INCHES * DPI);
const MARGIN_MM = 2;
const MARGIN_PIXELS = Math.floor(MARGIN_MM * MM_TO_INCHES * DPI);
const FONT_SIZE = 48;
const LINE_SPACING = 1.2;
const FONT_FAMILY = 'Arial';

interface IPPResponse {
    'job-id'?: number;
    [key: string]: any;
}

async function renderLabel(text: string): Promise<Buffer> {
    const canvas = createCanvas(LABEL_WIDTH_PIXELS, LABEL_HEIGHT_PIXELS);
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, LABEL_WIDTH_PIXELS, LABEL_HEIGHT_PIXELS);

    // Set text color
    ctx.fillStyle = 'black';

    // Split text into paragraphs by newlines
    const paragraphs = text.split('\n');
    const totalHeight = paragraphs.length * FONT_SIZE * LINE_SPACING;
    let startY = (LABEL_HEIGHT_PIXELS - totalHeight) / 2;

    // Draw each paragraph
    for (const paragraph of paragraphs) {
        await drawText(ctx, paragraph, {
            x: MARGIN_PIXELS,
            y: startY,
            width: LABEL_WIDTH_PIXELS - (2 * MARGIN_PIXELS),
            height: FONT_SIZE * LINE_SPACING,
            fontSize: FONT_SIZE,
            font: FONT_FAMILY,
            align: 'center',
            vAlign: 'middle',
            lineHeight: LINE_SPACING
        });
        startY += FONT_SIZE * LINE_SPACING;
    }

    return canvas.toBuffer('image/jpeg', { quality: 1.0 });
}

export async function POST(request: Request) {
    try {
        const { text } = await request.json();
        const imageBuffer = await renderLabel(text);

        // Get printer configuration from database
        const config = await getPrinterConfig();
        
        if (!config) {
            return NextResponse.json(
                { error: 'Printer configuration not found. Please configure printer settings first.' },
                { status: 400 }
            );
        }

        // Handle virtual printing mode
        if (config.virtualPrinting) {
            const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
            return NextResponse.json({ success: true, imageData: base64Image });
        }

        // Print logic
        const printerUrl = `ipp://${config.host}:${config.port}/printers/${config.printerName}`;
        const printer = new ipp.Printer(printerUrl);
        
        const msg = {
            "operation-attributes-tag": {
                "requesting-user-name": "drawer-system",
                "job-name": "drawer-label",
                "document-format": "image/jpeg",
                "printer-uri": printerUrl,
            },
            data: imageBuffer
        };

        const response = await new Promise<IPPResponse>((resolve, reject) => {
            (printer as any).execute("Print-Job", msg, function(err: Error | null, res: IPPResponse) {
                if (err) {
                    console.error('IPP Error:', err);
                    reject(err);
                } else {
                    console.log('Print response:', res);
                    resolve(res);
                }
            });
        });
        
        return NextResponse.json({ 
            success: true, 
            jobId: response?.['job-id'],
            details: response 
        });
    } catch (error) {
        console.error('Operation error:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Operation failed' }, 
            { status: 500 }
        );
    }
}