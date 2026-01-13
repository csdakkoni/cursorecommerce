'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';

const schema = z.object({
  product_id: z.string().uuid(),
  sewing_cost: z.number().nonnegative().default(0),
  accessory_cost: z.number().nonnegative().default(0),
  wastage_ratio: z.number().nonnegative().default(0),
  fullness_ratio_default: z.number().nonnegative().default(1),
  currency: z.string().default('TRY')
});

export function CustomFormulaForm({ productId, onSaved }: { productId: string; onSaved?: () => void }) {
  const [form, setForm] = useState({
    sewing_cost: 0,
    accessory_cost: 0,
    wastage_ratio: 0,
    fullness_ratio_default: 1,
    currency: 'TRY'
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setError(null);
    const parsed = schema.safeParse({
      ...form,
      product_id: productId,
      sewing_cost: Number(form.sewing_cost),
      accessory_cost: Number(form.accessory_cost),
      wastage_ratio: Number(form.wastage_ratio),
      fullness_ratio_default: Number(form.fullness_ratio_default)
    });
    if (!parsed.success) {
      setError('Alanları kontrol et');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/admin/custom-pricing', {
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
      <div className="text-sm font-semibold">Custom Formula (Curtain)</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span>Sewing</span>
          <input
            className="input"
            type="number"
            value={form.sewing_cost}
            onChange={(e) => setForm((f) => ({ ...f, sewing_cost: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Accessory</span>
          <input
            className="input"
            type="number"
            value={form.accessory_cost}
            onChange={(e) => setForm((f) => ({ ...f, accessory_cost: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Wastage Ratio</span>
          <input
            className="input"
            type="number"
            step="0.01"
            value={form.wastage_ratio}
            onChange={(e) => setForm((f) => ({ ...f, wastage_ratio: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Fullness Default</span>
          <input
            className="input"
            type="number"
            step="0.1"
            value={form.fullness_ratio_default}
            onChange={(e) => setForm((f) => ({ ...f, fullness_ratio_default: Number(e.target.value) }))}
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
