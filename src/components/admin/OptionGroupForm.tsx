'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const groupSchema = z.object({
  product_id: z.string(),
  name: z.string().min(1),
  name_en: z.string().optional(),
  type: z.enum(['select', 'radio', 'color_swatch', 'size_grid']).default('select'),
  is_required: z.boolean().default(true),
  affects_price: z.boolean().default(true),
  sort_order: z.number().int().default(0)
});

export function OptionGroupForm({ productId, onAdded }: { productId: string; onAdded?: () => void }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState({
    name: '',
    name_en: '',
    type: 'select',
    is_required: true,
    affects_price: true,
    sort_order: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const parsed = groupSchema.safeParse({ ...form, product_id: productId });
    if (!parsed.success) {
      setError('Eksik veya hatalı alan var');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('product_option_groups').insert(parsed.data);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setForm({
        name: '',
        name_en: '',
        type: 'select',
        is_required: true,
        affects_price: true,
        sort_order: 0
      });
      onAdded?.();
    }
  }

  return (
    <div className="space-y-2 border rounded p-3">
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Grup adı"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          className="input flex-1"
          placeholder="Grup adı EN"
          value={form.name_en}
          onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
        />
      </div>
      <div className="flex gap-2 text-sm">
        <label className="flex items-center gap-1">
          <span>Tip</span>
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="select">Select</option>
            <option value="radio">Radio</option>
            <option value="color_swatch">Color swatch</option>
            <option value="size_grid">Size grid</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-1">
          <input
            type="checkbox"
            checked={form.is_required}
            onChange={(e) => setForm((f) => ({ ...f, is_required: e.target.checked }))}
          />
          <span>Zorunlu</span>
        </label>
        <label className="inline-flex items-center gap-1">
          <input
            type="checkbox"
            checked={form.affects_price}
            onChange={(e) => setForm((f) => ({ ...f, affects_price: e.target.checked }))}
          />
          <span>Fiyat etkiler</span>
        </label>
        <label className="inline-flex items-center gap-1">
          <span>Sıra</span>
          <input
            className="input w-16"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        className="px-3 py-2 bg-black text-white rounded text-sm"
        onClick={submit}
        disabled={loading}
      >
        {loading ? 'Kaydediliyor...' : 'Grup Ekle'}
      </button>
    </div>
  );
}
