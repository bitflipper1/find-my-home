// RentCast active-listings scanner — the legal replacement for the dead
// portal scrapers. One /listings/sale call returns up to 500 active listings
// with per-listing price history, so a full Mecklenburg + Gaston townhome
// sweep costs ~2-4 calls of the free tier's 50/month.
//
// Every call is metered in the api_usage table, and runScan() refuses to
// start if the sweep wouldn't fit in the remaining monthly budget. The scan
// is manual-trigger only (no cron) for the same reason.
const axios = require('axios');
const crypto = require('crypto');
const { upsertListing, bumpApiUsage, getApiUsage, logScrape } = require('./db');

const MONTHLY_LIMIT = parseInt(process.env.RENTCAST_MONTHLY_LIMIT || '50', 10);
const PAGE_SIZE = 500;      // RentCast max per request
const MAX_PAGES = 4;        // hard cap so a bug can never drain the budget

// One radius covers both target counties: centered between Charlotte and
// Gastonia, 30mi reaches all of Mecklenburg + Gaston (plus fringes of
// neighboring counties, which the allow-list filters back out).
const SCAN_REGION = {
  latitude: 35.26,
  longitude: -80.95,
  radiusMiles: 30,
  counties: ['Mecklenburg', 'Gaston'],
  propertyType: 'Townhouse',
};

function makeId(rcId) {
  return `rentcast_${crypto.createHash('md5').update(String(rcId)).digest('hex').slice(0, 12)}`;
}

// A listing's history is an object keyed by ISO date, each entry carrying an
// event and price. If any prior recorded price is above the current asking
// price, that's a real observed reduction.
function priorHighPrice(listing) {
  const events = Object.values(listing.history || {});
  const prices = events.map(e => e.price).filter(p => p > 0);
  const high = Math.max(...prices, 0);
  return high > (listing.price || 0) ? high : null;
}

function toListing(r) {
  return {
    id: makeId(r.id || r.formattedAddress),
    source: 'rentcast',
    url: `https://app.rentcast.io/app?address=${encodeURIComponent(r.formattedAddress || '')}`,
    address: r.formattedAddress || '',
    city: r.city || '',
    state: r.state || 'NC',
    zip: r.zipCode || '',
    price: r.price || 0,
    original_price: priorHighPrice(r),
    beds: r.bedrooms ?? null,
    baths: r.bathrooms ?? null,
    sqft: r.squareFootage ?? null,
    year_built: r.yearBuilt ?? null,
    type: 'Townhome',
    status: r.status || 'Active',
    builder: r.builder || null,
    latitude: r.latitude,
    longitude: r.longitude,
    days_on_market: r.daysOnMarket ?? null,
    is_new_construction: r.yearBuilt && r.yearBuilt >= new Date().getFullYear() - 1 ? 1 : 0,
    images: [],
  };
}

function usage() {
  const used = getApiUsage('rentcast');
  return { used, limit: MONTHLY_LIMIT, remaining: Math.max(0, MONTHLY_LIMIT - used) };
}

// Zero-cost preview: what a scan would spend vs. what's left this month.
function scanPreview() {
  return {
    region: SCAN_REGION,
    maxCalls: MAX_PAGES,
    ...usage(),
    note: `A full sweep uses 1 call per ${PAGE_SIZE} listings (max ${MAX_PAGES}). Metro townhome inventory typically fits in 1-2 calls.`,
  };
}

async function runScan() {
  if (!process.env.RENTCAST_API_KEY) {
    return { ok: false, reason: 'RENTCAST_API_KEY not set (free key: rentcast.io/api)' };
  }
  const { remaining } = usage();
  if (remaining < 1) {
    return { ok: false, reason: `RentCast monthly budget exhausted (${MONTHLY_LIMIT}/${MONTHLY_LIMIT} calls used). Resets next month.` };
  }
  const budget = Math.min(MAX_PAGES, remaining);

  let calls = 0;
  const found = [];
  try {
    for (let page = 0; page < budget; page++) {
      const resp = await axios.get('https://api.rentcast.io/v1/listings/sale', {
        params: {
          latitude: SCAN_REGION.latitude,
          longitude: SCAN_REGION.longitude,
          radius: SCAN_REGION.radiusMiles,
          propertyType: SCAN_REGION.propertyType,
          status: 'Active',
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
        headers: { 'X-Api-Key': process.env.RENTCAST_API_KEY },
        timeout: 20000,
      });
      calls++;
      bumpApiUsage('rentcast', 1);
      const batch = Array.isArray(resp.data) ? resp.data : [];
      found.push(...batch);
      if (batch.length < PAGE_SIZE) break; // last page
    }
  } catch (err) {
    if (calls > 0) bumpApiUsage('rentcast', 0); // usage already counted per successful call
    const status = err.response?.status;
    const detail = err.response?.data?.message || err.message;
    logScrape('rentcast', 'error', { found: found.length }, detail);
    return { ok: false, reason: status === 403 ? `RentCast rejected the key: ${detail}` : `RentCast error: ${detail}`, callsSpent: calls };
  }

  // Keep only the two target counties; the radius unavoidably catches
  // neighbors (Union, Cabarrus, York SC) which we drop here.
  const inScope = found.filter(r => {
    const county = String(r.county || '').replace(/ county/i, '').trim();
    return SCAN_REGION.counties.some(c => county.toLowerCase() === c.toLowerCase());
  });

  let created = 0, updated = 0, cuts = 0;
  for (const r of inScope) {
    const listing = toListing(r);
    if (listing.original_price) cuts++;
    const { action } = upsertListing(listing);
    if (action === 'created') created++; else updated++;
  }
  logScrape('rentcast', 'success', { found: inScope.length, created, updated });

  return {
    ok: true,
    callsSpent: calls,
    fetched: found.length,
    inScope: inScope.length,
    created,
    updated,
    priceCuts: cuts,
    ...usage(),
  };
}

module.exports = { scanPreview, runScan, SCAN_REGION };
