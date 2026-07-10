import { useState } from 'react';
import { Search, Loader2, Building2, User, TrendingUp, DollarSign, Home, AlertCircle, ChevronDown, ChevronRight, MapPin } from 'lucide-react';

// Private diligence panel — one address, two providers, in parallel:
// ATTOM (AVM + owner/records + sales history) and HouseCanary (value + rent +
// 3-yr forecast). Loopback-gated route; Deal Room (private tier) only.
// Formatting is tuned to the providers' real response shapes, with a readable
// key-value fallback for anything unexpected.

const money = v => (v || v === 0) && !isNaN(v) ? `$${Math.round(v).toLocaleString()}` : null;
const compact = v => (v || v === 0) && !isNaN(v) ? `$${Math.round(v / 1000)}K` : null;

// Flatten a nested object into readable "Label: value" rows, skipping noise.
function flatten(obj, prefix = '', out = []) {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (v == null || v === '' || k.startsWith('_')) continue;
    const label = (prefix ? `${prefix} · ` : '') + k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ');
    if (Array.isArray(v)) {
      if (v.length) out.push([label, `${v.length} item${v.length === 1 ? '' : 's'}`]);
    } else if (typeof v === 'object') {
      if (Object.keys(v).length) flatten(v, label, out);
    } else {
      out.push([label, String(v)]);
    }
  }
  return out;
}

// Collapsible details — readable rows instead of a JSON dump.
function Details({ data, label = 'all details' }) {
  const [open, setOpen] = useState(false);
  const rows = flatten(data);
  if (!rows.length) return null;
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(o => !o)} className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} {label} ({rows.length})
      </button>
      {open && (
        <dl className="mt-1.5 max-h-64 overflow-y-auto rounded-lg bg-gray-50 p-2.5 space-y-0.5">
          {rows.map(([k, v], i) => (
            <div key={i} className="flex justify-between gap-3 text-[11px]">
              <dt className="text-gray-400 capitalize truncate">{k}</dt>
              <dd className="text-gray-700 text-right break-all">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function Card({ title, icon: Icon, r, children }) {
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

const Row = ({ k, v, strong }) => v == null ? null : (
  <div className="flex justify-between gap-3 text-xs py-0.5">
    <dt className="text-gray-500">{k}</dt>
    <dd className={`text-right ${strong ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{v}</dd>
  </div>
);

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

  function useResult(res) {
    const addr = String(res.address || '').trim();
    const zip = (addr.match(/\b(\d{5})\b/) || [])[1] || '';
    const street = addr.split(',')[0].replace(/\b\d{5}(-\d{4})?\b/g, '').trim() || addr;
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
  const p = attom?.profile?.ok ? attom.profile.property : null;
  const own = p?.assessment?.owner;
  const bld = p?.building;
  const avm = attom?.avm?.ok ? attom.avm.avm : null;

  // Sales entries with an actual recorded amount or date (NC is a
  // non-disclosure state, so many entries carry no price).
  const sales = attom?.sales?.ok
    ? (attom.sales.history || []).filter(s => s.amount?.saleamt || s.saleTransDate || s.amount?.salerecdate)
    : [];

  const hcVal = hc?.value?.ok ? (hc.value.result?.price ?? hc.value.result?.value ?? hc.value.result) : null;
  const hcRent = hc?.rent?.ok ? (hc.rent.result?.price ?? hc.rent.result?.value ?? hc.rent.result) : null;
  const num = x => typeof x === 'object' && x ? (x.mean ?? x.value ?? x.price) : x;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Property diligence</h3>
        </div>
        <p className="text-xs text-gray-500">ATTOM records + AVM and HouseCanary value/rent/forecast for any US address. Or start from an owner’s name (Mecklenburg County). Owner data is public record; keep it private.</p>
      </div>

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
          {inp('address1', 'Street address (full address is fine — ZIP is auto-detected)', 'flex-1 min-w-[220px]')}
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
          <Card title="ATTOM — value estimate (AVM)" icon={DollarSign} r={attom.avm}>
            <p className="text-2xl font-bold text-gray-900">{money(avm?.value) || '—'}</p>
            {avm && (
              <p className="text-xs text-gray-500 mt-0.5">
                Range {compact(avm.low)} – {compact(avm.high)}
                {avm.scr != null && <> · Confidence <span className="font-semibold text-gray-700">{avm.scr}/100</span></>}
              </p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">Independent automated valuation — not an appraisal</p>
          </Card>

          <Card title="ATTOM — owner & records" icon={User} r={attom.profile}>
            <dl>
              <Row k="Owner of record" v={own?.owner1?.fullName} strong />
              {own?.corporateIndicator === 'Y' && <Row k="Owner type" v="Company / LLC" />}
              {own?.absenteeOwnerStatus === 'A' && <Row k="Occupancy" v="Absentee owner" />}
              <Row k="Owner mailing" v={own?.mailingAddressOneLine} />
              <Row k="Property type" v={p?.summary?.propertyType || p?.summary?.propClass} />
              <Row k="Year built" v={p?.summary?.yearBuilt} />
              <Row k="Size" v={bld?.size?.livingSize ? `${bld.size.livingSize.toLocaleString()} sqft` : null} />
              <Row k="Beds / baths" v={bld?.rooms?.beds != null ? `${bld.rooms.beds} bd / ${bld.rooms.bathsTotal} ba` : null} />
              <Row k="Levels" v={bld?.summary?.levels} />
              <Row k="Tax assessed value" v={money(p?.assessment?.assessed?.assdTtlValue)} strong />
              <Row k="APN / parcel" v={p?.identifier?.apn} />
            </dl>
            <Details data={p} />
          </Card>

          <Card title="ATTOM — sales history" icon={Building2} r={attom.sales}>
            {sales.length ? (
              <ul className="text-xs space-y-1">
                {sales.slice(0, 6).map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-gray-500">{s.saleTransDate || s.amount?.salerecdate || '—'}</span>
                    <span className="font-medium">{money(s.amount?.saleamt) || 'undisclosed'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">No recorded arms-length sales — typical for new construction still held by the builder. (NC is a non-disclosure state, so recorded sales may omit prices.)</p>
            )}
            <Details data={attom.sales.history} label="raw entries" />
          </Card>

          <Card title="HouseCanary — value" icon={DollarSign} r={hc.value}>
            <p className="text-2xl font-bold text-gray-900">{money(num(hcVal)) || '—'}</p>
            {hcVal?.price_lwr && <p className="text-xs text-gray-500 mt-0.5">Range {compact(hcVal.price_lwr)} – {compact(hcVal.price_upr)}</p>}
            <p className="text-[11px] text-gray-400 mt-1">HouseCanary AVM</p>
            <Details data={hc.value.result} />
          </Card>

          <Card title="HouseCanary — rent estimate" icon={Home} r={hc.rent}>
            <p className="text-2xl font-bold text-gray-900">
              {money(num(hcRent)) || '—'}<span className="text-sm font-normal text-gray-400">/mo</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Rental AVM — ground-truth your leaseback yield</p>
            <Details data={hc.rent.result} />
          </Card>

          <Card title="HouseCanary — 3-year forecast" icon={TrendingUp} r={hc.forecast}>
            <p className="text-xs text-gray-500 mb-1">Projected value path (36 months)</p>
            <Details data={hc.forecast.result} label="forecast detail" />
          </Card>
        </div>
      )}
    </section>
  );
}
