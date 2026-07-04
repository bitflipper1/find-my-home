// Static-mode data adapter for the GitHub Pages build.
// Reads the baked data.json snapshot (no backend) and stores tour-tracker
// data in localStorage so it persists per-browser.

let _cache = null;

async function loadSnapshot() {
  if (_cache) return _cache;
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`);
  if (!res.ok) throw new Error('Could not load data.json');
  _cache = await res.json();
  return _cache;
}

function applyFilters(listings, f = {}) {
  let out = listings.slice();
  if (f.source) out = out.filter(l => l.source === f.source);
  if (f.city) out = out.filter(l => (l.city || '').toLowerCase().includes(f.city.toLowerCase()));
  if (f.builder) out = out.filter(l => (l.builder || '').toLowerCase().includes(f.builder.toLowerCase()));
  if (f.minPrice) out = out.filter(l => l.price >= +f.minPrice);
  if (f.maxPrice) out = out.filter(l => l.price <= +f.maxPrice);
  if (f.beds) out = out.filter(l => l.beds >= +f.beds);
  if (f.priceCut) out = out.filter(l => l.original_price > 0 && l.price < l.original_price);
  if (f.isModel) out = out.filter(l => l.is_model === 1);
  if (f.furnished) out = out.filter(l => l.is_furnished === 1);
  if (f.leaseback) out = out.filter(l => l.leaseback === 1);
  if (f.search) {
    const s = f.search.toLowerCase();
    out = out.filter(l =>
      [l.address, l.community, l.builder, l.neighborhood].some(v => (v || '').toLowerCase().includes(s))
    );
  }
  const sort = f.sort || 'updated_at';
  const dir = f.order === 'asc' ? 1 : -1;
  out.sort((a, b) => {
    const av = a[sort] ?? 0, bv = b[sort] ?? 0;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
  if (f.limit) out = out.slice(0, +f.limit);
  return out;
}

// ---- localStorage tour tracker ----
const LS_KEY = 'charlotte_tracked_places';
const TRACK_STATUSES = ['considering', 'scheduled', 'visited', 'favorite', 'passed'];

function readTracked() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function writeTracked(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
let _nextId = Math.max(0, ...readTracked().map(t => t.id || 0)) + 1;

async function snapshotFor(listingId) {
  if (!listingId) return {};
  const snap = await loadSnapshot();
  const l = snap.listings.find(x => x.id === listingId);
  if (!l) return {};
  const { address, city, state, zip, price, beds, baths, sqft, builder, community, phone, url, source, original_price } = l;
  return { address, city, state, zip, price, beds, baths, sqft, builder, community, phone, url, source, original_price };
}

export const staticApi = {
  async fetchListings(filters = {}) {
    const snap = await loadSnapshot();
    const listings = applyFilters(snap.listings, filters);
    return { listings, count: listings.length };
  },
  async fetchStats() { return (await loadSnapshot()).stats; },
  async fetchLogs() { return (await loadSnapshot()).logs; },
  async fetchBuilders() { return (await loadSnapshot()).builders; },
  async fetchCities() { return (await loadSnapshot()).cities; },
  async fetchEmailLeads() {
    const snap = await loadSnapshot();
    return { leads: snap.leads || [], count: (snap.leads || []).length };
  },
  async fetchMarket() {
    return (await loadSnapshot()).market || { submarkets: [], leaseback_programs: [], assumptions: {} };
  },
  async fetchResearch() {
    return (await loadSnapshot()).research || null;
  },
  async fetchBuilderProfiles() {
    return (await loadSnapshot()).builder_profiles || { profiles: [], rankings: null, source_index: null, builders_index: null };
  },
  async triggerRefresh() {
    return { status: 'static', message: 'This is a static (read-only) snapshot — data refreshes when the site is rebuilt.' };
  },

  async fetchTracked() {
    const tracked = readTracked();
    const ids = tracked.filter(t => t.listing_id).map(t => t.listing_id);
    const by_status = {};
    tracked.forEach(t => { by_status[t.status] = (by_status[t.status] || 0) + 1; });
    return { tracked, ids, stats: { total: tracked.length, by_status } };
  },
  async saveTracked(payload) {
    const tracked = readTracked();
    const snap = await snapshotFor(payload.listing_id);
    let row = null;
    if (payload.id) row = tracked.find(t => t.id === payload.id);
    else if (payload.listing_id) row = tracked.find(t => t.listing_id === payload.listing_id);

    const merged = {
      ...(row || {}),
      ...snap,
      ...Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined)),
      status: TRACK_STATUSES.includes(payload.status) ? payload.status : (row?.status || 'considering'),
      source: payload.listing_id ? (snap.source || 'tracked') : (row?.source || 'manual'),
      updated_at: new Date().toISOString(),
    };
    if (row) {
      Object.assign(row, merged);
      writeTracked(tracked);
      return { action: 'updated', id: row.id };
    }
    merged.id = _nextId++;
    merged.created_at = new Date().toISOString();
    tracked.push(merged);
    writeTracked(tracked);
    return { action: 'created', id: merged.id };
  },
  async updateTracked(id, payload) { return this.saveTracked({ ...payload, id }); },
  async deleteTracked(id) {
    const tracked = readTracked().filter(t => t.id !== id);
    writeTracked(tracked);
    return { deleted: 1 };
  },
};

export const IS_STATIC = import.meta.env.VITE_STATIC === 'true';
