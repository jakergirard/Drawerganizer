import { NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import { drawText } from '@/lib/canvas-txt-wrapper';
import type { PrintResponse } from '@/types/print';
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
  const { text } = await request.json();

  try {
    const imageBuffer = await renderLabel(text);

    // Get printer configuration from database
    const config = await prisma.printerConfig.findUnique({
      where: { id: 'default' }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Printer configuration not found. Please configure printer settings first.' },
        { status: 400 }
      );
    }

    if (config.virtualPrinting) {
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      return NextResponse.json({ success: true, imageData: base64Image });
    }

    // Import IPP dynamically to avoid build issues
    const ipp = await import('ipp');
    
    // Print logic
    const printerUrl = `ipp://${config.cupsServer}:631/printers/${config.queueName}`;
    const printer = new ipp.default.Printer(printerUrl);
    
    const msg = {
      "operation-attributes-tag": {
        "requesting-user-name": "drawer-system",
        "job-name": "drawer-label",
        "document-format": "image/jpeg",
        "printer-uri": printerUrl,
      },
      data: imageBuffer
    };

    const response = await new Promise<PrintResponse>((resolve, reject) => {
      (printer as any).execute("Print-Job", msg, function(err: Error | null, res: PrintResponse) {
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