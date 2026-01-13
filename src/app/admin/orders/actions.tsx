'use client';

import { useState } from 'react';

export function OrderStatusActions({ orderId, current }: { orderId: string; current: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function setStatus(status: string) {
    setLoading(true);
    setErr(null);
    setOk(false);
    const res = await fetch('/api/admin/orders/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, status })
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || 'Hata');
    } else {
      setOk(true);
    }
  }

  return (
    <div className="flex gap-1 text-xs items-center">
      <button
        className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
        disabled={loading}
        onClick={() => setStatus('production')}
      >
        Production
      </button>
      <button
        className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
        disabled={loading}
        onClick={() => setStatus('qc')}
      >
        QC
      </button>
      <button
        className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
        disabled={loading}
        onClick={() => setStatus('shipped')}
      >
        Shipped
      </button>
      {ok && <span className="text-green-600">OK</span>}
      {err && <span className="text-red-600">{err}</span>}
    </div>
  );
}
