import { BookOpen, Database, AlertTriangle, CheckCircle2, XCircle, Trophy, FileText, Lightbulb, ClipboardCheck, Phone, TrendingUp } from 'lucide-react';

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

  const {
    sources = [], builder_intel = [], your_deal, thesis, innovation_watch,
    negotiation_playbook, best_builders_to_talk_to = [],
    upside_2027, contract_red_flags, rental_playbook, tripointe_roster, tour_archive, records_toolkit,
    key_insights, deal_programs, api_catalog, monetization, public_data_stack,
    premium_data, competitive_edge, product_roadmap,
  } = research;

  const RATING_STYLE = { 'Very high': 'bg-green-100 text-green-800 font-semibold', 'High': 'bg-green-50 text-green-700', 'Med': 'bg-gray-100 text-gray-600', 'Low': 'bg-gray-50 text-gray-400' };

  const API_STATUS_STYLE = {
    'ready-to-wire': 'bg-green-100 text-green-800',
    'wired-needs-key': 'bg-purple-100 text-purple-800',
    'if-monetized': 'bg-amber-100 text-amber-800',
    'needs-partner': 'bg-blue-100 text-blue-800',
    'caution-tos': 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Key insights — the cross-source synthesis */}
      {key_insights && (
        <section>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Key insights — what all your data says together
          </h2>
          <p className="text-xs text-gray-400 mb-3">{key_insights.method}</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {key_insights.insights.map(i => (
              <div key={i.n} className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-200 p-4">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i.n}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{i.title}</p>
                    <p className="text-xs text-gray-600 leading-relaxed mt-1.5">{i.insight}</p>
                    <p className="text-xs font-medium text-amber-900 bg-amber-100/60 rounded-lg p-2 mt-2">→ {i.action}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">Sources: {i.sources}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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

      {/* 2027 upside picks */}
      {upside_2027 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-700">Your 2027 appreciation-upside picks</h3>
            <span className="ml-auto text-xs text-gray-400">{upside_2027.source}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left font-medium px-4 py-2">#</th>
                  <th className="text-left font-medium px-3 py-2">Area</th>
                  <th className="text-right font-medium px-3 py-2">Upside score</th>
                  <th className="text-right font-medium px-3 py-2">2027 appr.</th>
                  <th className="text-left font-medium px-4 py-2">Catalyst</th>
                </tr>
              </thead>
              <tbody>
                {upside_2027.picks.map(p => (
                  <tr key={p.rank} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 font-bold text-gray-400">{p.rank}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{p.area}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">{p.score}/10</td>
                    <td className="px-3 py-2 text-right text-green-700 font-medium">{p.appreciation}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 max-w-md">{p.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
            <p className="text-xs font-semibold text-amber-800 mb-0.5">Avoid list:</p>
            {upside_2027.avoid.map(a => <p key={a} className="text-xs text-amber-700">• {a}</p>)}
          </div>
        </section>
      )}

      {/* Rental playbook + contract red flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rental_playbook && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Rental submarket playbook <span className="text-xs font-normal text-gray-400">({rental_playbook.source})</span></h3>
            <div className="space-y-2">
              {rental_playbook.rows.map(r2 => (
                <div key={r2.submarket} className="bg-gray-50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{r2.submarket}</span>
                    <span className="text-gray-600">{r2.rent_3br} · {r2.appreciation} · CF: {r2.cash_flow} · {r2.transit}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{r2.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {contract_red_flags && (
          <section className="bg-red-50 rounded-xl border border-red-100 p-4">
            <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" /> Builder contract red flags — check before signing
            </h3>
            <ul className="space-y-1.5">
              {contract_red_flags.items.map(i => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-red-900/80">
                  <ClipboardCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />{i}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Tri Pointe roster + tour archive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tripointe_roster && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Tri Pointe Charlotte roster <span className="text-xs font-normal text-gray-400">(your Intel Desk chat)</span></h3>
            <div className="space-y-1.5">
              {tripointe_roster.communities.map(c => (
                <div key={c.name} className="text-xs">
                  <span className="font-semibold text-gray-800">{c.name}</span>
                  <span className="text-gray-500"> — {c.detail}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2 mt-2">💡 {tripointe_roster.strategy}</p>
          </section>
        )}

        {tour_archive && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">🎞️ Tour media archive <span className="text-xs font-normal text-gray-400">(RealEstateMedia2026 + VoiceMemosExport)</span></h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tour_archive.communities_toured.map(c => (
                <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{c}</span>
              ))}
            </div>
            {(tour_archive.voice_memos_mapped || []).map(m => (
              <p key={m.memo} className="text-xs text-gray-600 mt-1">🎙️ <strong>{m.memo}</strong> → {m.property}</p>
            ))}
            <p className="text-xs text-gray-400 mt-1.5">{tour_archive.note}</p>
            {records_toolkit && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-1">Mecklenburg records lookup path:</p>
                {records_toolkit.steps.map(s => <p key={s} className="text-xs text-gray-500">{s}</p>)}
              </div>
            )}
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

      {/* Official public-data stack */}
      {public_data_stack && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1.5">🏛️ Charlotte-Meck public data stack <span className="text-xs font-normal text-gray-400">(ingested {public_data_stack.ingested} · endpoints live at /api/live/*)</span></h3>
          <p className="text-xs font-medium text-green-800 bg-green-50 rounded-lg p-2.5 mb-2">🎯 {public_data_stack.boom_signal}</p>
          <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 mb-3">🔨 {public_data_stack.builder_leverage_proxy}</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">The 8-step workflow</p>
              <ol className="space-y-1">
                {public_data_stack.workflow.map(s => <li key={s} className="text-xs text-gray-600">{s}</li>)}
              </ol>
            </div>
            <div className="overflow-x-auto">
              <p className="text-xs font-semibold text-gray-600 mb-1.5">What each source family is good for</p>
              <table className="w-full text-xs">
                <thead><tr className="text-gray-400"><th className="text-left font-medium py-1">Family</th><th className="font-medium">Incentives</th><th className="font-medium">Growth</th><th className="font-medium">Risk</th><th className="font-medium">Diligence</th></tr></thead>
                <tbody>
                  {public_data_stack.matrix.map(m => (
                    <tr key={m.family} className="border-t border-gray-50">
                      <td className="py-1 pr-2 text-gray-700">{m.family}</td>
                      {[m.incentives, m.growth, m.risk, m.diligence].map((v, i) => (
                        <td key={i} className="text-center px-1"><span className={`px-1.5 py-0.5 rounded text-[10px] ${RATING_STYLE[v] || ''}`}>{v}</span></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Deal programs across portals/iBuyers */}
      {deal_programs && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">💰 Special deal programs — portals & iBuyers <span className="text-xs font-normal text-gray-400">(researched {deal_programs.researched})</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {deal_programs.programs.map(p => (
              <div key={p.name} className={`rounded-lg border p-3 ${p.fit === 'high' ? 'border-green-200 bg-green-50/50' : p.fit === 'verify' ? 'border-gray-200 bg-gray-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-800">{p.name}</span>
                  <span className="text-[10px] text-gray-400">{p.platform}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{p.what}</p>
                <p className="text-xs font-medium text-blue-700 mt-1.5">→ {p.action}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* API catalog */}
      {api_catalog && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">🔌 Data APIs the app can consume <span className="text-xs font-normal text-gray-400">(researched {api_catalog.researched})</span></h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left font-medium px-4 py-2">API</th>
                  <th className="text-left font-medium px-3 py-2">Cost</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                  <th className="text-left font-medium px-4 py-2">What it powers</th>
                </tr>
              </thead>
              <tbody>
                {api_catalog.apis.map(a => (
                  <tr key={a.name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium whitespace-nowrap">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{a.name}</a>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{a.cost}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${API_STATUS_STYLE[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span></td>
                    <td className="px-4 py-2 text-xs text-gray-500">{a.powers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-2.5 text-xs text-green-800 bg-green-50 border-t border-green-100">→ {api_catalog.recommendation}</p>
        </section>
      )}

      {/* Premium data providers — ATTOM vs HouseCanary */}
      {premium_data && (
        <section className="bg-white rounded-xl border border-purple-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1.5">💎 Premium data tier — ATTOM & HouseCanary <span className="text-xs font-normal text-gray-400">(researched {premium_data.researched} · wired, awaiting keys)</span></h3>
          <p className="text-xs font-medium text-purple-800 bg-purple-50 rounded-lg p-2.5 mb-3">{premium_data.verdict}</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-2">
            {premium_data.providers.map(p => (
              <div key={p.name} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-800">{p.name}</span>
                  <span className="text-[10px] text-gray-400">{p.entry_cost}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-1.5">{p.strengths}</p>
                <p className="text-xs font-medium text-blue-700 mb-1.5">→ {p.best_for}</p>
                <div className="flex flex-wrap gap-1">
                  {p.wired.map(w => <code key={w} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{w}</code>)}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">{premium_data.strategy}</p>
        </section>
      )}

      {/* Competitive edge — why this beats the alternatives */}
      {competitive_edge && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1.5">🥊 Competitive edge — what this app does that others don't</h3>
          <p className="text-xs font-medium text-green-800 bg-green-50 rounded-lg p-2.5 mb-3">{competitive_edge.positioning}</p>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left font-medium px-3 py-2">Vs</th>
                  <th className="text-left font-medium px-3 py-2">Their gap</th>
                  <th className="text-left font-medium px-3 py-2">Our edge</th>
                </tr>
              </thead>
              <tbody>
                {competitive_edge.vs.map(c => (
                  <tr key={c.competitor} className="border-b border-gray-50 align-top">
                    <td className="px-3 py-2 text-xs font-semibold text-gray-800 whitespace-nowrap">{c.competitor}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{c.their_gap}</td>
                    <td className="px-3 py-2 text-xs text-green-700">{c.our_edge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {competitive_edge.user_benefits.map(b => (
              <p key={b} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">✓ {b}</p>
            ))}
          </div>
        </section>
      )}

      {/* Product roadmap */}
      {product_roadmap && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">🗺️ Roadmap — toward the most analytical new-construction investing app</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[['Now', product_roadmap.now, 'border-green-200 bg-green-50/40'], ['Next', product_roadmap.next, 'border-blue-200 bg-blue-50/40'], ['Later', product_roadmap.later, 'border-gray-200 bg-gray-50/60']].map(([label, items, cls]) => (
              <div key={label} className={`rounded-lg border p-3 ${cls}`}>
                <p className="text-xs font-bold text-gray-800 mb-1.5">{label}</p>
                <ul className="space-y-1.5">
                  {items.map(i => <li key={i} className="text-xs text-gray-600 leading-relaxed">• {i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Monetization plan */}
      {monetization && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1.5">💳 Monetization path (if you open it up)</h3>
          <p className="text-xs text-gray-600 mb-2">{monetization.verdict}</p>
          {monetization.gating_status && (
            <p className="text-xs font-medium text-purple-800 bg-purple-50 rounded-lg p-2.5 mb-2">🔒 {monetization.gating_status}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            {monetization.tiers.map(t => (
              <div key={t.tier} className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-xs font-bold text-gray-800">{t.tier}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.gets}</p>
              </div>
            ))}
          </div>
          <ol className="text-xs text-gray-600 space-y-0.5 mb-2">
            {monetization.path.map(s => <li key={s}>{s}</li>)}
          </ol>
          <p className="text-xs text-red-700 bg-red-50 rounded-lg p-2">⚖️ {monetization.legal_caution}</p>
        </section>
      )}

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
