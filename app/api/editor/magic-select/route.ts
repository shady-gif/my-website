import { NextRequest } from 'next/server';

const defaultIopaintUrl = 'http://127.0.0.1:18080';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      imageDataUrl?: string;
      clicks?: [number, number, 0 | 1][];
    };

    if (!body.imageDataUrl || !body.clicks?.length) {
      return Response.json(
        { error: 'imageDataUrl and at least one click are required.' },
        { status: 400 },
      );
    }

    const baseUrl = process.env.IOPAINT_URL ?? defaultIopaintUrl;
    const response = await fetch(`${baseUrl}/api/v1/run_plugin_gen_mask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'InteractiveSeg',
        image: body.imageDataUrl,
        clicks: body.clicks,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        {
          error:
            errorText ||
            `IOPaint returned ${response.status}. Is InteractiveSeg enabled?`,
        },
        { status: 502 },
      );
    }

    const mask = await response.arrayBuffer();

    return new Response(mask, {
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `${error.message}. Start IOPaint with InteractiveSeg enabled.`
            : 'Unable to generate magic selection mask.',
      },
      { status: 500 },
    );
  }
}
