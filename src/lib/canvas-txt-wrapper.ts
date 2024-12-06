import type { CanvasRenderingContext2D } from 'canvas';

interface TextOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  font: string;
  align: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
}

function measureLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export async function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: TextOptions
): Promise<void> {
  // Set font
  ctx.font = `${options.fontSize}px ${options.font}`;
  
  // Measure and split text into lines
  const lines = measureLines(ctx, text, options.width);
  
  // Calculate total height
  const totalHeight = lines.length * options.fontSize * options.lineHeight;
  
  // Calculate starting Y position based on vertical alignment
  let startY = options.y;
  if (options.vAlign === 'middle') {
    startY = options.y + (options.height - totalHeight) / 2;
  } else if (options.vAlign === 'bottom') {
    startY = options.y + options.height - totalHeight;
  }
  
  // Set text alignment
  ctx.textAlign = options.align;
  ctx.textBaseline = 'middle';
  
  // Calculate x position based on alignment
  let x = options.x;
  if (options.align === 'center') {
    x = options.x + options.width / 2;
  } else if (options.align === 'right') {
    x = options.x + options.width;
  }
  
  // Draw each line
  for (let i = 0; i < lines.length; i++) {
    const y = startY + (i + 0.5) * options.fontSize * options.lineHeight;
    ctx.fillText(lines[i], x, y);
  }
} 