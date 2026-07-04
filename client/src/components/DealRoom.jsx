import { useState, useMemo } from 'react';
import { Lock, Unlock, Calculator, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

// Light access gate: SHA-256 of the passphrase. This is a privacy curtain for a
// public static site, NOT security — real auth arrives with the Node host +
// magic links (see Monetization panel). Default passphrase: ***REDACTED-PASSPHRASE***
const GATE_HASH = '***REDACTED-HASH***';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const fmt = n => (n || n === 0) ? `$${Math.round(n).toLocaleString()}` : '—';

// Benchmark: the ***REDACTED-ADDRESS*** deal, from the signed contract (primary source)
const BENCHMARK = {
  label: '***REDACTED-ADDRESS*** (your signed deal)',
  price: ***, incentive: 3153, rent: 2600, leaseMonths: 12,
  hoa: 250, taxAnnual: 3000, sqft: 1569, score: 86,
};

function underwrite(d, assumptions) {
  const a = assumptions || {};
  const rate = (a.rate_investment || 6.65) / 100 / 12;
  const n = (a.loan_term_years || 30) * 12;
  const effective = d.price - (d.incentive || 0);
  const loan = effective * (1 - (a.down_payment_pct || 20) / 100);
  const pi = loan * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  const taxMonthly = (d.taxAnnual || effective * 0.0098) / 12;
  const insMonthly = (a.insurance_annual || 1500) / 12;
  const piti = pi + taxMonthly + insMonthly + (d.hoa || a.hoa_monthly_default || 220);
  const rent = d.rent || 0;
  const grossYield = effective > 0 ? (rent * 12 / effective) * 100 : 0;
  const cashFlow = rent * 0.9 - piti; // 5% vacancy + 5% maintenance
  const leasebackValue = rent * (d.leaseMonths || 0);
  const ppsf = d.sqft ? effective / d.sqft : null;
  return { effective, piti: Math.round(piti), grossYield: Math.round(grossYield * 100) / 100, cashFlow: Math.round(cashFlow), leasebackValue, ppsf: ppsf ? Math.round(ppsf) : null };
}

export default function DealRoom({ market, research }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem('dealroom_ok') === '1');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [d, setD] = useState({ address: '***REDACTED-ADDRESS***, Charlotte, NC 28211', price: 400000, incentive: 20000, rent: 2600, leaseMonths: 12, hoa: 250, taxAnnual: 3100, sqft: 1600, isModel: true, isFurnished: true, isLeaseback: true });

  const assumptions = market?.assumptions;
  const result = useMemo(() => underwrite(d, assumptions), [d, assumptions]);
  const bench = useMemo(() => underwrite(BENCHMARK, assumptions), [assumptions]);
  const recordsLinks = (research?.api_catalog?.apis || []).filter(a => ['ready-to-wire', 'manual-check'].includes(a.status));

  async function tryUnlock() {
    const h = await sha256(pw.trim().toLowerCase());
    if (h === GATE_HASH) { localStorage.setItem('dealroom_ok', '1'); setUnlocked(true); setErr(''); }
    else setErr('Not it — hint: lot number + street.');
  }

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Deal Room</h2>
        <p className="text-sm text-gray-500 mb-4">Private underwriting workspace. Enter the passphrase.</p>
        <div className="flex gap-2">
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryUnlock()}
            placeholder="Passphrase"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={tryUnlock} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Unlock</button>
        </div>
        {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
        <p className="text-[11px] text-gray-400 mt-4">Privacy curtain, not bank-grade security — real auth ships with the Pro tier (see Monetization).</p>
      </div>
    );
  }

  const num = (key, label, step = 1000) => (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <input type="number" step={step} value={d[key]} onChange={e => setD({ ...d, [key]: parseFloat(e.target.value) || 0 })}
        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </label>
  );

  const beats = result.effective / (d.sqft || 1) <= bench.effective / BENCHMARK.sqft && result.grossYield >= bench.grossYield;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Unlock className="w-4 h-4 text-green-600" />
        <h2 className="text-base font-bold text-gray-900">Deal Room — underwrite anything against your signed benchmark</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input form */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <label className="block">
            <span className="text-xs text-gray-500">Address / label</span>
            <input value={d.address} onChange={e => setD({ ...d, address: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {num('price', 'Asking price')}
            {num('incentive', 'Incentives ($)')}
            {num('rent', 'Rent / leaseback $/mo', 50)}
            {num('leaseMonths', 'Leaseback months', 1)}
            {num('hoa', 'HOA $/mo', 10)}
            {num('taxAnnual', 'Tax $/yr', 100)}
            {num('sqft', 'Sq ft', 10)}
          </div>
          <div className="flex gap-4 pt-1">
            {[['isModel', 'Model'], ['isFurnished', 'Furnished'], ['isLeaseback', 'Leaseback']].map(([k, l]) => (
              <label key={k} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={!!d[k]} onChange={e => setD({ ...d, [k]: e.target.checked })} className="w-4 h-4 rounded" />{l}
              </label>
            ))}
          </div>
        </section>

        {/* Results vs benchmark */}
        <section className={`rounded-xl border p-4 ${beats ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">{d.address || 'This deal'}</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-500"><th className="text-left font-medium py-1">Metric</th><th className="text-right font-medium">This deal</th><th className="text-right font-medium">***REDACTED-ADDRESS*** benchmark</th></tr></thead>
            <tbody className="text-gray-800">
              <tr><td className="py-1 text-gray-500">Effective price</td><td className="text-right font-semibold">{fmt(result.effective)}</td><td className="text-right">{fmt(bench.effective)}</td></tr>
              <tr><td className="py-1 text-gray-500">$/sqft (effective)</td><td className="text-right font-semibold">{result.ppsf ? `$${result.ppsf}` : '—'}</td><td className="text-right">${Math.round(bench.effective / BENCHMARK.sqft)}</td></tr>
              <tr><td className="py-1 text-gray-500">PITI + HOA /mo</td><td className="text-right font-semibold">{fmt(result.piti)}</td><td className="text-right">{fmt(bench.piti)}</td></tr>
              <tr><td className="py-1 text-gray-500">Gross yield</td><td className="text-right font-semibold">{result.grossYield}%</td><td className="text-right">{bench.grossYield}%</td></tr>
              <tr><td className="py-1 text-gray-500">Cash flow /mo</td><td className="text-right font-semibold">{fmt(result.cashFlow)}</td><td className="text-right">{fmt(bench.cashFlow)}</td></tr>
              <tr><td className="py-1 text-gray-500">Leaseback value</td><td className="text-right font-semibold">{fmt(result.leasebackValue)}</td><td className="text-right">{fmt(bench.leasebackValue)}</td></tr>
            </tbody>
          </table>
          <p className={`flex items-start gap-1.5 text-xs font-medium rounded-lg p-2 mt-2 ${beats ? 'text-green-800 bg-green-100' : 'text-amber-800 bg-amber-100'}`}>
            {beats ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {beats
              ? 'Beats or matches your benchmark on $/sqft and yield — worth pursuing at these terms.'
              : `Below benchmark. To match ***REDACTED-ADDRESS*** $/sqft, effective price needs to be ~${fmt((bench.effective / BENCHMARK.sqft) * (d.sqft || 0))} — that's your counter.`}
          </p>
          {!d.isModel || !d.isFurnished || !d.isLeaseback ? (
            <p className="text-xs text-gray-500 mt-2">Missing from the trifecta: {[!d.isModel && 'model', !d.isFurnished && 'furnished', !d.isLeaseback && 'leaseback'].filter(Boolean).join(', ')} — the benchmark had all three.</p>
          ) : null}
          <p className="text-xs text-red-700 mt-2">⚠ Leaseback = rental use: verify the builder's Investor Sales Addendum in the contract (your ***REDACTED-ADDRESS*** contract makes unauthorized rental use grounds for earnest forfeiture).</p>
        </section>
      </div>

      {/* Records pull links */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Verify with public records (free)</h3>
        <div className="flex flex-wrap gap-2">
          {[
            ['Assessor card', 'https://property.spatialest.com/nc/mecklenburg'],
            ['POLARIS parcel', 'https://polaris3g.mecklenburgcountync.gov'],
            ['Rezoning petitions', 'https://charlotteud.com/rezoning/'],
            ['CMPD crime map', 'https://data.charlottenc.gov'],
            ['Meck foreclosures', 'https://www.mecknc.gov/CountyClerkOfCourt/Pages/Foreclosures.aspx'],
            ['HUD FMR lookup', 'https://www.huduser.gov/portal/datasets/fmr.html'],
          ].map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg">
              {label} <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Live pulls (Census, permit counts, RentCast rents, HUD FMR) run through <code>/api/live/*</code> when the Node server is up — add free keys to <code>server/.env</code>. The static site links out instead.
        </p>
      </section>
    </div>
  );
}
