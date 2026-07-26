import { NextRequest } from 'next/server';
import sharp from 'sharp';

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);

  if (!match?.[1]) {
    throw new Error('Expected a base64 image data URL.');
  }

  return Buffer.from(match[1], 'base64');
}

function findMaskBounds(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number,
) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * channels;
      const value = Math.max(
        pixels[index] ?? 0,
        pixels[index + 1] ?? 0,
        pixels[index + 2] ?? 0,
      );

      if (value > 16) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      imageDataUrl?: string;
      maskDataUrl?: string;
    };

    if (!body.imageDataUrl || !body.maskDataUrl) {
      return Response.json(
        { error: 'imageDataUrl and maskDataUrl are required.' },
        { status: 400 },
      );
    }

    const imageBuffer = parseDataUrl(body.imageDataUrl);
    const maskBuffer = parseDataUrl(body.maskDataUrl);
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageWidth = imageMetadata.width ?? 0;
    const imageHeight = imageMetadata.height ?? 0;

    if (!imageWidth || !imageHeight) {
      return Response.json({ error: 'Unable to read source image.' }, { status: 400 });
    }

    const { data: maskPixels, info } = await sharp(maskBuffer)
      .resize(imageWidth, imageHeight, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bounds = findMaskBounds(maskPixels, info.width, info.height, info.channels);

    if (!bounds) {
      return Response.json({ error: 'Mask is empty.' }, { status: 400 });
    }

    const alpha = Buffer.alloc(bounds.width * bounds.height);

    for (let y = 0; y < bounds.height; y += 1) {
      for (let x = 0; x < bounds.width; x += 1) {
        const sourceIndex =
          ((bounds.top + y) * info.width + bounds.left + x) * info.channels;
        const value = Math.max(
          maskPixels[sourceIndex] ?? 0,
          maskPixels[sourceIndex + 1] ?? 0,
          maskPixels[sourceIndex + 2] ?? 0,
        );
        alpha[y * bounds.width + x] = value > 16 ? 255 : 0;
      }
    }

    const objectBuffer = await sharp(imageBuffer)
      .extract(bounds)
      .removeAlpha()
      .joinChannel(alpha, {
        raw: {
          width: bounds.width,
          height: bounds.height,
          channels: 1,
        },
      })
      .png()
      .toBuffer();

    return Response.json({
      objectDataUrl: `data:image/png;base64,${objectBuffer.toString('base64')}`,
      bounds,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create object layer.',
      },
      { status: 500 },
    );
  }
}
