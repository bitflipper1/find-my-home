import { useMemo, useState } from 'react';
import { Target, TrendingUp, Building2, Phone, ExternalLink, AlertTriangle, Info, BadgeCheck, Sofa, KeyRound } from 'lucide-react';

const fmt = n => (n || n === 0) ? `$${Math.round(n).toLocaleString()}` : '—';
const pct = n => (n || n === 0) ? `${n}%` : '—';

export function ScoreChip({ score, size = 'sm' }) {
  if (score === null || score === undefined) return null;
  // Color signals magnitude but the number always carries the value
  const tone = score >= 70 ? 'bg-green-100 text-green-800 border-green-200'
    : score >= 50 ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';
  const sz = size === 'lg' ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold border ${tone} ${sz}`} title="Investment score (0–100): value vs submarket, rent yield, growth forecast, price-cut momentum, model/furnished/leaseback fit">
      <Target className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} /> {score}
    </span>
  );
}

const LIKELIHOOD_STYLE = {
  'active': { label: 'Active program', cls: 'bg-green-100 text-green-800 border-green-200', icon: BadgeCheck },
  'case-by-case': { label: 'Case-by-case', cls: 'bg-amber-100 text-amber-800 border-amber-200', icon: Info },
  'rare': { label: 'Rare', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: Info },
};

function TargetCard({ listing, onOpen }) {
  const i = listing.invest || {};
  const isBenchmark = (listing.status || '').includes('YOUR DEAL');
  return (
    <div
      className={`rounded-xl border p-4 cursor-pointer transition hover:shadow-md ${isBenchmark ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}
      onClick={() => onOpen(listing)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-lg font-bold text-gray-900">{listing.price ? fmt(listing.price) : (isBenchmark ? 'Your deal' : 'Price TBD — call')}</span>
          {listing.original_price > 0 && listing.price < listing.original_price && (
            <span className="text-xs line-through text-gray-400">{fmt(listing.original_price)}</span>
          )}
        </div>
        <span className="flex items-center gap-1">
          <ScoreChip score={i.score} />
          {i.fit && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200" title="Matt-Fit: plug-and-play · tech · unique">
              Fit {i.fit.score}
            </span>
          )}
        </span>
      </div>
      <p className="text-sm text-gray-700 font-medium leading-tight mb-1">{listing.community || listing.address}</p>
      <p className="text-xs text-gray-500 mb-2">{listing.builder} · {i.submarket_label || listing.city}</p>

      <div className="flex flex-wrap gap-1 mb-2.5">
        {isBenchmark && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">Your benchmark deal</span>}
        {listing.is_furnished === 1 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Sofa className="w-3 h-3" /> Furnished</span>}
        {listing.leaseback === 1 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800"><KeyRound className="w-3 h-3" /> Leaseback</span>}
        {i.sc_investor_tax_warning && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3" /> SC 6% investor tax</span>}
        {(listing.status || '').startsWith('Curated') && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Verify by phone</span>}
      </div>

      {listing.price > 0 && i.rent_estimate && (
        <div className="grid grid-cols-3 gap-2 text-xs border-t border-gray-100 pt-2">
          <div><span className="text-gray-400 block">Rent est.</span><span className="font-semibold text-gray-800">{fmt(i.rent_estimate)}/mo</span></div>
          <div><span className="text-gray-400 block">Gross yield</span><span className="font-semibold text-gray-800">{pct(i.gross_yield_pct)}</span></div>
          <div><span className="text-gray-400 block">$/sqft vs mkt</span><span className={`font-semibold ${i.ppsf_vs_market_pct < 0 ? 'text-green-700' : 'text-gray-800'}`}>{i.ppsf_vs_market_pct > 0 ? '+' : ''}{pct(i.ppsf_vs_market_pct)}</span></div>
        </div>
      )}

      <div className="flex gap-1.5 mt-2.5" onClick={e => e.stopPropagation()}>
        {listing.phone && (
          <a href={`tel:${listing.phone}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
            <Phone className="w-3 h-3" /> Call
          </a>
        )}
        {listing.url && (
          <a href={listing.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg">
            <ExternalLink className="w-3 h-3" /> View
          </a>
        )}
      </div>
    </div>
  );
}

export default function InvestTab({ listings, market, onOpen }) {
  const [maxPrice, setMaxPrice] = useState(350000);
  const [needFurnished, setNeedFurnished] = useState(false);
  const [needLeaseback, setNeedLeaseback] = useState(false);

  const submarkets = market?.submarkets || [];
  const programs = market?.leaseback_programs || [];
  const assumptions = market?.assumptions || {};

  const targets = useMemo(() => {
    const seen = new Set();
    return (listings || [])
      .filter(l => l.is_model === 1)
      .filter(l => !l.price || l.price <= maxPrice)
      .filter(l => !needFurnished || l.is_furnished === 1)
      .filter(l => !needLeaseback || l.leaseback === 1)
      .sort((a, b) => {
        const bench = ((b.status || '').includes('YOUR DEAL') ? 1 : 0) - ((a.status || '').includes('YOUR DEAL') ? 1 : 0);
        if (bench) return bench;
        return (b.invest?.score ?? -1) - (a.invest?.score ?? -1);
      })
      .filter(l => {
        const key = (l.community || l.address || '').toLowerCase().slice(0, 30);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [listings, maxPrice, needFurnished, needLeaseback]);

  const sortedSubmarkets = [...submarkets].sort((a, b) => b.gross_yield_pct - a.gross_yield_pct);

  return (
    <div className="space-y-6">
      {/* Target finder */}
      <section>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" /> Your Target: furnished model, leaseback-friendly, under {fmt(maxPrice)}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Ranked by investment score. Cash flows assume {assumptions.down_payment_pct}% down at {assumptions.rate_investment}% investor rate — the leaseback period (builder pays rent + HOA) is what bridges early negative carry.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Max $</span>
              <input
                type="number" step="5000" value={maxPrice}
                onChange={e => setMaxPrice(parseInt(e.target.value) || 350000)}
                className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={needFurnished} onChange={e => setNeedFurnished(e.target.checked)} className="w-4 h-4 rounded text-purple-500 border-gray-300" />
              <span className="text-xs text-gray-700">Furnished only</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={needLeaseback} onChange={e => setNeedLeaseback(e.target.checked)} className="w-4 h-4 rounded text-teal-500 border-gray-300" />
              <span className="text-xs text-gray-700">Leaseback only</span>
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {targets.map(l => <TargetCard key={l.id} listing={l} onOpen={onOpen} />)}
          {targets.length === 0 && (
            <p className="col-span-full text-sm text-gray-400 text-center py-8">No matches — loosen a filter.</p>
          )}
        </div>
      </section>

      {/* Submarket intel */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Submarket intel — new-construction townhomes</h3>
          <span className="ml-auto text-xs text-gray-400">sorted by gross yield · estimates as of {assumptions.as_of}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left font-medium px-4 py-2">Submarket</th>
                <th className="text-right font-medium px-3 py-2">$/sqft</th>
                <th className="text-right font-medium px-3 py-2">Rent $/sqft</th>
                <th className="text-right font-medium px-3 py-2">Gross yield</th>
                <th className="text-right font-medium px-3 py-2">YoY</th>
                <th className="text-right font-medium px-3 py-2">3-yr fcst</th>
                <th className="text-right font-medium px-3 py-2">DOM</th>
                <th className="text-right font-medium px-3 py-2">Tax (investor)</th>
                <th className="text-left font-medium px-4 py-2">Read</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubmarkets.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">
                    {s.label}
                    {s.county.startsWith('SC-') && <AlertTriangle className="inline w-3.5 h-3.5 text-red-500 ml-1.5" title="SC 6% investor assessment ratio" />}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">${s.ppsf}</td>
                  <td className="px-3 py-2 text-right text-gray-700">${s.rent_psf.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">{s.gross_yield_pct}%</td>
                  <td className="px-3 py-2 text-right text-gray-700">{s.yoy_appreciation}%</td>
                  <td className="px-3 py-2 text-right text-gray-700">{s.forecast_3yr}%/yr</td>
                  <td className="px-3 py-2 text-right text-gray-700">{s.dom}d</td>
                  <td className="px-3 py-2 text-right text-gray-700">{(s.tax_rate_investor * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-xs text-gray-500 max-w-md">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leaseback program directory */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Builder model-sale & leaseback programs — Charlotte division</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {programs.map(p => {
            const style = LIKELIHOOD_STYLE[p.likelihood] || LIKELIHOOD_STYLE['rare'];
            return (
              <div key={p.builder} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-gray-900 text-sm">{p.builder}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${style.cls}`}>
                    <style.icon className="w-3 h-3" /> {style.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">{p.terms}</p>
                <p className="text-xs text-gray-500 mb-1"><strong className="text-gray-600">Furnished:</strong> {p.furnished}</p>
                <p className="text-xs text-gray-500 mb-2"><strong className="text-gray-600">Contact:</strong> {p.contact}</p>
                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2">💡 {p.tip}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Assumptions */}
      <section className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-500">
        <p className="font-semibold text-gray-600 mb-1">Model assumptions ({assumptions.as_of})</p>
        <p>
          {assumptions.down_payment_pct}% down · {assumptions.rate_investment}% investment / {assumptions.rate_primary}% primary rate · {assumptions.loan_term_years}-yr fixed ·
          ${assumptions.insurance_annual}/yr insurance · ${assumptions.hoa_monthly_default}/mo HOA default · {assumptions.vacancy_pct}% vacancy · {assumptions.maintenance_pct_of_rent}% maintenance.
        </p>
        <p className="mt-1">{assumptions.disclaimer}</p>
      </section>
    </div>
  );
}
