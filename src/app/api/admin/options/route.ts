import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const groupSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string().min(1),
  name_en: z.string().optional(),
  type: z.enum(['select', 'radio', 'color_swatch', 'size_grid']).default('select'),
  is_required: z.boolean().default(true),
  affects_price: z.boolean().default(true),
  sort_order: z.number().int().default(0)
});

const valueSchema = z.object({
  option_group_id: z.string().uuid(),
  value: z.string().min(1),
  value_en: z.string().optional(),
  price_modifier: z.number().optional(),
  price_modifier_percent: z.number().optional(),
  sku_suffix: z.string().optional(),
  image: z.string().optional(),
  hex_color: z.string().optional(),
  is_default: z.boolean().optional(),
  is_available: z.boolean().optional(),
  sort_order: z.number().int().optional()
});

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product_id');
  const { data, error } = await supabaseAdmin
    .from('product_option_groups')
    .select('*, values:product_option_values(*)')
    .eq('product_id', productId ?? '')
    .order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'group') {
    const parsed = groupSchema.safeParse(body.data);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('product_option_groups')
      .insert(parsed.data)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }
  if (body.type === 'value') {
    const parsed = valueSchema.safeParse(body.data);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('product_option_values')
      .insert(parsed.data)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }
  return NextResponse.json({ error: 'type must be group or value' }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'group') {
    const { id, ...rest } = body.data || {};
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const parsed = groupSchema.partial().safeParse(rest);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    const { error } = await supabaseAdmin.from('product_option_groups').update(parsed.data).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  if (body.type === 'value') {
    const { id, ...rest } = body.data || {};
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const parsed = valueSchema.partial().safeParse(rest);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    const { error } = await supabaseAdmin.from('product_option_values').update(parsed.data).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'type must be group or value' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'group') {
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabaseAdmin.from('product_option_groups').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  if (body.type === 'value') {
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabaseAdmin.from('product_option_values').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'type must be group or value' }, { status: 400 });
}
