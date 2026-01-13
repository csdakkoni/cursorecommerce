'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  reservationId: string;
}

export function ReservationActions({ reservationId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'release' | 'consume' | null>(null);

  const handleAction = async (action: 'release' | 'consume') => {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/stock/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reservationId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || `Failed to ${action} reservation`);
        return;
      }
      
      router.refresh();
    } catch {
      alert(`Error: Failed to ${action} reservation`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleAction('release')}
        disabled={loading !== null}
        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
        title="Release stock back to inventory"
      >
        {loading === 'release' ? '...' : 'Release'}
      </button>
      <button
        onClick={() => handleAction('consume')}
        disabled={loading !== null}
        className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
        title="Mark as consumed (reduce total stock)"
      >
        {loading === 'consume' ? '...' : 'Consume'}
      </button>
    </div>
  );
}
