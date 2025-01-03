import { NextResponse } from 'next/server';
import { createCanvas, registerFont } from 'canvas';
import { draw_text } from '@/lib/canvas-txt-wrapper';
import { getPrinterConfig } from '@/lib/db';
import * as ipp from 'ipp';
import path from 'path';

interface IPPResponse {
  'job-id'?: number;
  [key: string]: any;
}

// Register Arial font
registerFont(path.join(process.cwd(), 'public/fonts/arial.ttf'), { family: 'Arial' });

// Constants for 25x54mm label at 300 DPI
const DPI = 300;
const MM_TO_INCHES = 1 / 25.4;
const LABEL_WIDTH_MM = 54;
const LABEL_HEIGHT_MM = 25;
const LABEL_WIDTH_PIXELS = Math.floor(LABEL_WIDTH_MM * MM_TO_INCHES * DPI);
const LABEL_HEIGHT_PIXELS = Math.floor(LABEL_HEIGHT_MM * MM_TO_INCHES * DPI);
const MARGIN_MM = 2;
const MARGIN_PIXELS = Math.floor(MARGIN_MM * MM_TO_INCHES * DPI);

export async function POST(request: Request) {
  try {
    const { text, force_print } = await request.json();
    const printerConfig = await getPrinterConfig();

    if (!printerConfig) {
      return NextResponse.json(
        { error: 'Printer configuration not found' },
        { status: 400 }
      );
    }

    // Create a canvas for either preview or printing
    const canvas = createCanvas(LABEL_WIDTH_PIXELS, LABEL_HEIGHT_PIXELS);
    const ctx = canvas.getContext('2d');

    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, LABEL_WIDTH_PIXELS, LABEL_HEIGHT_PIXELS);

    // Set text properties
    ctx.fillStyle = 'black';
    await draw_text(ctx, text, {
      x: MARGIN_PIXELS,
      y: MARGIN_PIXELS,
      width: LABEL_WIDTH_PIXELS - (2 * MARGIN_PIXELS),
      height: LABEL_HEIGHT_PIXELS - (2 * MARGIN_PIXELS),
      font_size: 48,
      font: 'Arial',
      align: 'center',
      v_align: 'middle',
      line_height: 1.2
    });

    // If in preview mode and not forcing print
    if (printerConfig.virtual_printing && !force_print) {
      const imageData = canvas.toDataURL();
      return NextResponse.json({ imageData });
    }

    if (!printerConfig.printer_name) {
      return NextResponse.json(
        { error: 'Printer not configured' },
        { status: 400 }
      );
    }

    // Convert canvas to PNG buffer for printing
    const buffer = canvas.toBuffer('image/png');

    // Send print job
    const response = await new Promise<IPPResponse>((resolve, reject) => {
      const printer = new ipp.Printer(`ipp://${printerConfig.host}:${printerConfig.port}/printers/${printerConfig.printer_name}`);
      printer.execute("Print-Job", {
        "operation-attributes-tag": {
          "requesting-user-name": "User",
          "job-name": "Label Print",
          "document-format": "image/png"
        },
        data: buffer
      }, function(err: any, res: IPPResponse) {
        if (err) {
          reject(err);
        } else {
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
    console.error('Print error:', error);
    return NextResponse.json(
      { error: 'Failed to print' },
      { status: 500 }
    );
  }
}