'use client';

import { useState } from 'react';
import { z } from 'zod';

const schema = z.object({
  market_code: z.string(),
  free_threshold: z.number().nonnegative().default(0),
  flat_cost: z.number().nonnegative().default(0),
  currency: z.string(),
  carrier: z.string().optional()
});

export function ShippingProfileForm({ onSaved }: { onSaved?: () => void }) {
  const [form, setForm] = useState({
    market_code: 'TR',
    free_threshold: 0,
    flat_cost: 0,
    currency: 'TRY',
    carrier: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setError(null);
    const parsed = schema.safeParse({
      ...form,
      free_threshold: Number(form.free_threshold),
      flat_cost: Number(form.flat_cost)
    });
    if (!parsed.success) {
      setError('Alanları kontrol et');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/admin/shipping-profiles', {
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
      <div className="text-sm font-semibold">Shipping Profile</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span>Market</span>
          <select
            className="input"
            value={form.market_code}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                market_code: e.target.value,
                currency: e.target.value === 'TR' ? 'TRY' : 'USD'
              }))
            }
          >
            <option value="TR">TR</option>
            <option value="GLOBAL">GLOBAL</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span>Free Threshold</span>
          <input
            className="input"
            type="number"
            value={form.free_threshold}
            onChange={(e) => setForm((f) => ({ ...f, free_threshold: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Flat Cost</span>
          <input
            className="input"
            type="number"
            value={form.flat_cost}
            onChange={(e) => setForm((f) => ({ ...f, flat_cost: Number(e.target.value) }))}
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
          <span>Carrier</span>
          <input
            className="input"
            value={form.carrier}
            onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
            placeholder="UPS, Local, vb."
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
