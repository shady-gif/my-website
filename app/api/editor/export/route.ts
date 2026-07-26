import { NextRequest } from 'next/server';
import sharp from 'sharp';

type ExportFormat = 'png' | 'jpeg' | 'webp';

const formats = new Set<ExportFormat>(['png', 'jpeg', 'webp']);

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);

  if (!match?.[1]) {
    throw new Error('Expected a base64 image data URL.');
  }

  return Buffer.from(match[1], 'base64');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      imageDataUrl?: string;
      width?: number;
      height?: number;
      format?: ExportFormat;
      quality?: number;
    };

    if (!body.imageDataUrl) {
      return Response.json({ error: 'imageDataUrl is required.' }, { status: 400 });
    }

    const width = Math.round(Number(body.width));
    const height = Math.round(Number(body.height));
    const format = body.format && formats.has(body.format) ? body.format : 'png';
    const quality = Math.min(Math.max(Number(body.quality) || 92, 1), 100);

    if (!width || !height || width < 64 || height < 64 || width > 4096 || height > 4096) {
      return Response.json(
        { error: 'width and height must be between 64 and 4096.' },
        { status: 400 },
      );
    }

    let pipeline = sharp(parseDataUrl(body.imageDataUrl))
      .flatten({ background: '#ffffff' })
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      });

    if (format === 'png') {
      pipeline = pipeline.png({ quality });
    }

    if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    }

    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    }

    const buffer = await pipeline.toBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'Content-Disposition': `attachment; filename="design-${width}x${height}.${format}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to export image.',
      },
      { status: 500 },
    );
  }
}
