'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus } from '@/components/ui/icons';

interface Props {
  groupId: string;
}

export function OptionValueForm({ groupId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    value: '',
    value_en: '',
    hex_color: '',
    price_modifier: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.value.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'value',
          data: {
            option_group_id: groupId,
            value: form.value,
            value_en: form.value_en || undefined,
            hex_color: form.hex_color || undefined,
            price_modifier: form.price_modifier ? parseFloat(form.price_modifier) : undefined,
          },
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to create option value');
        return;
      }
      
      setForm({ value: '', value_en: '', hex_color: '', price_modifier: '' });
      setShowForm(false);
      router.refresh();
    } catch {
      alert('Error creating option value');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1"
      >
        <IconPlus className="w-3 h-3" />
        Add Value
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            type="text"
            className="input text-sm"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="Value (TR)"
            required
          />
        </div>
        <div>
          <input
            type="text"
            className="input text-sm"
            value={form.value_en}
            onChange={(e) => setForm({ ...form, value_en: e.target.value })}
            placeholder="Value (EN)"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.hex_color || '#ffffff'}
            onChange={(e) => setForm({ ...form, hex_color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-[var(--border)]"
          />
          <input
            type="text"
            className="input text-sm flex-1"
            value={form.hex_color}
            onChange={(e) => setForm({ ...form, hex_color: e.target.value })}
            placeholder="#FFFFFF"
          />
        </div>
        <div>
          <input
            type="number"
            className="input text-sm"
            value={form.price_modifier}
            onChange={(e) => setForm({ ...form, price_modifier: e.target.value })}
            placeholder="Price modifier"
            step="0.01"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? '...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="btn btn-secondary btn-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
