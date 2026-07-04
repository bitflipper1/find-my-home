import { useState, useEffect } from 'react';
import { X, Phone, ExternalLink, MapPin, BedDouble, Bath, Ruler, Calendar, TrendingDown, Star, Hammer, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchListing } from '../api';
import TrackEditor from './TrackEditor';
import { ScoreChip } from './InvestTab';
import { AlertTriangle } from 'lucide-react';

const fmt = n => n ? `$${parseInt(n).toLocaleString()}` : 'N/A';

export default function ListingModal({ listing, onClose, trackedRecord, onSaveTrack, onRemoveTrack }) {
  const [detail, setDetail] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!listing) return;
    fetchListing(listing.id).then(setDetail).catch(() => setDetail(listing));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [listing?.id]);

  if (!listing) return null;

  const d = detail || listing;
  const hasCut = d.original_price > 0 && d.price < d.original_price;
  const cutAmt = hasCut ? d.original_price - d.price : 0;
  const cutPct = hasCut ? ((cutAmt / d.original_price) * 100).toFixed(1) : 0;
  const images = d.images || [];
  const features = d.features || [];
  const priceHistory = d.price_history_detail || [];

  const chartData = [
    ...(d.original_price && d.original_price !== d.price
      ? [{ date: 'Listed', price: d.original_price }]
      : []),
    ...priceHistory.map(h => ({ date: new Date(h.recorded_at).toLocaleDateString(), price: h.price })),
    { date: 'Current', price: d.price },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap gap-1 mb-1">
              {hasCut && (
                <span className="badge-cut"><TrendingDown className="w-3 h-3" /> Price cut -{cutPct}%</span>
              )}
              {d.is_model === 1 && <span className="badge-model">Model Home</span>}
              {d.is_new_construction === 1 && <span className="badge-new"><Star className="w-3 h-3" /> New Construction</span>}
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{d.address}</h2>
            {d.community && <p className="text-sm text-blue-600 font-medium mt-0.5">{d.community}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className="relative">
            <img
              src={images[imgIdx]}
              alt="listing"
              className="w-full h-64 object-cover"
              onError={e => { e.target.src = ''; }}
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-2 h-2 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left col */}
          <div className="md:col-span-2 space-y-5">
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">{fmt(d.price)}</span>
                {hasCut && (
                  <>
                    <span className="text-lg line-through text-gray-400">{fmt(d.original_price)}</span>
                    <span className="text-base font-bold text-red-600">Save {fmt(cutAmt)}</span>
                  </>
                )}
              </div>
              {d.sqft && d.price && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {fmt(Math.round(d.price / d.sqft))}/sqft
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 py-3 border-y border-gray-100">
              {d.beds && (
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <BedDouble className="w-4 h-4 text-gray-400" />
                  <strong>{d.beds}</strong> beds
                </div>
              )}
              {d.baths && (
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Bath className="w-4 h-4 text-gray-400" />
                  <strong>{d.baths}</strong> baths
                </div>
              )}
              {d.sqft && (
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Ruler className="w-4 h-4 text-gray-400" />
                  <strong>{d.sqft?.toLocaleString()}</strong> sqft
                </div>
              )}
              {d.year_built && (
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Built <strong>{d.year_built}</strong>
                </div>
              )}
              {d.lot_size && (
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Lot: <strong>{d.lot_size}</strong>
                </div>
              )}
            </div>

            {/* Builder info */}
            {d.builder && (
              <div className="flex items-center gap-2 text-sm">
                <Hammer className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Builder:</span>
                <span className="font-semibold text-gray-800">{d.builder}</span>
                {d.days_on_market !== null && (
                  <span className="ml-auto text-gray-400">{d.days_on_market} days on market</span>
                )}
              </div>
            )}

            {/* Description */}
            {d.description && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{d.description}</p>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Features</p>
                <div className="grid grid-cols-2 gap-1">
                  {features.map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Investment analysis (computed server-side from submarket intel) */}
            {listing.invest?.score != null && (() => {
              const inv = listing.invest;
              const fmtN = n => `$${Math.round(n).toLocaleString()}`;
              const rows = [
                ['Est. market rent', `${fmtN(inv.rent_estimate)}/mo`],
                ['Gross yield', `${inv.gross_yield_pct}%`],
                ['Cap rate (est.)', `${inv.cap_rate_pct}%`],
                ['Est. PITI + HOA (20% down, investor rate)', `${fmtN(inv.piti_monthly)}/mo`],
                ['Est. cash flow', `${inv.cash_flow_monthly >= 0 ? '+' : ''}${fmtN(inv.cash_flow_monthly)}/mo`],
                ['$/sqft vs submarket', `$${inv.ppsf} vs $${inv.market_ppsf} (${inv.ppsf_vs_market_pct > 0 ? '+' : ''}${inv.ppsf_vs_market_pct}%)`],
                ['Submarket appreciation', `${inv.yoy_appreciation}% YoY · ${inv.forecast_3yr}%/yr 3-yr forecast`],
                ['Property tax (investor)', `${fmtN(inv.tax_annual_investor)}/yr`],
                ...(inv.fit ? [['Matt-Fit (plug-play · tech · unique)', `${inv.fit.score}/100 (${inv.fit.plug_play} · ${inv.fit.tech} · ${inv.fit.unique})`]] : []),
              ];
              return (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Investment analysis — {inv.submarket_label}
                    </p>
                    <ScoreChip score={inv.score} size="lg" />
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 text-xs">
                        <dt className="text-gray-500">{k}</dt>
                        <dd className="font-semibold text-gray-800 text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {inv.sc_investor_tax_warning && (
                    <p className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 rounded-lg p-2 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      South Carolina assesses non-owner-occupied property at a 6% ratio — during a leaseback (you don't occupy), the tax bill shown is roughly triple the owner-occupied figure. Factor this before comparing to NC deals.
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-2">Curated estimates, not an appraisal — verify rent comps and the actual tax bill before offering.</p>
                </div>
              );
            })()}

            {/* Price History Chart */}
            {chartData.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Price History</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 11 }}
                      width={55}
                    />
                    <Tooltip formatter={v => [fmt(v), 'Price']} />
                    <Line type="monotone" dataKey="price" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right col: actions */}
          <div className="space-y-3">
            {/* Tour tracker */}
            {onSaveTrack && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-rose-800 mb-2">
                  {trackedRecord ? '📋 In your tour list' : '📋 Track this place'}
                </p>
                <TrackEditor
                  listing={d}
                  tracked={trackedRecord}
                  onSave={onSaveTrack}
                  onRemove={onRemoveTrack}
                  compact
                />
              </div>
            )}

            {d.phone && (
              <a
                href={`tel:${d.phone}`}
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
              >
                <Phone className="w-4 h-4" /> Call Now
              </a>
            )}
            {d.url && (
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-xl transition"
              >
                <ExternalLink className="w-4 h-4" /> View Listing
              </a>
            )}
            {d.latitude && d.longitude && (
              <a
                href={`https://maps.google.com/?q=${d.latitude},${d.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition"
              >
                <MapPin className="w-4 h-4" /> Get Directions
              </a>
            )}

            {/* Meta info */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Source</span>
                <span className="font-medium text-gray-700 capitalize">{d.source}</span>
              </div>
              {d.move_in_date && (
                <div className="flex justify-between">
                  <span>Move-in</span>
                  <span className="font-medium text-gray-700">{d.move_in_date}</span>
                </div>
              )}
              {d.zip && (
                <div className="flex justify-between">
                  <span>ZIP</span>
                  <span className="font-medium text-gray-700">{d.zip}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Last updated</span>
                <span className="font-medium text-gray-700">
                  {d.updated_at ? new Date(d.updated_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
