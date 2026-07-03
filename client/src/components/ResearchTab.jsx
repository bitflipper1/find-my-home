import { BookOpen, Database, AlertTriangle, CheckCircle2, XCircle, Trophy, FileText, Lightbulb, ClipboardCheck, Phone } from 'lucide-react';

const fmt = n => (n || n === 0) ? `$${Math.round(n).toLocaleString()}` : '—';

const SOURCE_ICONS = {
  email: '📧', 'drive-doc': '📄', 'drive-sheet': '📊', 'drive-deck': '🎞️',
  notebooklm: '📓', insights: '📈', apple: '🎙️',
};

const STATUS_STYLE = {
  connected: 'bg-green-100 text-green-800',
  ingested: 'bg-blue-100 text-blue-800',
  'sources-mirrored': 'bg-teal-100 text-teal-800',
  unavailable: 'bg-gray-100 text-gray-500',
};

export default function ResearchTab({ research }) {
  if (!research) {
    return <p className="text-sm text-gray-400 text-center py-12">Research data not loaded yet.</p>;
  }

  const { sources = [], builder_intel = [], your_deal, thesis, innovation_watch, negotiation_playbook, best_builders_to_talk_to = [] } = research;

  return (
    <div className="space-y-6">
      {/* Best builders to talk to */}
      <section>
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" /> Best builders to talk to — synthesized from all your sources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {best_builders_to_talk_to.map(b => (
            <div key={b.builder} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{b.rank}</span>
                <span className="font-semibold text-gray-900 text-sm">{b.builder}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{b.why}</p>
              <p className="text-xs text-blue-700 flex items-start gap-1"><Phone className="w-3 h-3 mt-0.5 shrink-0" />{b.contact}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Builder intel table */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Charlotte builder intel — volume, trust & your risk flags</h3>
          <span className="ml-auto text-xs text-gray-400">2025 Builder Magazine + America's Most Trusted (from your Drive research)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left font-medium px-4 py-2">Builder</th>
                <th className="text-right font-medium px-3 py-2">2024 closings</th>
                <th className="text-right font-medium px-3 py-2">Share</th>
                <th className="text-right font-medium px-3 py-2">Volume rank</th>
                <th className="text-right font-medium px-3 py-2">Trust rank (US)</th>
                <th className="text-left font-medium px-4 py-2">Notes / risk</th>
              </tr>
            </thead>
            <tbody>
              {builder_intel.map(b => (
                <tr key={b.builder} className={`border-b border-gray-50 ${b.risk_flag ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">
                    {b.builder}
                    {b.risk_flag && <AlertTriangle className="inline w-3.5 h-3.5 text-red-500 ml-1.5" />}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">{b.closings_2024 ? b.closings_2024.toLocaleString() : '—'}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{b.market_share_pct ? `${b.market_share_pct}%` : '—'}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{b.volume_rank ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">{b.trust_rank_national ? `#${b.trust_rank_national}` : '—'}</td>
                  <td className="px-4 py-2 text-xs max-w-lg">
                    {b.risk_flag && <span className="text-red-700 block">{b.risk_flag}</span>}
                    {b.note && <span className="text-gray-500">{b.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Your deal + thesis, side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {your_deal && (
          <section className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" /> Your benchmark deal — exact terms (from your dashboard)
            </h3>
            <p className="text-sm font-bold text-gray-900">{your_deal.property}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
              <div className="flex justify-between"><dt className="text-gray-500">Price</dt><dd className="font-semibold">{fmt(your_deal.price)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Incentive</dt><dd className="font-semibold text-green-700">−{fmt(your_deal.incentive)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Effective</dt><dd className="font-semibold">{fmt(your_deal.price - your_deal.incentive)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Leaseback</dt><dd className="font-semibold">{fmt(your_deal.leaseback_rent_monthly)}/mo</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Term</dt><dd className="font-semibold text-right">{your_deal.leaseback_term}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">HOA / tax</dt><dd className="font-semibold">${your_deal.hoa_monthly}/mo · {fmt(your_deal.tax_annual)}/yr</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Return (w/ incentives)</dt><dd className="font-semibold text-green-700">{your_deal.modeled_return_with_incentives_pct}%/yr</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Return (without)</dt><dd className="font-semibold">{your_deal.modeled_return_without_incentives_pct}%/yr</dd></div>
            </dl>
            <p className="text-xs text-gray-600 mt-2">{your_deal.furniture}</p>
            <details className="mt-2">
              <summary className="text-xs font-semibold text-blue-800 cursor-pointer">Risks to verify ({your_deal.risks_to_verify?.length})</summary>
              <ul className="mt-1.5 space-y-1">
                {(your_deal.risks_to_verify || []).map(r => (
                  <li key={r} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <ClipboardCheck className="w-3 h-3 mt-0.5 shrink-0 text-blue-500" />{r}
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}

        {thesis && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> {thesis.name}
            </h3>
            <div className="flex gap-3 mb-2">
              {(thesis.neighborhood_values || []).map(v => (
                <div key={v.area} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{v.area}</p>
                  <p className="text-sm font-bold text-gray-900">{fmt(v.typical_value)}</p>
                  <p className={`text-xs font-medium ${v.yoy_pct >= 0 ? 'text-green-700' : 'text-red-600'}`}>{v.yoy_pct > 0 ? '+' : ''}{v.yoy_pct}% YoY</p>
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold text-green-800 bg-green-50 rounded-lg p-2 mb-2">{thesis.buy_threshold}</p>
            <div className="space-y-1">
              {(thesis.scorecard || []).map(s => (
                <div key={s.driver} className="flex items-center gap-2 text-xs">
                  <span className="w-44 text-gray-600 shrink-0">{s.driver}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.score * 10}%` }} />
                  </div>
                  <span className="w-7 text-right font-semibold text-gray-800">{s.score}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{thesis.resale_signal}</p>
          </section>
        )}
      </div>

      {/* Negotiation playbook + innovation watch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {negotiation_playbook && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-4 h-4 text-gray-500" /> Negotiation playbook (from your thesis doc)
            </h3>
            <ul className="space-y-1.5">
              {(negotiation_playbook.asks || []).map(a => (
                <li key={a} className="flex items-start gap-1.5 text-xs text-gray-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500" />{a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {innovation_watch && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-purple-500" /> Innovation Watch (your data-sources doc)
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(innovation_watch.index_weights || []).map(w => (
                <span key={w.metric} className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-800 border border-purple-100">
                  {w.metric.split(' (')[0]} {w.weight_pct}%
                </span>
              ))}
            </div>
            {innovation_watch.hidden_gem && (
              <div className="bg-purple-50 rounded-lg p-2.5 mb-2">
                <p className="text-xs font-semibold text-purple-900">💎 Hidden gem: {innovation_watch.hidden_gem.area}</p>
                <p className="text-xs text-purple-800 mt-0.5">{innovation_watch.hidden_gem.research_view}</p>
              </div>
            )}
            <ul className="space-y-1">
              {(innovation_watch.data_sources || []).map(s => (
                <li key={s.name} className="text-xs text-gray-600">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">{s.name}</a>
                  <span className="text-gray-400"> — {s.use}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Sources */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Insight sources feeding this app</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {sources.map(s => (
            <div key={s.name} className="px-4 py-2.5 flex items-start gap-3">
              <span className="text-base">{SOURCE_ICONS[s.type] || '📁'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-500">{s.detail}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_STYLE[s.status] || 'bg-gray-100 text-gray-500'}`}>
                {s.status === 'unavailable' ? <XCircle className="inline w-3 h-3 mr-0.5" /> : <CheckCircle2 className="inline w-3 h-3 mr-0.5" />}
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
