'use client';

import { useState } from 'react';

type Props = {
  id: string;
  free_threshold: number;
  flat_cost: number;
  currency: string;
  carrier: string | null;
};

export function ShippingProfileRowActions({ id, free_threshold, flat_cost, currency, carrier }: Props) {
  const [form, setForm] = useState({
    free_threshold: free_threshold ?? 0,
    flat_cost: flat_cost ?? 0,
    currency: currency ?? 'USD',
    carrier: carrier ?? ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save() {
    setLoading(true);
    setError(null);
    setOk(false);
    const res = await fetch('/api/admin/shipping-profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        free_threshold: Number(form.free_threshold),
        flat_cost: Number(form.flat_cost),
        currency: form.currency,
        carrier: form.carrier
      })
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Hata');
    } else {
      setOk(true);
    }
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      <input
        className="input h-8 w-20"
        type="number"
        value={form.free_threshold}
        onChange={(e) => setForm((f) => ({ ...f, free_threshold: Number(e.target.value) }))}
        title="Free threshold"
      />
      <input
        className="input h-8 w-20"
        type="number"
        value={form.flat_cost}
        onChange={(e) => setForm((f) => ({ ...f, flat_cost: Number(e.target.value) }))}
        title="Flat cost"
      />
      <input
        className="input h-8 w-16"
        value={form.currency}
        onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
        title="Currency"
      />
      <input
        className="input h-8 w-24"
        value={form.carrier}
        onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
        placeholder="Carrier"
      />
      <button
        className="px-2 py-1 rounded bg-black text-white"
        onClick={save}
        disabled={loading}
      >
        {loading ? '...' : 'Kaydet'}
      </button>
      {ok && <span className="text-green-600">OK</span>}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
