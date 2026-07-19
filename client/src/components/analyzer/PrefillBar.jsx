import { useState } from 'react';
import { Database, Radar, Loader2, RotateCcw, FileText, Save } from 'lucide-react';

// Private-tier prefill controls. Rules, per the build interview:
// benchmark and market defaults apply on request (defaults only touch empty
// fields, never insurance); live diligence is button-only because it spends
// RentCast calls; unavailable sources say so out loud instead of silently
// falling back.
export default function PrefillBar({
  hasBenchmark, hasMarket, onApplyBenchmark, onApplyDefaults, onFetchDiligence,
  diligenceBusy, notes, deals, onSaveToDeal, saveState, onResetReference,
}) {
  const [saveSlug, setSaveSlug] = useState('');

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onApplyBenchmark} disabled={!hasBenchmark}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-40"
          title="Price, credits, rent, HOA, tax from your signed deal (research.json)">
          <FileText className="w-3.5 h-3.5" /> Prefill from your deal
        </button>
        <button onClick={onApplyDefaults} disabled={!hasMarket}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          title="Rates and HOA defaults into empty fields only. Insurance is never defaulted.">
          <Database className="w-3.5 h-3.5" /> Defaults into empty fields
        </button>
        <button onClick={onFetchDiligence} disabled={diligenceBusy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-50 disabled:opacity-40"
          title="ATTOM tax + RentCast rent for the address above. Spends 2 RentCast calls.">
          {diligenceBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radar className="w-3.5 h-3.5" />} Fetch live diligence
        </button>
        <button onClick={onResetReference}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
          title="Reload the built-in 3912 Craig Ave reference deal">
          <RotateCcw className="w-3.5 h-3.5" /> Reference deal
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <select value={saveSlug} onChange={e => setSaveSlug(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600">
            <option value="">Save to deal…</option>
            {deals.map(d => <option key={d.slug} value={d.slug}>{d.title}</option>)}
          </select>
          <button onClick={() => saveSlug && onSaveToDeal(saveSlug)} disabled={!saveSlug || saveState === 'saving'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {saveState === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saveState === 'saved' ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
      {notes.length > 0 && (
        <div className="mt-2 space-y-1">
          {notes.map((n, i) => (
            <p key={i} className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">{n}</p>
          ))}
        </div>
      )}
    </section>
  );
}
