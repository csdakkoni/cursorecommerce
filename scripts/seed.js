/**
 * Simple seed script for Supabase using service role.
 * Run with: node scripts/seed.js
 * Requires env: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE envs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  console.log('Seeding sample data...');

  // Materials
  const { data: mat, error: matErr } = await supabase
    .from('materials')
    .upsert([
      {
        name: 'Linen White',
        composition: '100% Linen',
        width_cm: 300,
        weight_gsm: 220,
        usable_for: ['curtain', 'tablecloth', 'pillow']
      },
      {
        name: 'Cotton Blend',
        composition: '60% Cotton, 40% Polyester',
        width_cm: 280,
        weight_gsm: 180,
        usable_for: ['curtain', 'pillow']
      }
    ])
    .select();
  if (matErr) {
    console.error(matErr);
    process.exit(1);
  }

  // Products
  const { data: prod, error: prodErr } = await supabase
    .from('products')
    .upsert([
      {
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Linen Sheer Curtain',
        slug: 'linen-sheer-curtain',
        product_type: 'curtain',
        sales_model: 'custom',
        base_material_id: mat[0]?.id,
        is_active: true
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        title: 'Classic Pillow',
        slug: 'classic-pillow',
        product_type: 'pillow',
        sales_model: 'unit',
        is_active: true
      }
    ])
    .select();
  if (prodErr) {
    console.error(prodErr);
    process.exit(1);
  }

  // Pricing rules (unit for pillow)
  await supabase.from('pricing_rules').upsert([
    {
      product_id: prod.find((p) => p.id === '00000000-0000-0000-0000-000000000002')?.id,
      pricing_type: 'unit',
      base_price: 249,
      currency: 'TRY',
      min_quantity: 1,
      step: 1
    }
  ]);

  // Market prices
  await supabase.from('product_market_prices').upsert([
    {
      product_id: '00000000-0000-0000-0000-000000000001',
      market_code: 'TR',
      base_price: 390,
      sale_price: null,
      currency: 'TRY'
    },
    {
      product_id: '00000000-0000-0000-0000-000000000001',
      market_code: 'GLOBAL',
      base_price: 35,
      sale_price: null,
      currency: 'USD'
    },
    {
      product_id: '00000000-0000-0000-0000-000000000002',
      market_code: 'TR',
      base_price: 249,
      sale_price: 199,
      currency: 'TRY'
    },
    {
      product_id: '00000000-0000-0000-0000-000000000002',
      market_code: 'GLOBAL',
      base_price: 25,
      sale_price: 20,
      currency: 'USD'
    }
  ]);

  // Shipping profiles
  await supabase.from('shipping_profiles').upsert([
    { market_code: 'TR', free_threshold: 500, flat_cost: 29.9, currency: 'TRY', carrier: 'Local' },
    { market_code: 'GLOBAL', free_threshold: 100, flat_cost: 9.9, currency: 'USD', carrier: 'UPS' }
  ]);

  console.log('Seed completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
// Basic seed script placeholder; fill as needed.
console.log('Add your Supabase seed logic here (example: insert materials/products).');
