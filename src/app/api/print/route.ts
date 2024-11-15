import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { text, server, queue } = await request.json();

  try {
    // First check if the printer is available
    const checkResponse = await fetch(`http://${server}/printers/${queue}`, {
      method: 'GET',
    });

    if (!checkResponse.ok) {
      throw new Error('Printer not found');
    }

    // Send print job using CUPS lp command via a shell script
    const printResponse = await fetch(`http://${server}/printers/${queue}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'job-name': 'drawer-label',
        'document-format': 'text/plain',
        'document-content': text,
      }).toString(),
    });

    if (!printResponse.ok) {
      const error = await printResponse.text();
      throw new Error(`Print failed: ${error}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Print error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Print failed' 
    }, { status: 500 });
  }
}