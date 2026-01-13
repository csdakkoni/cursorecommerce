'use client';

import { useState } from 'react';

type Props = {
  id: string;
  base_price: number;
  sale_price: number | null;
  currency: string;
};

export function MarketPriceRowActions({ id, base_price, sale_price, currency }: Props) {
  const [form, setForm] = useState({
    base_price: base_price ?? 0,
    sale_price: sale_price ?? '',
    currency: currency ?? 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save() {
    setLoading(true);
    setError(null);
    setOk(false);
    const res = await fetch('/api/admin/product-market-prices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        base_price: Number(form.base_price),
        sale_price: form.sale_price === '' ? null : Number(form.sale_price),
        currency: form.currency
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
        value={form.base_price}
        onChange={(e) => setForm((f) => ({ ...f, base_price: Number(e.target.value) }))}
        title="Base"
      />
      <input
        className="input h-8 w-20"
        type="number"
        value={form.sale_price as any}
        onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
        placeholder="sale"
        title="Sale"
      />
      <input
        className="input h-8 w-16"
        value={form.currency}
        onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
        title="Currency"
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
