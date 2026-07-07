import { useState, useMemo } from 'react';
import { Lock, Unlock, ShieldAlert, Calculator } from 'lucide-react';
import { IS_STATIC } from '../staticData';
import DealDocuments from './DealDocuments';

// The public static site never ships underwriting or benchmark data — the
// private tier requires the local server (research.json is gitignored and its
// API route is loopback-gated). No personal numbers live in this file: the
// benchmark comes from research.your_deal at runtime.

const fmt = n => (n || n === 0) ? `$${Math.round(n).toLocaleString()}` : '—';

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

function StaticStub() {
  return (
    <div className="max-w-xl mx-auto py-16">
      <div className="bg-white border border-amber-200 rounded-xl p-6 text-center shadow-sm">
        <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Deal Room unavailable</h2>
        <p className="text-sm text-gray-600 mt-2">
          Private underwriting is disabled until the application has server-side authentication.
          Client-side passphrases cannot protect data delivered by a public static site.
        </p>
        <div className="flex items-start gap-2 text-left text-xs text-amber-800 bg-amber-50 rounded-lg p-3 mt-4">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Keep contracts, negotiation notes, financial assumptions, and private source material outside the public repository and Pages build.
        </div>
      </div>
    </div>
  );
}

export default function DealRoom({ market, research }) {
  const [d, setD] = useState({ address: '', price: 400000, incentive: 0, rent: 2500, leaseMonths: 12, hoa: 250, taxAnnual: 3100, sqft: 1600 });

  const assumptions = market?.assumptions;
  // Benchmark comes from the private research file, served only over loopback.
  const yd = research?.your_deal;
  const bench = useMemo(() => yd ? underwrite({
    price: yd.price, incentive: yd.incentive, rent: yd.leaseback_rent_monthly,
    leaseMonths: 12, hoa: yd.hoa_monthly, taxAnnual: yd.tax_annual, sqft: yd.sqft,
  }, assumptions) : null, [yd, assumptions]);
  const result = useMemo(() => underwrite(d, assumptions), [d, assumptions]);

  if (IS_STATIC) return <StaticStub />;

  const num = (key, label, step = 1000) => (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <input type="number" step={step} value={d[key]} onChange={e => setD({ ...d, [key]: parseFloat(e.target.value) || 0 })}
        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </label>
  );

  const beats = bench && result.effective / (d.sqft || 1) <= bench.effective / (yd.sqft || 1) && result.grossYield >= bench.grossYield;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Unlock className="w-4 h-4 text-green-600" />
        <h2 className="text-base font-bold text-gray-900">Deal Room — private underwriting (local server only)</h2>
      </div>

      {!yd && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Benchmark unavailable — the private research API is disabled. Set <code>ALLOW_PRIVATE_LOCAL=true</code> in <code>server/.env</code> and
          keep <code>server/data/research.json</code> in place (it is gitignored) to compare deals against your signed benchmark.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <label className="block">
            <span className="text-xs text-gray-500">Address / label</span>
            <input value={d.address} onChange={e => setD({ ...d, address: e.target.value })} placeholder="Property to underwrite"
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
        </section>

        <section className={`rounded-xl border p-4 ${beats ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">{d.address || 'This deal'}</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-500"><th className="text-left font-medium py-1">Metric</th><th className="text-right font-medium">This deal</th><th className="text-right font-medium">Your benchmark</th></tr></thead>
            <tbody className="text-gray-800">
              <tr><td className="py-1 text-gray-500">Effective price</td><td className="text-right font-semibold">{fmt(result.effective)}</td><td className="text-right">{bench ? fmt(bench.effective) : '—'}</td></tr>
              <tr><td className="py-1 text-gray-500">$/sqft (effective)</td><td className="text-right font-semibold">{result.ppsf ? `$${result.ppsf}` : '—'}</td><td className="text-right">{bench?.ppsf ? `$${bench.ppsf}` : '—'}</td></tr>
              <tr><td className="py-1 text-gray-500">PITI + HOA /mo</td><td className="text-right font-semibold">{fmt(result.piti)}</td><td className="text-right">{bench ? fmt(bench.piti) : '—'}</td></tr>
              <tr><td className="py-1 text-gray-500">Gross yield</td><td className="text-right font-semibold">{result.grossYield}%</td><td className="text-right">{bench ? `${bench.grossYield}%` : '—'}</td></tr>
              <tr><td className="py-1 text-gray-500">Cash flow /mo (est)</td><td className="text-right font-semibold">{fmt(result.cashFlow)}</td><td className="text-right">{bench ? fmt(bench.cashFlow) : '—'}</td></tr>
              <tr><td className="py-1 text-gray-500">Leaseback value</td><td className="text-right font-semibold">{fmt(result.leasebackValue)}</td><td className="text-right">{bench ? fmt(bench.leasebackValue) : '—'}</td></tr>
            </tbody>
          </table>
          {bench && (
            <p className={`text-xs font-medium rounded-lg p-2 mt-3 ${beats ? 'text-green-800 bg-green-100' : 'text-amber-800 bg-amber-100'}`}>
              {beats ? '✓ Beats your benchmark on $/sqft and yield' : 'Does not beat your benchmark on both $/sqft and yield — negotiate or pass'}
            </p>
          )}
        </section>
      </div>

      {/* Per-deal document vault: local uploads + Drive index (private tier) */}
      <DealDocuments slug="3912-craig-ave" title={yd?.property?.split('—')[0]?.trim() || '3912 Craig Ave'} />
    </div>
  );
}
