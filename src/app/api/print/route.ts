import { NextResponse } from 'next/server';
import * as ipp from 'ipp';
import { createCanvas } from 'canvas';
import { drawText } from 'canvas-txt';
import { PrintResponse, PrintMessage } from '@/types/print';

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

function renderLabel(text: string): Buffer {
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
  paragraphs.forEach(paragraph => {
    drawText(ctx as unknown as CanvasRenderingContext2D, paragraph, {
      x: MARGIN_PIXELS,
      y: startY,
      width: LABEL_WIDTH_PIXELS - (2 * MARGIN_PIXELS),
      height: FONT_SIZE * LINE_SPACING,
      fontSize: FONT_SIZE,
      font: 'Arial',
      align: 'center',
      vAlign: 'middle',
      lineHeight: LINE_SPACING
    });
    startY += FONT_SIZE * LINE_SPACING;
  });

  return canvas.toBuffer('image/jpeg', { quality: 1.0 });
}

export async function POST(request: Request) {
  const { text, preview, server, queue } = await request.json();

  try {
    const imageBuffer = renderLabel(text);

    if (preview) {
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      return NextResponse.json({ success: true, imageData: base64Image });
    }

    // Print logic
    const printerUrl = `ipp://${server}:631/printers/${queue}`;
    const printer = new ipp.Printer(printerUrl);
    
    const msg: PrintMessage = {
      "operation-attributes-tag": {
        "requesting-user-name": "drawer-system",
        "job-name": "drawer-label",
        "document-format": "image/jpeg",
        "printer-uri": printerUrl,
      },
      "job-attributes-tag": {
        "copies": 1,
        "orientation-requested": 4,
        "print-quality": 5,
      },
      data: imageBuffer
    };

    const response = await new Promise<PrintResponse>((resolve, reject) => {
      (printer.execute as any)("Print-Job", msg, (err: Error | null, res: PrintResponse) => {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' }, 
      { status: 500 }
    );
  }
}