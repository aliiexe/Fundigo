// File: apps/web/components/AllocationWidget.tsx
import { useState, useCallback } from 'react';

type Allocation = { spend: number; save: number; invest: number; keep?: number };

const defaultAllocation: Allocation = { spend: 50, save: 25, invest: 20, keep: 5 };

export function AllocationWidget() {
  const [amount, setAmount] = useState<string>('100');
  const [allocation, setAllocation] = useState<Allocation>(defaultAllocation);
  const [suggested, setSuggested] = useState<Allocation | null>(null);
  const [suggestedAllocationId, setSuggestedAllocationId] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getSuggestions = useCallback(async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/allocations/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggested(data.suggested ?? null);
        setSuggestedAllocationId(data.id ?? null);
        setReasoning(data.reasoning ?? '');
        if (data.suggested) setAllocation(data.suggested);
      }
    } finally {
      setLoading(false);
    }
  }, [amount]);

  const acceptAllocation = useCallback(async () => {
    if (!suggestedAllocationId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/allocations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocation_id: suggestedAllocationId }),
      });
      if (res.ok) {
        setSuggested(null);
        setSuggestedAllocationId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [suggestedAllocationId]);

  const total = allocation.spend + allocation.save + allocation.invest + (allocation.keep ?? 0);
  const normalized = total === 0 ? defaultAllocation : {
    spend: Math.round((allocation.spend / total) * 100),
    save: Math.round((allocation.save / total) * 100),
    invest: Math.round((allocation.invest / total) * 100),
    keep: Math.round(((allocation.keep ?? 0) / total) * 100),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-text-muted text-sm">Amount ($)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className="mt-1 block w-32 rounded-input border border-gray-300 px-4 py-2 text-text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount for allocation"
          />
        </label>
        <button
          type="button"
          onClick={getSuggestions}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-input hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {loading ? '…' : 'Suggest'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['spend', 'save', 'invest', 'keep'] as const).map((key) => (
          <div key={key}>
            <label className="text-sm text-text-muted capitalize">{key}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={key === 'keep' ? normalized.keep : normalized[key]}
              onChange={(e) => {
                const v = Number(e.target.value);
                setAllocation((prev) => ({ ...prev, [key]: v }));
              }}
              className="w-full mt-1"
              aria-label={`${key} percentage`}
            />
            <span className="text-sm font-medium text-text">{key === 'keep' ? normalized.keep : normalized[key]}%</span>
          </div>
        ))}
      </div>
      {reasoning && <p className="text-sm text-text-muted">{reasoning}</p>}
      <button
        type="button"
        onClick={acceptAllocation}
        disabled={loading || !suggestedAllocationId}
        className="px-6 py-3 bg-primary text-white rounded-input hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        Apply allocation
      </button>
    </div>
  );
}
