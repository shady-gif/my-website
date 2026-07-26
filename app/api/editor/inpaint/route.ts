import { NextRequest } from 'next/server';

const defaultIopaintUrl = 'http://127.0.0.1:18080';

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

    const baseUrl = process.env.IOPAINT_URL ?? defaultIopaintUrl;
    const response = await fetch(`${baseUrl}/api/v1/inpaint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: body.imageDataUrl,
        mask: body.maskDataUrl,
        hd_strategy: 'Crop',
        hd_strategy_crop_trigger_size: 800,
        hd_strategy_crop_margin: 128,
        hd_strategy_resize_limit: 1280,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        {
          error:
            errorText ||
            `IOPaint returned ${response.status}. Is the LaMa service running?`,
        },
        { status: 502 },
      );
    }

    const image = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') ?? 'image/png';

    return new Response(image, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `${error.message}. Start IOPaint on http://127.0.0.1:18080.`
            : 'Unable to inpaint image.',
      },
      { status: 500 },
    );
  }
}
