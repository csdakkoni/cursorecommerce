import sharp from 'sharp';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-anon-key';
const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'cursorecommercebucket';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export type ImageFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
export type ImageCrop = 'entropy' | 'attention' | 'center';
export type ImageFormat = 'avif' | 'webp' | 'jpeg' | 'png';

export interface ImageTransformOptions {
  w?: number;
  h?: number;
  fit?: ImageFit;
  crop?: ImageCrop;
  q?: number;
  fm?: ImageFormat;
  bg?: string;
  ar?: string; // e.g. "4:5"
}

function cacheKey(filePath: string, options: ImageTransformOptions) {
  const hash = crypto
    .createHash('sha256')
    .update(filePath)
    .update(JSON.stringify(options))
    .digest('hex')
    .slice(0, 16);
  const ext = options.fm || 'webp';
  const name = filePath.split('/').pop()?.split('.')[0] || 'img';
  return `cache/${hash}/${name}.${ext}`;
}

export class ImageService {
  static client() {
    return supabase;
  }

  static async getOptimizedImage(
    filePath: string,
    options: ImageTransformOptions
  ): Promise<{ data: Buffer; contentType: string }> {
    const format = options.fm || 'webp';
    const cachePath = cacheKey(filePath, options);

    // Try cache
    const { data: cached, error: cacheErr } = await supabase.storage.from(bucket).download(cachePath);
    if (cached && !cacheErr) {
      return {
        data: Buffer.from(await cached.arrayBuffer()),
        contentType: `image/${format}`
      };
    }

    // Fetch original
    const originalPath = `originals/${filePath}`;
    const { data: original, error: origErr } = await supabase.storage.from(bucket).download(originalPath);
    if (!original || origErr) {
      throw new Error('Original image not found');
    }
    let buffer: Buffer = Buffer.from(await original.arrayBuffer());

    // Aspect ratio compute height if ar + w
    if (options.ar && !options.h && options.w) {
      const [aw, ah] = options.ar.split(':').map(Number);
      if (aw && ah) {
        options.h = Math.round((options.w * ah) / aw);
      }
    }

    let pipeline = sharp(buffer).rotate();
    if (options.w || options.h) {
      pipeline = pipeline.resize(options.w, options.h, {
        fit: options.fit || 'cover',
        position: options.crop === 'center' ? 'centre' : options.crop || 'centre',
        background: options.bg || { r: 0, g: 0, b: 0, alpha: 0 }
      });
    }
    const quality = options.q || 80;
    if (format === 'avif') pipeline = pipeline.avif({ quality });
    else if (format === 'webp') pipeline = pipeline.webp({ quality });
    else if (format === 'jpeg') pipeline = pipeline.jpeg({ quality, progressive: true });
    else if (format === 'png') pipeline = pipeline.png({ compressionLevel: Math.max(0, Math.min(9, Math.floor((100 - quality) / 10))) });

    buffer = await pipeline.toBuffer();

    // Save cache
    await supabase.storage.from(bucket).upload(cachePath, buffer, {
      upsert: true,
      contentType: `image/${format}`,
      cacheControl: '31536000'
    });

    return { data: buffer, contentType: `image/${format}` };
  }

  static async uploadOriginal(opts: { file: Buffer; fileName: string; contentType: string }) {
    const clean = opts.fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const path = `originals/${Date.now()}-${clean}`;
    const processed = await sharp(opts.file).rotate().toBuffer();
    const { error } = await supabase.storage.from(bucket).upload(path, processed, {
      upsert: true,
      contentType: opts.contentType,
      cacheControl: '31536000'
    });
    if (error) throw error;
    return path.replace(/^originals\//, '');
  }
}
