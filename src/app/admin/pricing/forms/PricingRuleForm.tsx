'use client';

import { useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { z } from 'zod';

const schema = z.object({
  product_id: z.string().uuid(),
  pricing_type: z.enum(['unit', 'meter', 'area', 'custom_formula']),
  base_price: z.number().nonnegative(),
  currency: z.string().default('TRY'),
  min_quantity: z.number().positive().default(1),
  step: z.number().positive().default(1)
});

export function PricingRuleForm({ productId, onSaved }: { productId: string; onSaved?: () => void }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState({
    pricing_type: 'unit',
    base_price: 0,
    currency: 'TRY',
    min_quantity: 1,
    step: 1
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setError(null);
    const parsed = schema.safeParse({ ...form, product_id: productId, base_price: Number(form.base_price) });
    if (!parsed.success) {
      setError('Alanları kontrol et');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/admin/pricing-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Hata');
    } else {
      onSaved?.();
    }
  }

  return (
    <div className="space-y-2 border rounded p-3 bg-white">
      <div className="text-sm font-semibold">Pricing Rule</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span>Pricing Type</span>
          <select
            className="input"
            value={form.pricing_type}
            onChange={(e) => setForm((f) => ({ ...f, pricing_type: e.target.value }))}
          >
            <option value="unit">unit</option>
            <option value="meter">meter</option>
            <option value="area">area</option>
            <option value="custom_formula">custom_formula</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span>Base Price</span>
          <input
            className="input"
            type="number"
            value={form.base_price}
            onChange={(e) => setForm((f) => ({ ...f, base_price: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Currency</span>
          <input
            className="input"
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Min Qty</span>
          <input
            className="input"
            type="number"
            value={form.min_quantity}
            onChange={(e) => setForm((f) => ({ ...f, min_quantity: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Step</span>
          <input
            className="input"
            type="number"
            value={form.step}
            onChange={(e) => setForm((f) => ({ ...f, step: Number(e.target.value) }))}
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        className="px-3 py-2 bg-black text-white rounded text-sm"
        onClick={save}
        disabled={loading}
      >
        {loading ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  );
}
