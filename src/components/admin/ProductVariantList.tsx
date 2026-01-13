'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { z } from 'zod';

const schema = z.object({
  id: z.string().uuid(),
  sku: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  price_override: z.number().nonnegative().nullable().optional(),
  is_available: z.boolean().optional()
});

export function ProductVariantList({ productId }: { productId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
    setLoading(false);
    if (error) setError(error.message);
    else setVariants(data || []);
  }

  useEffect(() => {
    load();
  }, [productId]);

  async function update(id: string, updates: any) {
    const parsed = schema.partial().safeParse({ id, ...updates });
    if (!parsed.success) {
      setError('Geçersiz alan');
      return;
    }
    const { error } = await supabase.from('product_variants').update(parsed.data).eq('id', id);
    if (error) setError(error.message);
    else load();
  }

  async function remove(id: string) {
    if (!confirm('Silinsin mi?')) return;
    const { error } = await supabase.from('product_variants').delete().eq('id', id);
    if (error) setError(error.message);
    else setVariants((v) => v.filter((x) => x.id !== id));
  }

  if (loading) return <div className="text-sm text-muted-foreground">Varyantlar yükleniyor...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="border rounded p-3 bg-white space-y-2">
      <div className="text-sm font-semibold">Varyantlar</div>
      {variants.length === 0 && <div className="text-xs text-muted-foreground">Varyant yok.</div>}
      <div className="space-y-2">
        {variants.map((v) => (
          <div key={v.id} className="border rounded p-2 text-sm flex flex-col gap-1">
            <div className="flex flex-wrap gap-1">
              {Object.entries(v.option_combination || {}).map(([k, val]) => (
                <span
                  key={k}
                  className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs border border-purple-200"
                >
                  {k}: {val as string}
                </span>
              ))}
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <label className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">SKU</span>
                <input
                  className="input h-8"
                  value={v.sku || ''}
                  onChange={(e) => update(v.id, { sku: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Stock</span>
                <input
                  className="input h-8 w-20"
                  type="number"
                  value={v.stock ?? 0}
                  onChange={(e) => update(v.id, { stock: Number(e.target.value) })}
                />
              </label>
              <label className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Price override</span>
                <input
                  className="input h-8 w-24"
                  type="number"
                  value={v.price_override ?? ''}
                  onChange={(e) =>
                    update(v.id, { price_override: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  placeholder="boş = ürün fiyatı"
                />
              </label>
              <label className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Active</span>
                <input
                  type="checkbox"
                  checked={v.is_available}
                  onChange={(e) => update(v.id, { is_available: e.target.checked })}
                />
              </label>
              <button
                className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                onClick={() => remove(v.id)}
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
