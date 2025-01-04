import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getPrinterConfig } from '@/lib/db';
import * as ipp from 'ipp';
import path from 'path';

interface IPPResponse {
  'job-id'?: number;
  [key: string]: any;
}

// Constants for 25x54mm label at 300 DPI
const DPI = 300;
const MM_TO_INCHES = 1 / 25.4;
const LABEL_WIDTH_MM = 54;
const LABEL_HEIGHT_MM = 25;
const LABEL_WIDTH_PIXELS = Math.floor(LABEL_WIDTH_MM * MM_TO_INCHES * DPI);
const LABEL_HEIGHT_PIXELS = Math.floor(LABEL_HEIGHT_MM * MM_TO_INCHES * DPI);

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

    // Create an SVG with centered text
    const lines = text.split('\n').map((line: string) => 
      line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    );
    
    // Calculate the total block height and initial offset
    const lineHeight = 52;
    const totalHeight = (lines.length * lineHeight);
    const initialOffset = -((totalHeight / 2) - (lineHeight / 1.25));

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg width="${LABEL_WIDTH_PIXELS}" height="${LABEL_HEIGHT_PIXELS}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text
          x="50%"
          y="50%"
          font-family="Liberation Sans, Arial, sans-serif"
          font-size="48"
          text-anchor="middle"
          dominant-baseline="middle"
        >
          ${lines.map((line: string, i: number) => 
            `<tspan x="50%" dy="${i === 0 ? initialOffset : lineHeight}">${line}</tspan>`
          ).join('')}
        </text>
      </svg>
    `;

    // Convert SVG to PNG
    const buffer = await sharp(Buffer.from(svg))
      .resize(LABEL_WIDTH_PIXELS, LABEL_HEIGHT_PIXELS)
      .png()
      .toBuffer();

    // If in preview mode and not forcing print
    if (printerConfig.virtual_printing && !force_print) {
      const imageData = 'data:image/png;base64,' + buffer.toString('base64');
      return NextResponse.json({ imageData });
    }

    if (!printerConfig.printer_name) {
      return NextResponse.json(
        { error: 'Printer not configured' },
        { status: 400 }
      );
    }

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