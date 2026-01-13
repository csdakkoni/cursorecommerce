import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const schema = z.object({
  order_id: z.string().uuid(),
  source_company_id: z.string().uuid(), // TR
  target_company_id: z.string().uuid(), // US
  currency: z.string(),
  amount: z.number().nonnegative(),
  vat_rate: z.number().nonnegative().default(0),
  transfer_pricing_basis: z.string().optional()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('intercompany_invoices')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
