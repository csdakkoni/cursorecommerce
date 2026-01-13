import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const schema = z.object({
  order_id: z.string().uuid(),
  invoice_type: z.enum(['retail_tr', 'retail_us', 'export_b2b']),
  vat_rate: z.number().nonnegative().default(0),
  currency: z.string(),
  total: z.number().nonnegative().optional(),
  external_ref: z.string().optional()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { order_id, invoice_type, vat_rate, currency, total, external_ref } = parsed.data;

  // find order and company
  const { data: order, error: oErr } = await supabaseAdmin
    .from('orders')
    .select('id, company_id')
    .eq('id', order_id)
    .single();
  if (oErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      order_id,
      company_id: order.company_id,
      invoice_type,
      vat_rate,
      currency,
      total,
      external_ref,
      status: 'draft'
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
