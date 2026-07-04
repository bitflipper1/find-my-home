// Live external data connectors — the "wire the free APIs" layer.
//
// Each connector degrades gracefully: missing key or blocked network returns
// { ok:false, reason } instead of throwing, so the app stays functional
// everywhere (the CI/Pages build and some sandboxes block outbound calls).
// Keys go in server/.env: RENTCAST_API_KEY, HUD_API_TOKEN.
const axios = require('axios');

const TIMEOUT = 12000;

async function safeGet(url, opts = {}) {
  try {
    const resp = await axios.get(url, { timeout: TIMEOUT, ...opts });
    return { ok: true, data: resp.data };
  } catch (err) {
    return { ok: false, reason: err.response ? `HTTP ${err.response.status}` : err.code || err.message };
  }
}

// US Census ACS 5-year — keyless. Median household income + median home value
// for Mecklenburg County (feeds the Innovation Index equity metric).
async function censusMecklenburg() {
  const url = 'https://api.census.gov/data/2023/acs/acs5?get=NAME,B19013_001E,B25077_001E&for=county:119&in=state:37';
  const r = await safeGet(url);
  if (!r.ok) return r;
  const [, row] = r.data;
  return { ok: true, source: 'Census ACS 2023 5-yr', county: row[0], median_income: +row[1], median_home_value: +row[2] };
}

// Charlotte Open Data — building permits near a point (ArcGIS REST, keyless).
// Permit spikes are the leading indicator from the user's data-sources doc.
async function permitsNear(lat, lng, radiusMeters = 1600) {
  const base = 'https://gis.charlottenc.gov/arcgis/rest/services/ODP/LDSPermits/MapServer/0/query';
  const params = {
    geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint', inSR: 4326,
    distance: radiusMeters, units: 'esriSRUnit_Meter', spatialRel: 'esriSpatialRelIntersects',
    outFields: 'permit_type,status,issue_date', returnGeometry: false, f: 'json', resultRecordCount: 100,
  };
  const r = await safeGet(base, { params });
  if (!r.ok) return r;
  const feats = r.data?.features || [];
  return { ok: true, source: 'Charlotte Open Data (LDS permits)', count: feats.length, sample: feats.slice(0, 10).map(f => f.attributes) };
}

// RentCast — address-level rent estimate (free tier: 50 calls/mo).
async function rentEstimate(address) {
  if (!process.env.RENTCAST_API_KEY) return { ok: false, reason: 'RENTCAST_API_KEY not set (free key: rentcast.io/api)' };
  const r = await safeGet('https://api.rentcast.io/v1/avm/rent/long-term', {
    params: { address }, headers: { 'X-Api-Key': process.env.RENTCAST_API_KEY },
  });
  if (!r.ok) return r;
  return { ok: true, source: 'RentCast AVM', rent: r.data.rent, rent_low: r.data.rentRangeLow, rent_high: r.data.rentRangeHigh };
}

// HUD Fair Market Rents by zip (free token: huduser.gov).
async function hudFmr(zip) {
  if (!process.env.HUD_API_TOKEN) return { ok: false, reason: 'HUD_API_TOKEN not set (free: huduser.gov/portal/dataset/fmr-api.html)' };
  const r = await safeGet(`https://www.huduser.gov/hudapi/public/fmr/data/${zip}`, {
    headers: { Authorization: `Bearer ${process.env.HUD_API_TOKEN}` },
  });
  if (!r.ok) return r;
  return { ok: true, source: 'HUD FMR', data: r.data?.data?.basicdata };
}

module.exports = { censusMecklenburg, permitsNear, rentEstimate, hudFmr };
