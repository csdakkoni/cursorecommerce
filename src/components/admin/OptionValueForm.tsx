'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const valueSchema = z.object({
  option_group_id: z.string(),
  value: z.string().min(1),
  value_en: z.string().optional(),
  price_modifier: z.number().optional(),
  price_modifier_percent: z.number().optional(),
  hex_color: z.string().optional(),
  is_default: z.boolean().optional(),
  is_available: z.boolean().optional(),
  sort_order: z.number().int().optional()
});

export function OptionValueForm({ groupId, onAdded }: { groupId: string; onAdded?: () => void }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState({
    value: '',
    value_en: '',
    price_modifier: 0,
    price_modifier_percent: 0,
    hex_color: '',
    is_default: false,
    is_available: true,
    sort_order: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const parsed = valueSchema.safeParse({ ...form, option_group_id: groupId });
    if (!parsed.success) {
      setError('Eksik veya hatalı alan var');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('product_option_values').insert(parsed.data);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setForm({
        value: '',
        value_en: '',
        price_modifier: 0,
        price_modifier_percent: 0,
        hex_color: '',
        is_default: false,
        is_available: true,
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
          placeholder="Value"
          value={form.value}
          onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
        />
        <input
          className="input flex-1"
          placeholder="Value EN"
          value={form.value_en}
          onChange={(e) => setForm((f) => ({ ...f, value_en: e.target.value }))}
        />
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          type="number"
          placeholder="Price +"
          value={form.price_modifier}
          onChange={(e) => setForm((f) => ({ ...f, price_modifier: Number(e.target.value) }))}
        />
        <input
          className="input"
          type="number"
          placeholder="Price +%"
          value={form.price_modifier_percent}
          onChange={(e) => setForm((f) => ({ ...f, price_modifier_percent: Number(e.target.value) }))}
        />
        <input
          className="input"
          placeholder="#hex"
          value={form.hex_color}
          onChange={(e) => setForm((f) => ({ ...f, hex_color: e.target.value }))}
        />
        <input
          className="input"
          type="number"
          placeholder="Sort"
          value={form.sort_order}
          onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
        />
      </div>
      <div className="flex gap-4 text-sm">
        <label className="inline-flex items-center gap-1">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
          />
          <span>Default</span>
        </label>
        <label className="inline-flex items-center gap-1">
          <input
            type="checkbox"
            checked={form.is_available}
            onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
          />
          <span>Available</span>
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        className="px-3 py-2 bg-black text-white rounded text-sm"
        onClick={submit}
        disabled={loading}
      >
        {loading ? 'Kaydediliyor...' : 'Ekle'}
      </button>
    </div>
  );
}
