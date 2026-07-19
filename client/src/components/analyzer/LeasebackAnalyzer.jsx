import { useEffect, useMemo, useState, useCallback } from 'react';
import { Calculator } from 'lucide-react';
import { IS_STATIC } from '../../staticData';
import { analyzeDeal, REFERENCE_DEAL } from '../../../../shared/leaseback-math.js';
import { deserializeDeal } from '../../../../shared/leaseback-url.js';
import VerdictPanel from './VerdictPanel';
import RateDecisions from './RateDecisions';
import RedFlags from './RedFlags';
import DealInputs from './DealInputs';
import PrefillBar from './PrefillBar';

const STORAGE_KEY = 'leaseback-analyzer-v1';

// Deep-set by dotted path, immutably.
function setPath(obj, path, value) {
  const keys = path.split('.');
  const clone = { ...obj };
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = Array.isArray(cur[keys[i]]) ? [...cur[keys[i]]] : { ...cur[keys[i]] };
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

function loadInitial() {
  // A share link wins over saved state; saved state wins over the reference.
  try {
    const m = location.hash.match(/#\/analyzer\?.*\bd=([^&]+)/);
    if (m) return { deal: deserializeDeal(decodeURIComponent(m[1])), origin: 'share' };
  } catch { /* fall through to storage */ }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { deal: JSON.parse(raw), origin: 'storage' };
  } catch { /* fall through to reference */ }
  return { deal: REFERENCE_DEAL, origin: 'reference' };
}

// The analyzer page: inputs on the left of the fold, three output zones
// below, everything recomputed from the pure math module on each change.
// State lives in localStorage; the URL only carries a deal when the user
// explicitly copies a share link.
export default function LeasebackAnalyzer({ seed, research, market, onSeedConsumed }) {
  const [{ deal }, setState] = useState(loadInitial);
  const [sources, setSources] = useState({});
  const [notes, setNotes] = useState([]);
  const [diligenceBusy, setDiligenceBusy] = useState(false);
  const [deals, setDeals] = useState([]);
  const [saveState, setSaveState] = useState(null);

  const setDeal = useCallback(updater => setState(s => ({ deal: typeof updater === 'function' ? updater(s.deal) : updater })), []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(deal)); } catch { /* storage full or blocked */ }
  }, [deal]);

  useEffect(() => {
    if (IS_STATIC) return;
    fetch('/api/deals').then(r => r.json()).then(j => setDeals(j.deals || [])).catch(() => {});
  }, []);

  const markSources = useCallback((paths, origin) => {
    setSources(s => ({ ...s, ...Object.fromEntries(paths.map(p => [p, origin])) }));
  }, []);

  const onChange = useCallback((path, value) => {
    setDeal(d => setPath(d, path, value));
    setSources(s => (s[path] && s[path] !== 'edited' ? { ...s, [path]: 'edited' } : s));
  }, [setDeal]);

  // ---- prefill sources (private tier only) ----
  const yd = research?.your_deal;

  const applyBenchmark = useCallback(() => {
    if (!yd) { setNotes(n => [...n, 'Benchmark prefill unavailable (private research API is off) — enter values manually.']); return; }
    setDeal(d => {
      let next = d;
      const map = [
        ['purchase.price', yd.price],
        ['purchase.sellerContribution', yd.incentive],
        ['leaseback.rentMonthly', yd.leaseback_rent_monthly],
        ['carrying.hoaMonthly', yd.hoa_monthly],
        ['carrying.taxAnnual', yd.tax_annual],
        ['meta.address', yd.property?.split('—')[0]?.trim()],
      ];
      for (const [p, v] of map) if (v != null) next = setPath(next, p, v);
      return next;
    });
    markSources(['purchase.price', 'purchase.sellerContribution', 'leaseback.rentMonthly', 'carrying.hoaMonthly', 'carrying.taxAnnual', 'meta.address'], 'deal');
  }, [yd, setDeal, markSources]);

  const applyDefaults = useCallback(() => {
    const a = market?.assumptions;
    if (!a) { setNotes(n => [...n, 'Market defaults unavailable — enter values manually.']); return; }
    const applied = [];
    setDeal(d => {
      let next = d;
      // Defaults touch EMPTY fields only. Insurance is deliberately excluded:
      // a standard-homeowners number is actively misleading for a
      // sales-office property.
      if (next.carrying.hoaMonthly == null && a.hoa_monthly_default != null) {
        next = setPath(next, 'carrying.hoaMonthly', a.hoa_monthly_default); applied.push('carrying.hoaMonthly');
      }
      if (next.exit.refiRatePct == null && a.rate_investment != null) {
        next = setPath(next, 'exit.refiRatePct', a.rate_investment); applied.push('exit.refiRatePct');
      }
      return next;
    });
    if (applied.length) markSources(applied, 'default');
    else setNotes(n => [...n, 'No empty fields to default — nothing changed.']);
  }, [market, setDeal, markSources]);

  const fetchDiligence = useCallback(async () => {
    const address = deal.meta?.address;
    if (!address) { setNotes(n => [...n, 'Enter an address in "Who\'s who" before fetching live diligence.']); return; }
    setDiligenceBusy(true);
    try {
      const q = new URLSearchParams({ address1: address, address2: 'Charlotte, NC' });
      const r = await fetch(`/api/live/diligence?${q}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.reason || 'diligence failed');
      const applied = [];
      const tax = j.attom?.profile?.ok ? j.attom.profile.property?.assessment?.tax?.taxAmt : null;
      const rent = j.rentcast?.rent?.ok ? j.rentcast.rent.rent : null;
      setDeal(d => {
        let next = d;
        if (tax) { next = setPath(next, 'carrying.taxAnnual', Math.round(tax)); applied.push('carrying.taxAnnual'); }
        if (rent) { next = setPath(next, 'leaseback.rentMonthly', Math.round(rent)); applied.push('leaseback.rentMonthly'); }
        return next;
      });
      if (applied.length) markSources(applied, 'live');
      const misses = [tax ? null : 'ATTOM tax', rent ? null : 'RentCast rent'].filter(Boolean);
      if (misses.length) setNotes(n => [...n, `Live diligence returned no ${misses.join(' or ')} for this address — enter manually.`]);
    } catch (e) {
      setNotes(n => [...n, `Live diligence unavailable (${e.message}) — enter values manually.`]);
    } finally {
      setDiligenceBusy(false);
    }
  }, [deal.meta?.address, setDeal, markSources]);

  // Seed from "Analyze this deal" entry points (listing or Deal Room).
  useEffect(() => {
    if (!seed) return;
    if (seed.type === 'listing' && seed.listing) {
      const l = seed.listing;
      setDeal(d => {
        let next = setPath(d, 'meta.address', l.address || '');
        next = setPath(next, 'meta.builder', l.builder || '');
        next = setPath(next, 'meta.label', l.community || l.address || 'New deal');
        if (l.price) next = setPath(next, 'purchase.price', l.price);
        return next;
      });
      markSources(['meta.address', 'meta.builder', 'purchase.price'], 'deal');
    }
    if (seed.type === 'benchmark') applyBenchmark();
    onSeedConsumed?.();
  }, [seed, setDeal, markSources, applyBenchmark, onSeedConsumed]);

  const saveToDeal = useCallback(async slug => {
    setSaveState('saving');
    try {
      const a = analyzeDeal(deal);
      const r = await fetch(`/api/deals/${slug}/analysis`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: 1, mathVersion: 1, savedAt: new Date().toISOString(),
          inputs: deal,
          headline: a.headline,
          flags: a.flags.map(f => ({ id: f.id, severity: f.severity, fired: f.fired })),
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setSaveState('saved'); setTimeout(() => setSaveState(null), 2000);
    } catch (e) {
      setSaveState(null);
      setNotes(n => [...n, `Save failed (${e.message}).`]);
    }
  }, [deal]);

  const analysis = useMemo(() => analyzeDeal(deal), [deal]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-blue-600" />
        <h2 className="text-base font-bold text-gray-900">Model-Home Leaseback Analyzer</h2>
        <span className="text-xs text-gray-400 hidden sm:inline">The builder rents your house. Know exactly what that costs.</span>
      </div>

      {!IS_STATIC && (
        <PrefillBar
          hasBenchmark={Boolean(yd)} hasMarket={Boolean(market?.assumptions)}
          onApplyBenchmark={applyBenchmark} onApplyDefaults={applyDefaults}
          onFetchDiligence={fetchDiligence} diligenceBusy={diligenceBusy}
          notes={notes} deals={deals} onSaveToDeal={saveToDeal} saveState={saveState}
          onResetReference={() => { setState({ deal: REFERENCE_DEAL }); setSources({}); setNotes([]); }}
        />
      )}

      <VerdictPanel deal={deal} analysis={analysis} />
      <RateDecisions analysis={analysis} refiMonths={deal.exit?.refiMonths} />
      <RedFlags flags={analysis.flags} />
      <DealInputs deal={deal} sources={sources} onChange={onChange} />
    </div>
  );
}
