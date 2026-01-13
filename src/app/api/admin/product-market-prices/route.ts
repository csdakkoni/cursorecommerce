import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const schema = z.object({
  product_id: z.string().uuid(),
  market_code: z.string(),
  base_price: z.number().nonnegative(),
  sale_price: z.number().nonnegative().nullable().optional(),
  currency: z.string()
});

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product_id');
  const query = supabaseAdmin
    .from('product_market_prices')
    .select('*, market:market_code(name, currency, locale)');
  if (productId) query.eq('product_id', productId);
  const { data, error } = await query.order('market_code', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('product_market_prices').upsert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const parsed = schema.partial().safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { error } = await supabaseAdmin.from('product_market_prices').update(parsed.data).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('product_market_prices').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
