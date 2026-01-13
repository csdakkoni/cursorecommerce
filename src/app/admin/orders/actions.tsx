'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconChevronRight, IconCheck } from '@/components/ui/icons';

const transitions: Record<string, { next: string; label: string; color: string }[]> = {
  new: [],
  paid: [{ next: 'reserved', label: 'Reserve', color: 'btn-primary' }],
  reserved: [{ next: 'production', label: 'Start Production', color: 'btn-warning' }],
  production: [{ next: 'qc', label: 'Send to QC', color: 'btn-warning' }],
  qc: [{ next: 'shipped', label: 'Ship Order', color: 'btn-success' }],
  shipped: [],
  cancelled: [],
  refunded: [],
  payment_failed: [],
};

interface Props {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusActions({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const available = transitions[currentStatus] || [];

  if (available.length === 0) {
    return null;
  }

  const handleTransition = async (nextStatus: string) => {
    setLoading(true);
    setShowMenu(false);
    
    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, new_status: nextStatus }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
        return;
      }
      
      router.refresh();
    } catch {
      alert('Error updating order status');
    } finally {
      setLoading(false);
    }
  };

  // If only one action, show it directly
  if (available.length === 1) {
    const action = available[0];
    return (
      <button
        onClick={() => handleTransition(action.next)}
        disabled={loading}
        className={`btn btn-sm ${action.color}`}
        title={action.label}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <IconChevronRight className="w-3 h-3" />
            <span className="hidden sm:inline">{action.label}</span>
          </>
        )}
      </button>
    );
  }

  // Multiple actions - show dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="btn btn-sm btn-primary"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Actions
            <IconChevronRight className={`w-3 h-3 transition-transform ${showMenu ? 'rotate-90' : ''}`} />
          </>
        )}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[var(--border)] py-1 z-50">
            {available.map((action) => (
              <button
                key={action.next}
                onClick={() => handleTransition(action.next)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-[var(--background)] transition-colors"
              >
                <IconCheck className="w-4 h-4 text-[var(--muted)]" />
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
