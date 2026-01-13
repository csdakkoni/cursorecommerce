import { NextRequest, NextResponse } from 'next/server';
import { ImageService } from '@/lib/media/image-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const storedPath = await ImageService.uploadOriginal({
      file: buffer,
      fileName: file.name,
      contentType: file.type || 'image/jpeg'
    });

    return NextResponse.json({
      path: storedPath,
      url: `/api/image/${storedPath}`
    });
  } catch (err) {
    console.error('upload error', err);
    return NextResponse.json({ error: 'upload failed' }, { status: 500 });
  }
}
