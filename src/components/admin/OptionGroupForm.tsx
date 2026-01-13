'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus } from '@/components/ui/icons';

interface Props {
  productId: string;
}

export function OptionGroupForm({ productId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'select' as 'select' | 'radio' | 'color_swatch' | 'size_grid',
    affects_price: false,
    is_required: true,
    sort_order: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'group',
          data: {
            product_id: productId,
            name: form.name,
            type: form.type,
            affects_price: form.affects_price,
            is_required: form.is_required,
            sort_order: form.sort_order,
          },
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to create option group');
        return;
      }
      
      setForm({
        name: '',
        type: 'select',
        affects_price: false,
        is_required: true,
        sort_order: 0,
      });
      router.refresh();
    } catch {
      alert('Error creating option group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label className="label">Group Name</label>
        <input
          type="text"
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Color, Size, Fabric Type"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">Type</label>
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'select' | 'radio' | 'color_swatch' | 'size_grid' })}
          >
            <option value="select">Select (Dropdown)</option>
            <option value="color_swatch">Color Swatch</option>
            <option value="size_grid">Size Grid</option>
            <option value="radio">Radio Buttons</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label">Sort Order</label>
          <input
            type="number"
            className="input"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.affects_price}
            onChange={(e) => setForm({ ...form, affects_price: e.target.checked })}
            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)]"
          />
          <span className="text-sm">Affects Price</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_required}
            onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)]"
          />
          <span className="text-sm">Required</span>
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Creating...' : (
          <>
            <IconPlus className="w-4 h-4" />
            Add Group
          </>
        )}
      </button>
    </form>
  );
}
