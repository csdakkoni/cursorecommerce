'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconEdit, IconTrash } from '@/components/ui/icons';

interface Props {
  id: string;
  price: number;
  currency: string;
}

export function MarketPriceRowActions({ id, price, currency }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formPrice, setFormPrice] = useState(String(price));
  const [formCurrency, setFormCurrency] = useState(currency);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/product-market-prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          price: parseFloat(formPrice),
          currency: formCurrency,
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
      alert('Error updating price');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this price entry?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/product-market-prices?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
        return;
      }
      
      router.refresh();
    } catch {
      alert('Error deleting price');
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={formCurrency}
          onChange={(e) => setFormCurrency(e.target.value)}
          className="input w-20 text-xs py-1"
          disabled={loading}
        >
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
        <input
          type="number"
          value={formPrice}
          onChange={(e) => setFormPrice(e.target.value)}
          className="input w-24 text-xs py-1"
          disabled={loading}
          step="0.01"
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
