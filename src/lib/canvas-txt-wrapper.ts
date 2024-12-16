import type { CanvasRenderingContext2D } from 'canvas';

interface TextOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  font_size: number;
  font: string;
  align: 'left' | 'center' | 'right';
  v_align: 'top' | 'middle' | 'bottom';
  line_height: number;
}

function measure_lines(ctx: CanvasRenderingContext2D, text: string, max_width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current_line = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(current_line + ' ' + word).width;
    if (width < max_width) {
      current_line += ' ' + word;
    } else {
      lines.push(current_line);
      current_line = word;
    }
  }
  lines.push(current_line);
  return lines;
}

export async function draw_text(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: TextOptions
): Promise<void> {
  // Set font
  ctx.font = `${options.font_size}px ${options.font}`;
  
  // Measure and split text into lines
  const lines = measure_lines(ctx, text, options.width);
  const line_height = options.line_height || options.font_size * 1.2;
  const total_height = lines.length * line_height;
  
  // Calculate vertical position
  let y = options.y;
  if (options.v_align === 'middle') {
    y = options.y + (options.height - total_height) / 2;
  } else if (options.v_align === 'bottom') {
    y = options.y + options.height - total_height;
  }
  
  // Draw each line
  lines.forEach((line, i) => {
    let x = options.x;
    const line_width = ctx.measureText(line).width;
    
    if (options.align === 'center') {
      x = options.x + (options.width - line_width) / 2;
    } else if (options.align === 'right') {
      x = options.x + options.width - line_width;
    }
    
    ctx.fillText(line, x, y + i * line_height);
  });
} 