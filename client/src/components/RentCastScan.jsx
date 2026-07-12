import { useState } from 'react';
import { Radar, Loader2, X, TrendingDown } from 'lucide-react';

// Manual RentCast sweep of Mecklenburg + Gaston townhomes. Deliberately not
// automated: the free tier is 50 calls/month, so every scan shows a cost
// preview and asks before spending. Private tier only (loopback route).
export default function RentCastScan({ onScanned }) {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  async function openPreview() {
    setErr(''); setResult(null); setBusy(true);
    try {
      const r = await fetch('/api/live/rentcast-scan/preview');
      const j = await r.json();
      if (!j.ok) throw new Error(j.reason || 'Preview failed');
      setPreview(j);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function runScan() {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/live/rentcast-scan', { method: 'POST' });
      const j = await r.json();
      if (!j.ok) throw new Error(j.reason || 'Scan failed');
      setResult(j);
      setPreview(null);
      onScanned?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={openPreview} disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 border border-purple-200 hover:bg-purple-50 rounded-lg disabled:opacity-50"
        title="Sweep Mecklenburg + Gaston active townhomes via RentCast (metered)">
        {busy && !preview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
        Scan price cuts
      </button>

      {err && <span className="text-xs text-red-600 ml-2">{err}</span>}

      {result && (
        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1 ml-2">
          <TrendingDown className="w-3 h-3" />
          {result.inScope} listings, {result.priceCuts} with cuts · {result.callsSpent} call{result.callsSpent === 1 ? '' : 's'} spent · {result.remaining}/{result.limit} left this month
        </span>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">RentCast sweep</h3>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Active townhomes across <strong>Mecklenburg + Gaston</strong> ({preview.region.radiusMiles}-mile radius),
              with real per-listing price-drop history.
            </p>
            <div className="text-sm bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Cost of this scan</span><span className="font-semibold">up to {preview.maxCalls} API calls</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Used this month</span><span className="font-semibold">{preview.used} / {preview.limit}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Remaining after scan</span><span className="font-semibold">≥ {Math.max(0, preview.remaining - preview.maxCalls)}</span></div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">{preview.note}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={runScan} disabled={busy || preview.remaining < 1}
                className="flex-1 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
                {preview.remaining < 1 ? 'Budget exhausted' : 'Run scan'}
              </button>
              <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
