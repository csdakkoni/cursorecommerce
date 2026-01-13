'use client';

import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const schema = z.object({
  product_id: z.string().uuid(),
  market_code: z.string(),
  base_price: z.number().nonnegative(),
  sale_price: z.number().nonnegative().nullable().optional(),
  currency: z.string()
});

export function MarketPriceForm({ onSaved }: { onSaved?: () => void }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState({
    product_id: '',
    market_code: 'TR',
    base_price: 0,
    sale_price: '',
    currency: 'TRY'
  });
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      const { data, error } = await supabase.from('products').select('id, title').limit(200);
      setLoadingProducts(false);
      if (!error && data) {
        setProducts(data);
        if (!form.product_id && data[0]) {
          setForm((f) => ({
            ...f,
            product_id: data[0].id
          }));
        }
      }
    }
    loadProducts();
  }, [supabase]);

  async function save() {
    setError(null);
    const parsed = schema.safeParse({
      ...form,
      base_price: Number(form.base_price),
      sale_price: form.sale_price === '' ? null : Number(form.sale_price)
    });
    if (!parsed.success) {
      setError('Alanları kontrol et');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/admin/product-market-prices', {
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
      <div className="text-sm font-semibold">Market Price</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span>Product</span>
          {loadingProducts ? (
            <div className="text-xs text-muted-foreground">Yükleniyor...</div>
          ) : (
            <select
              className="input"
              value={form.product_id}
              onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span>Market</span>
          <select
            className="input"
            value={form.market_code}
            onChange={(e) => setForm((f) => ({ ...f, market_code: e.target.value, currency: e.target.value === 'TR' ? 'TRY' : 'USD' }))}
          >
            <option value="TR">TR</option>
            <option value="GLOBAL">GLOBAL</option>
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
          <span>Sale Price</span>
          <input
            className="input"
            type="number"
            value={form.sale_price}
            onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
            placeholder="boş bırakılabilir"
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
