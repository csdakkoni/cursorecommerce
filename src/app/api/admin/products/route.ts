import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { productSchema } from '@/lib/validation';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const payload = parsed.data;
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      title: payload.title,
      slug: payload.slug,
      product_type: payload.product_type,
      sales_model: payload.sales_model,
      base_material_id: payload.base_material_id ?? null,
      description: payload.description,
      care_instructions: payload.care_instructions,
      is_active: payload.is_active ?? true,
      has_variants: payload.has_variants ?? false
    })
    .select()
    .single();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const parsed = productSchema.partial().safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from('products')
    .update(parsed.data)
    .eq('id', id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
