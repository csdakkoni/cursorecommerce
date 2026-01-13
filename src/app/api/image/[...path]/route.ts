import { NextRequest, NextResponse } from 'next/server';
import { ImageService, type ImageTransformOptions } from '@/lib/media/image-service';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const search = req.nextUrl.searchParams;
  const filePath = path.join('/');

  const options: ImageTransformOptions = {
    w: search.get('w') ? parseInt(search.get('w')!) : undefined,
    h: search.get('h') ? parseInt(search.get('h')!) : undefined,
    fit: search.get('fit') as any,
    crop: search.get('crop') as any,
    q: search.get('q') ? parseInt(search.get('q')!) : undefined,
    fm: search.get('fm') as any,
    bg: search.get('bg') || undefined,
    ar: search.get('ar') || undefined
  };

  try {
    const { data, contentType } = await ImageService.getOptimizedImage(filePath, options);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Image-Generated': 'self-hosted'
      }
    });
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    console.error('image error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
