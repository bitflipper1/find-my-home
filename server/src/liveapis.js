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

// ---- Official Charlotte/Meck REST layers (documented endpoints from the
// public-data-stack research). All keyless; all degrade gracefully. ----

// Charlotte Future 2040 Policy Map — place types near a point (the official
// future-growth intent layer; policy guidance, not entitlement).
async function policyMapNear(lat, lng, radiusMeters = 800) {
  const base = 'https://services.arcgis.com/9Nl857LBlQVyzq54/arcgis/rest/services/Charlotte_Future_2040_Policy_Map/FeatureServer/0/query';
  const r = await safeGet(base, { params: {
    geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint', inSR: 4326,
    distance: radiusMeters, units: 'esriSRUnit_Meter', spatialRel: 'esriSpatialRelIntersects',
    outFields: 'PlaceTypeFullTxt,PlaceTypeCde', returnGeometry: false, f: 'json',
  }});
  if (!r.ok) return r;
  const types = [...new Set((r.data?.features || []).map(f => f.attributes.PlaceTypeFullTxt))];
  const boom = types.filter(t => /Activity Center|Neighborhood Center|Innovation/i.test(t || ''));
  return { ok: true, source: '2040 Policy Map', place_types: types, boom_signal_types: boom };
}

// Pending rezonings near a point — the live entitlement-change pipeline.
async function rezoningsNear(lat, lng, radiusMeters = 1609) {
  const base = 'https://gis.charlottenc.gov/arcgis/rest/services/PLN/Rezonings/MapServer/0/query';
  const r = await safeGet(base, { params: {
    geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint', inSR: 4326,
    distance: radiusMeters, units: 'esriSRUnit_Meter', spatialRel: 'esriSpatialRelIntersects',
    outFields: '*', returnGeometry: false, f: 'json', resultRecordCount: 50,
  }});
  if (!r.ok) return r;
  return { ok: true, source: 'PLN Rezonings', count: (r.data?.features || []).length, petitions: (r.data?.features || []).slice(0, 15).map(f => f.attributes) };
}

// CMPD incidents near a point — property-crime screen (last 12 months).
async function crimeNear(lat, lng, radiusMeters = 800) {
  const since = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const base = 'https://gis.charlottenc.gov/arcgis/rest/services/CMPD/CMPDIncidents/MapServer/0/query';
  const r = await safeGet(base, { params: {
    geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint', inSR: 4326,
    distance: radiusMeters, units: 'esriSRUnit_Meter', spatialRel: 'esriSpatialRelIntersects',
    where: `DATE_REPORTED >= DATE '${since}'`,
    outFields: 'DATE_REPORTED,NPA,HIGHEST_NIBRS_DESCRIPTION,CLEARANCE_STATUS',
    returnGeometry: false, f: 'json', resultRecordCount: 500,
  }});
  if (!r.ok) return r;
  const feats = (r.data?.features || []).map(f => f.attributes);
  const byType = {};
  feats.forEach(a => { const k = a.HIGHEST_NIBRS_DESCRIPTION || 'UNKNOWN'; byType[k] = (byType[k] || 0) + 1; });
  return { ok: true, source: 'CMPD incidents (12 mo)', total: feats.length, by_type: byType };
}

// Land-development commercial pipeline near a point — Active/Pre-Submittal
// projects are the earliest supply signal.
async function pipelineNear(lat, lng, radiusMeters = 1609) {
  const base = 'https://services.arcgis.com/9Nl857LBlQVyzq54/arcgis/rest/services/Land_Development_Commercial_Projects/FeatureServer/0/query';
  const r = await safeGet(base, { params: {
    geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint', inSR: 4326,
    distance: radiusMeters, units: 'esriSRUnit_Meter', spatialRel: 'esriSpatialRelIntersects',
    outFields: '*', returnGeometry: false, f: 'json', resultRecordCount: 50,
  }});
  if (!r.ok) return r;
  return { ok: true, source: 'Land Dev Commercial Projects', count: (r.data?.features || []).length, projects: (r.data?.features || []).slice(0, 15).map(f => f.attributes) };
}

// Parcel zoning lookup by PID.
async function parcelByPid(pid) {
  const base = 'https://gis.charlottenc.gov/arcgis/rest/services/ODP/Parcel_Zoning_Lookup/MapServer/0/query';
  const r = await safeGet(base, { params: { where: `PID='${String(pid).replace(/[^0-9A-Za-z]/g, '')}'`, outFields: '*', returnGeometry: false, f: 'json' } });
  if (!r.ok) return r;
  return { ok: true, source: 'Parcel Zoning Lookup', parcel: r.data?.features?.[0]?.attributes || null };
}

// ---- Premium data providers (paid keys; both degrade gracefully). ----

// ATTOM Data — 160M+ US properties: expanded profile, AVM, sales history,
// all-events. Header auth: `apikey`. Base plan ~$95/mo (30-day trial available).
// Key: ATTOM_API_KEY (api.developer.attomdata.com).
const ATTOM_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

async function attomCall(resource, params) {
  if (!process.env.ATTOM_API_KEY) return { ok: false, reason: 'ATTOM_API_KEY not set (trial key: api.developer.attomdata.com)' };
  return safeGet(`${ATTOM_BASE}/${resource}`, {
    params, headers: { apikey: process.env.ATTOM_API_KEY, Accept: 'application/json' },
  });
}

// Assessor + owner + latest loan/transaction for an address.
// address1 = street, address2 = "City, ST" or zip.
async function attomProfile(address1, address2) {
  const r = await attomCall('property/expandedprofile', { address1, address2 });
  if (!r.ok) return r;
  return { ok: true, source: 'ATTOM expanded profile', property: r.data?.property?.[0] || null };
}

// ATTOM AVM — market-value estimate with high/low band.
async function attomAvm(address1, address2) {
  const r = await attomCall('attomavm/detail', { address1, address2 });
  if (!r.ok) return r;
  const p = r.data?.property?.[0];
  return { ok: true, source: 'ATTOM AVM', avm: p?.avm?.amount || null, address: p?.address || null };
}

// Recorded sales history (10 yrs) — the resale-velocity check for a community.
async function attomSalesHistory(address1, address2) {
  const r = await attomCall('saleshistory/detail', { address1, address2 });
  if (!r.ok) return r;
  const p = r.data?.property?.[0];
  return { ok: true, source: 'ATTOM sales history', history: p?.salehistory || [], address: p?.address || null };
}

// HouseCanary — AVM + rental AVM + 36-month value forecasts, block→state
// granularity. Basic auth key:secret on api.housecanary.com/v2.
// Keys: HC_API_KEY + HC_API_SECRET (housecanary.com Data Explorer / API).
async function hcCall(target, address, zipcode) {
  if (!process.env.HC_API_KEY || !process.env.HC_API_SECRET) {
    return { ok: false, reason: 'HC_API_KEY / HC_API_SECRET not set (housecanary.com/products/data-explorer)' };
  }
  return safeGet(`https://api.housecanary.com/v2/property/${target}`, {
    params: { address, zipcode },
    auth: { username: process.env.HC_API_KEY, password: process.env.HC_API_SECRET },
  });
}

const hcResult = (r, target) => {
  if (!r.ok) return r;
  const item = Array.isArray(r.data) ? r.data[0] : r.data;
  return { ok: true, source: `HouseCanary ${target}`, result: item?.[`property/${target}`]?.result ?? item };
};

async function hcValue(address, zipcode) { return hcResult(await hcCall('value', address, zipcode), 'value'); }
async function hcRentalValue(address, zipcode) { return hcResult(await hcCall('rental_value', address, zipcode), 'rental_value'); }
async function hcValueForecast(address, zipcode) { return hcResult(await hcCall('value_forecast', address, zipcode), 'value_forecast'); }

module.exports = {
  censusMecklenburg, permitsNear, rentEstimate, hudFmr, policyMapNear, rezoningsNear, crimeNear, pipelineNear, parcelByPid,
  attomProfile, attomAvm, attomSalesHistory, hcValue, hcRentalValue, hcValueForecast,
};
