// Change digest: what moved since the last look. This is what makes the
// pipeline a monitor instead of a scraper — the state store (listings.db)
// diffs every run, and this module composes only the deltas: new listings,
// price changes, status flips, and listings that went dark.
//
// A private thesis file (server/data/thesis.json, gitignored — copy
// thesis.example.json) defines corridors, price bands, and criteria; matches
// are ranked first so the digest reads signal-first. Composition is pure
// (composeDigest) so it is testable without a database.
const fs = require('fs');
const path = require('path');
const { db } = require('./db');

const THESIS_PATH = path.join(__dirname, '..', 'data', 'thesis.json');
const EXAMPLE_PATH = path.join(__dirname, '..', 'data', 'thesis.example.json');

function loadThesis() {
  for (const p of [THESIS_PATH, EXAMPLE_PATH]) {
    try { return { ...JSON.parse(fs.readFileSync(p, 'utf8')), _file: path.basename(p) }; } catch { /* next */ }
  }
  return null;
}

// A listing matches the thesis when it fits any corridor (zip or city) AND
// the price band AND every required boolean criterion.
function matchesThesis(listing, thesis) {
  if (!thesis) return false;
  const inCorridor = !thesis.corridors?.length || thesis.corridors.some(c =>
    (c.zips || []).includes(String(listing.zip))
    || (c.cities || []).some(city => city.toLowerCase() === String(listing.city || '').toLowerCase()));
  const inBand = (!thesis.price_min || listing.price >= thesis.price_min)
    && (!thesis.price_max || listing.price <= thesis.price_max);
  const criteria = thesis.criteria || {};
  const meets = Object.entries(criteria).every(([key, want]) => !want || Boolean(listing[key]));
  return inCorridor && inBand && meets;
}

function fetchChanges(sinceIso) {
  const newListings = db.prepare(`
    SELECT * FROM listings WHERE is_active = 1 AND created_at >= ?
  `).all(sinceIso);
  const priceChanges = db.prepare(`
    SELECT l.*, ph.price AS prior_price, ph.recorded_at
    FROM price_history ph JOIN listings l ON l.id = ph.listing_id
    WHERE ph.recorded_at >= ? AND l.is_active = 1
  `).all(sinceIso);
  const statusFlips = db.prepare(`
    SELECT l.*, sh.from_status, sh.to_status, sh.changed_at
    FROM status_history sh JOIN listings l ON l.id = sh.listing_id
    WHERE sh.changed_at >= ?
  `).all(sinceIso);
  const wentDark = db.prepare(`
    SELECT * FROM listings WHERE is_active = 0 AND updated_at >= ? AND last_seen < ?
  `).all(sinceIso, sinceIso);
  return { newListings, priceChanges, statusFlips, wentDark };
}

// Pure: rows in, ranked digest out.
function composeDigest({ newListings, priceChanges, statusFlips, wentDark }, thesis, sinceIso) {
  const tag = l => ({ ...l, thesis_match: matchesThesis(l, thesis) });
  const rank = rows => rows.map(tag).sort((a, b) => b.thesis_match - a.thesis_match || (a.price || 0) - (b.price || 0));
  const drops = priceChanges.filter(c => c.price < c.prior_price)
    .map(c => ({ ...c, delta: c.price - c.prior_price }));
  const hikes = priceChanges.filter(c => c.price > c.prior_price)
    .map(c => ({ ...c, delta: c.price - c.prior_price }));
  return {
    since: sinceIso,
    thesis_file: thesis?._file || null,
    new_listings: rank(newListings),
    price_drops: rank(drops),
    price_hikes: rank(hikes),
    status_flips: rank(statusFlips),
    went_dark: rank(wentDark),
    counts: {
      new: newListings.length,
      drops: drops.length,
      hikes: hikes.length,
      flips: statusFlips.length,
      dark: wentDark.length,
    },
  };
}

function getDigest(sinceIso) {
  const since = sinceIso || new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  return composeDigest(fetchChanges(since), loadThesis(), since);
}

// Plain-text rendering for the CLI (npm run digest) and anything that wants
// a pasteable summary.
const usd = n => `$${Math.round(n).toLocaleString()}`;
function line(l, extra = '') {
  return `  ${l.thesis_match ? '★' : ' '} ${usd(l.price || 0).padEnd(9)} ${l.address || '(no address)'} [${l.source}]${extra}`;
}

function digestText(d) {
  const out = [`CHANGES SINCE ${d.since}${d.thesis_file ? ` — thesis: ${d.thesis_file} (★ = match)` : ''}`, ''];
  const section = (title, rows, fmt) => {
    out.push(`${title} (${rows.length})`);
    out.push(...(rows.length ? rows.map(fmt) : ['  none']));
    out.push('');
  };
  section('NEW LISTINGS', d.new_listings, l => line(l));
  section('PRICE DROPS', d.price_drops, l => line(l, ` was ${usd(l.prior_price)} (${usd(l.delta)})`));
  section('PRICE HIKES', d.price_hikes, l => line(l, ` was ${usd(l.prior_price)} (+${usd(l.delta)})`));
  section('STATUS FLIPS', d.status_flips, l => line(l, ` ${l.from_status} -> ${l.to_status}`));
  section('WENT DARK', d.went_dark, l => line(l, ' (no longer seen by any source)'));
  return out.join('\n');
}

module.exports = { getDigest, composeDigest, matchesThesis, digestText, loadThesis };
