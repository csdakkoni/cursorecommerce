import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { materialSchema } from '@/lib/validation';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('materials')
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
  const parsed = materialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const payload = parsed.data;
  const { data, error } = await supabaseAdmin
    .from('materials')
    .insert({
      name: payload.name,
      composition: payload.composition,
      width_cm: payload.width_cm,
      weight_gsm: payload.weight_gsm,
      shrinkage_ratio: payload.shrinkage_ratio,
      supplier: payload.supplier,
      usable_for: payload.usable_for ?? []
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
  const parsed = materialSchema.partial().safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from('materials')
    .update(parsed.data)
    .eq('id', id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
