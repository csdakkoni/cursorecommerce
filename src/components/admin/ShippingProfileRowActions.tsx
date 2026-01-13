'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconEdit, IconTrash } from '@/components/ui/icons';

interface Props {
  id: string;
  provider: string;
  baseRate: number;
  perKgRate: number;
}

export function ShippingProfileRowActions({ id, provider, baseRate, perKgRate }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    provider,
    base_rate: String(baseRate),
    per_kg_rate: String(perKgRate),
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shipping-profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          provider: form.provider,
          base_rate: parseFloat(form.base_rate),
          per_kg_rate: parseFloat(form.per_kg_rate),
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update');
        return;
      }
      
      setEditing(false);
      router.refresh();
    } catch {
      alert('Error updating shipping profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this shipping profile?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shipping-profiles?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
        return;
      }
      
      router.refresh();
    } catch {
      alert('Error deleting shipping profile');
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
          className="input w-20 text-xs py-1"
          disabled={loading}
          placeholder="Provider"
        />
        <input
          type="number"
          value={form.base_rate}
          onChange={(e) => setForm({ ...form, base_rate: e.target.value })}
          className="input w-16 text-xs py-1"
          disabled={loading}
          step="0.01"
          placeholder="Base"
        />
        <input
          type="number"
          value={form.per_kg_rate}
          onChange={(e) => setForm({ ...form, per_kg_rate: e.target.value })}
          className="input w-16 text-xs py-1"
          disabled={loading}
          step="0.01"
          placeholder="/kg"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
        >
          {loading ? '...' : 'Save'}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={loading}
          className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setEditing(true)}
        className="btn btn-ghost btn-sm"
        title="Edit"
      >
        <IconEdit className="w-4 h-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="btn btn-ghost btn-sm text-red-500 hover:text-red-600"
        title="Delete"
      >
        <IconTrash className="w-4 h-4" />
      </button>
    </div>
  );
}
