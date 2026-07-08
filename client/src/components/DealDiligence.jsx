import { useState } from 'react';
import { Search, Loader2, Building2, User, TrendingUp, DollarSign, Home, AlertCircle, ChevronDown, ChevronRight, MapPin } from 'lucide-react';

// Private diligence panel — one address, two providers, in parallel:
// ATTOM (AVM + owner/records + sales history) and HouseCanary (value + rent +
// 3-yr forecast). Loopback-gated route; Deal Room (private tier) only.

const money = n => {
  const v = typeof n === 'object' && n ? (n.value ?? n.amount ?? n.price) : n;
  return (v || v === 0) && !isNaN(v) ? `$${Math.round(v).toLocaleString()}` : null;
};

// A block that renders its provider's data or the {ok:false} reason it gave.
function Provider({ title, icon: Icon, r, children }) {
  if (!r) return null;
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      </div>
      {r.ok ? children : (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {r.reason || 'No data returned'}
        </p>
      )}
    </div>
  );
}

// Collapsible raw JSON — the escape hatch so unusual provider shapes are always
// visible even before we tune field-by-field formatting.
function Raw({ data }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(o => !o)} className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} raw data
      </button>
      {open && <pre className="mt-1 text-[10px] bg-gray-50 rounded-lg p-2 overflow-x-auto max-h-56 text-gray-600">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

export default function DealDiligence() {
  const [mode, setMode] = useState('address'); // 'address' | 'owner'
  const [f, setF] = useState({ address1: '', address2: 'Charlotte, NC', zipcode: '' });
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Owner-name (reverse) search state
  const [ownerName, setOwnerName] = useState('');
  const [owners, setOwners] = useState(null);
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [ownerErr, setOwnerErr] = useState('');

  async function searchOwner() {
    if (ownerName.trim().length < 3) { setOwnerErr('Enter at least 3 characters'); return; }
    setOwnerBusy(true); setOwnerErr(''); setOwners(null);
    try {
      const r = await fetch(`/api/live/owner-search?name=${encodeURIComponent(ownerName.trim())}`);
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.reason || j.error || `HTTP ${r.status}`);
      setOwners(j);
    } catch (e) {
      setOwnerErr(`${e.message}${e.message.includes('disabled') ? ' — set ALLOW_PRIVATE_LOCAL=true in server/.env' : ''}`);
    } finally {
      setOwnerBusy(false);
    }
  }

  // Click a parcel result → prefill the address form and run full diligence.
  function useResult(res) {
    const addr = String(res.address || '').trim();
    const zip = (addr.match(/\b(\d{5})\b/) || [])[1] || '';
    const street = addr.replace(/,.*$/, '').replace(/\s+\d{5}(-\d{4})?$/, '').trim() || addr;
    const form = { address1: street, address2: 'Charlotte, NC', zipcode: zip };
    setF(form);
    setMode('address');
    run(form);
  }

  async function run(form) {
    const d = form || f;
    if (!d.address1.trim()) { setErr('Enter a street address'); return; }
    setBusy(true); setErr(''); setData(null);
    try {
      const q = new URLSearchParams({ address1: d.address1.trim(), address2: d.address2.trim(), zipcode: d.zipcode.trim() });
      const r = await fetch(`/api/live/diligence?${q}`);
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.reason || j.error || `HTTP ${r.status}`);
      setData(j);
    } catch (e) {
      setErr(`${e.message}${e.message.includes('disabled') ? ' — set ALLOW_PRIVATE_LOCAL=true in server/.env' : ''}`);
    } finally {
      setBusy(false);
    }
  }

  const inp = (key, ph, w) => (
    <input value={f[key]} onChange={e => setF({ ...f, [key]: e.target.value })} placeholder={ph}
      onKeyDown={e => e.key === 'Enter' && run()}
      className={`${w} px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`} />
  );

  const attom = data?.attom, hc = data?.housecanary;
  const owner = attom?.profile?.ok ? attom.profile.property : null;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Property diligence</h3>
        </div>
        <p className="text-xs text-gray-500">ATTOM records + AVM and HouseCanary value/rent/forecast for any US address. Or start from an owner’s name (Mecklenburg County). Owner data is public record; keep it private.</p>
      </div>

      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs">
        {[['address', 'By address'], ['owner', 'By owner name']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md font-medium transition ${mode === m ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'owner' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Someone told you they’re selling but didn’t give an address? Search Mecklenburg County parcel records by owner name,
            then click a result to pull full diligence on it. (Common names return many parcels; owners under an LLC or trust won’t match a personal name.)
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchOwner()}
              placeholder="Owner last name (e.g. Smith)"
              className="flex-1 min-w-[200px] px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={searchOwner} disabled={ownerBusy}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5">
              {ownerBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />} Search owners
            </button>
          </div>
          {ownerErr && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{ownerErr}</p>}
          {owners && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5">{owners.count} parcel{owners.count === 1 ? '' : 's'} found</p>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg max-h-72 overflow-y-auto">
                {owners.results.map((r, i) => (
                  <button key={i} onClick={() => useResult(r)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 transition flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                    <span className="min-w-0">
                      <span className="block text-sm text-gray-800 truncate">{r.address || '(no address on parcel)'}</span>
                      <span className="block text-xs text-gray-500 truncate">{r.owner}{r.pid ? ` · PID ${r.pid}` : ''}</span>
                    </span>
                    <span className="ml-auto text-xs text-blue-600 font-medium shrink-0 self-center">Run →</span>
                  </button>
                ))}
                {owners.count === 0 && <p className="px-3 py-3 text-xs text-gray-400">No parcels matched. Try a different spelling, or they may own under an LLC/trust or in another county.</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'address' && (
        <div className="flex flex-wrap gap-2 items-center">
          {inp('address1', 'Street address', 'flex-1 min-w-[180px]')}
          {inp('address2', 'City, ST', 'w-32')}
          {inp('zipcode', 'ZIP', 'w-20')}
          <button onClick={() => run()} disabled={busy}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Run diligence
          </button>
        </div>
      )}

      {err && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{err}</p>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Provider title="ATTOM — value estimate (AVM)" icon={DollarSign} r={attom.avm}>
            <p className="text-2xl font-bold text-gray-900">{money(attom.avm.avm) || '—'}</p>
            <p className="text-xs text-gray-400">Independent automated valuation</p>
            <Raw data={attom.avm.avm} />
          </Provider>

          <Provider title="ATTOM — owner & records" icon={User} r={attom.profile}>
            <dl className="text-xs space-y-0.5">
              {owner?.owner && <div className="flex justify-between"><dt className="text-gray-500">Owner</dt><dd className="font-medium text-right">{owner.owner?.owner1?.lastname || owner.owner?.description || '—'}</dd></div>}
              {owner?.summary?.propclass && <div className="flex justify-between"><dt className="text-gray-500">Type</dt><dd className="text-right">{owner.summary.propclass}</dd></div>}
              {money(owner?.assessment?.market?.mktttlvalue) && <div className="flex justify-between"><dt className="text-gray-500">Assessed value</dt><dd className="font-medium text-right">{money(owner.assessment.market.mktttlvalue)}</dd></div>}
              {money(owner?.sale?.amount?.saleamt) && <div className="flex justify-between"><dt className="text-gray-500">Last sale</dt><dd className="font-medium text-right">{money(owner.sale.amount.saleamt)}</dd></div>}
            </dl>
            <Raw data={owner} />
          </Provider>

          <Provider title="ATTOM — sales history" icon={Building2} r={attom.sales}>
            {Array.isArray(attom.sales.history) && attom.sales.history.length ? (
              <ul className="text-xs space-y-1">
                {attom.sales.history.slice(0, 6).map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-gray-500">{s.saleTransDate || s.amount?.salerecdate || s.saleSearchDate || '—'}</span>
                    <span className="font-medium">{money(s.amount?.saleamt) || '—'}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-gray-400">No recorded sales returned.</p>}
            <Raw data={attom.sales.history} />
          </Provider>

          <Provider title="HouseCanary — value" icon={DollarSign} r={hc.value}>
            <p className="text-2xl font-bold text-gray-900">{money(hc.value.result?.value?.value ?? hc.value.result?.value) || '—'}</p>
            <p className="text-xs text-gray-400">HouseCanary AVM</p>
            <Raw data={hc.value.result} />
          </Provider>

          <Provider title="HouseCanary — rent estimate" icon={Home} r={hc.rent}>
            <p className="text-2xl font-bold text-gray-900">{money(hc.rent.result?.value?.value ?? hc.rent.result?.value) || '—'}<span className="text-sm font-normal text-gray-400">/mo</span></p>
            <p className="text-xs text-gray-400">Rental AVM — ground-truth your leaseback yield</p>
            <Raw data={hc.rent.result} />
          </Provider>

          <Provider title="HouseCanary — 3-year forecast" icon={TrendingUp} r={hc.forecast}>
            <p className="text-xs text-gray-500 mb-1">Projected value path (36 months)</p>
            <Raw data={hc.forecast.result} />
          </Provider>
        </div>
      )}
    </section>
  );
}
