'use client';

import { useState } from 'react';

export function ReservationActions({ reservationId }: { reservationId: string }) {
  const [loading, setLoading] = useState<'release' | 'consume' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function call(action: 'release' | 'consume') {
    setLoading(action);
    setError(null);
    setDone(null);
    const res = await fetch(`/api/admin/stock/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservation_id: reservationId })
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Hata');
    } else {
      setDone(action);
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        className="px-2 py-1 rounded border border-amber-400 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
        onClick={() => call('release')}
        disabled={loading !== null}
      >
        {loading === 'release' ? '...' : 'Release'}
      </button>
      <button
        className="px-2 py-1 rounded border border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50"
        onClick={() => call('consume')}
        disabled={loading !== null}
      >
        {loading === 'consume' ? '...' : 'Consume'}
      </button>
      {error && <span className="text-red-600">{error}</span>}
      {done && <span className="text-green-600">ok</span>}
    </div>
  );
}
