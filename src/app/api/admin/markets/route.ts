import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const marketSchema = z.object({
  code: z.string(),
  name: z.string(),
  currency: z.string(),
  locale: z.string(),
  is_default: z.boolean().optional()
});

export async function GET() {
  const { data, error } = await supabaseAdmin.from('markets').select('*').order('code', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = marketSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('markets').insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { code, ...rest } = body;
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });
  const parsed = marketSchema.partial().safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { error } = await supabaseAdmin.from('markets').update(parsed.data).eq('code', code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
