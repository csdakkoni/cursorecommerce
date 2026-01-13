import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const variantSchema = z.object({
  product_id: z.string().uuid(),
  option_combination: z.record(z.string(), z.string()), // key: group name, value: option value
  sku: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  price_override: z.number().nonnegative().nullable().optional(),
  is_available: z.boolean().optional()
});

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product_id');
  const query = supabaseAdmin.from('product_variants').select('*');
  if (productId) query.eq('product_id', productId);
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .insert({ ...parsed.data, option_combination: parsed.data.option_combination })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const parsed = variantSchema.partial().safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { error } = await supabaseAdmin.from('product_variants').update(parsed.data).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('product_variants').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
