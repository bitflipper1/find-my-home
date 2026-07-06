// Listing art — deterministic SVG renders for listings that have no photo.
//
// Every render is generated from the listing's own attributes (beds → window
// bays, sqft → stories, builder → brand accent, furnished → lit windows,
// model → banner), so the image reflects THE listing, not a stock photo.
// Renders are labeled "illustrative" and are fully self-generated: no
// hot-linked portal/MLS photos, which matters once the app charges for access.
//
// Output is a data: URI, so it bakes straight into the static data.json and
// needs no image hosting.

const BRAND = {
  'David Weekley': '#c8102e',
  'David Weekley Homes': '#c8102e',
  'Tri Pointe': '#1b3a5c',
  'Tri Pointe Homes': '#1b3a5c',
  'Ryan Homes': '#2b6cb0',
  'Lennar': '#00539f',
  'D.R. Horton': '#0f7a3d',
  'DR Horton': '#0f7a3d',
  'Mungo Homes': '#8a1f2d',
  'Meritage Homes': '#d97706',
  'Meritage': '#d97706',
  'Eastwood Homes': '#b45309',
  'Smith Douglas': '#4d7c0f',
  'Pulte': '#7c3aed',
  'Toll Brothers': '#334155',
  'M/I Homes': '#0e7490',
  'Dream Finders': '#9333ea',
  'True Homes': '#0d9488',
};

const BRICK = ['#b0836a', '#9aa5b1', '#c9b8a3', '#8d9b8a', '#b8a08d'];
const TRIM = '#f5f2ec';

// Small deterministic hash → stable per-listing variation.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function listingArt(listing) {
  const h = hash(listing.id || listing.address || 'x');
  const accent = BRAND[listing.builder] || '#0f766e';
  const facade = BRICK[h % BRICK.length];
  const facade2 = BRICK[(h + 2) % BRICK.length];
  const bays = Math.min(4, Math.max(2, listing.beds || 3));           // window bays = beds
  const stories = (listing.sqft || 1500) > 1750 ? 3 : 2;              // 3-story over ~1750 sqft
  const furnished = listing.is_furnished === 1 || listing.is_furnished === true;
  const isModel = listing.is_model === 1 || listing.is_model === true;
  const duskiness = (h >>> 4) % 3;                                     // sky variation

  const skies = [
    ['#dbeafe', '#eff6ff'], // day
    ['#bfdbfe', '#e0f2fe'], // bright
    ['#fde68a', '#dbeafe'], // golden hour
  ];
  const [skyTop, skyBot] = skies[furnished ? 2 : duskiness];          // furnished = warm golden light

  const W = 400, H = 220, ground = 182;
  const bW = 190, bX = (W - bW) / 2;
  const floorH = 42, roofH = 16;
  const bTop = ground - stories * floorH - roofH;

  let el = '';
  // sky + ground
  el += `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBot}"/></linearGradient></defs>`;
  el += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  el += `<rect y="${ground}" width="${W}" height="${H - ground}" fill="#8fae87"/>`;
  el += `<rect y="${ground}" width="${W}" height="4" fill="#7a9a72"/>`;

  // background rooflines (the rest of the townhome row)
  el += `<rect x="${bX - 60}" y="${bTop + 26}" width="70" height="${ground - bTop - 26}" fill="${facade2}" opacity="0.55"/>`;
  el += `<rect x="${bX + bW - 10}" y="${bTop + 34}" width="70" height="${ground - bTop - 34}" fill="${facade2}" opacity="0.55"/>`;

  // main unit
  el += `<rect x="${bX}" y="${bTop + roofH}" width="${bW}" height="${stories * floorH}" fill="${facade}"/>`;
  // roof (gable or flat-parapet by hash)
  if (h % 2 === 0) {
    el += `<polygon points="${bX - 8},${bTop + roofH} ${bX + bW / 2},${bTop - 6} ${bX + bW + 8},${bTop + roofH}" fill="#4b5563"/>`;
  } else {
    el += `<rect x="${bX - 6}" y="${bTop + 4}" width="${bW + 12}" height="${roofH}" fill="#4b5563"/>`;
  }

  // window bays per story (top stories) + entry level
  const gap = 12, bayW = (bW - gap * (bays + 1)) / bays;
  const winFill = furnished ? '#fbbf24' : '#bfdbfe';
  const winStroke = furnished ? '#d97706' : '#64748b';
  for (let s = 0; s < stories - 1; s++) {
    const wy = bTop + roofH + 8 + s * floorH;
    for (let b = 0; b < bays; b++) {
      const wx = bX + gap + b * (bayW + gap);
      el += `<rect x="${wx}" y="${wy}" width="${bayW}" height="${floorH - 16}" rx="2" fill="${winFill}" stroke="${winStroke}" stroke-width="1.5"/>`;
      el += `<line x1="${wx + bayW / 2}" y1="${wy}" x2="${wx + bayW / 2}" y2="${wy + floorH - 16}" stroke="${winStroke}" stroke-width="1"/>`;
    }
  }
  // entry level: door (brand color) with sidelight + garage
  const ey = ground - floorH + 6;
  const doorW = 22, doorX = bX + gap;
  el += `<rect x="${doorX - 3}" y="${ey - 3}" width="${doorW + 6}" height="${floorH - 3}" fill="${TRIM}"/>`;
  el += `<rect x="${doorX}" y="${ey}" width="${doorW}" height="${floorH - 6}" rx="2" fill="${accent}"/>`;
  el += `<circle cx="${doorX + doorW - 5}" cy="${ey + (floorH - 6) / 2}" r="2" fill="${TRIM}"/>`;
  const garX = doorX + doorW + 16, garW = bX + bW - gap - garX;
  el += `<rect x="${garX}" y="${ey + 2}" width="${garW}" height="${floorH - 8}" rx="3" fill="#6b7280"/>`;
  el += `<g stroke="#9ca3af" stroke-width="1.5">` +
    [1, 2, 3].map(i => `<line x1="${garX + 2}" y1="${ey + 2 + i * (floorH - 8) / 4}" x2="${garX + garW - 2}" y2="${ey + 2 + i * (floorH - 8) / 4}"/>`).join('') + `</g>`;
  // trim band between floors
  for (let s = 1; s < stories; s++) {
    el += `<rect x="${bX}" y="${bTop + roofH + s * floorH - 2}" width="${bW}" height="3" fill="${TRIM}" opacity="0.8"/>`;
  }

  // landscaping — positions vary by hash
  const t1 = 30 + (h % 40), t2 = W - 60 - ((h >>> 8) % 40);
  for (const tx of [t1, t2]) {
    el += `<rect x="${tx - 2}" y="${ground - 26}" width="5" height="26" fill="#7c5a3c"/>`;
    el += `<circle cx="${tx}" cy="${ground - 34}" r="16" fill="#5f8f56"/><circle cx="${tx + 9}" cy="${ground - 26}" r="11" fill="#6da063"/>`;
  }
  el += `<rect x="${bX + 8}" y="${ground - 3}" width="${bW - 16}" height="6" rx="3" fill="#94a688"/>`;

  // model banner
  if (isModel) {
    el += `<rect x="${bX + bW - 14}" y="${bTop + roofH + 6}" width="4" height="34" fill="#4b5563"/>`;
    el += `<path d="M ${bX + bW - 10} ${bTop + roofH + 6} h 44 l -8 7 8 7 h -44 z" fill="${accent}"/>`;
    el += `<text x="${bX + bW + 11}" y="${bTop + roofH + 16}" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">MODEL</text>`;
  }

  // caption bar: honest label + what the render encodes
  const cap = [listing.community || listing.city, listing.builder].filter(Boolean).join(' · ');
  el += `<rect y="${H - 22}" width="${W}" height="22" fill="#0f172a" opacity="0.78"/>`;
  el += `<text x="10" y="${H - 8}" font-family="Arial,sans-serif" font-size="10" fill="#e2e8f0">${esc(cap).slice(0, 52)}</text>`;
  el += `<text x="${W - 10}" y="${H - 8}" font-family="Arial,sans-serif" font-size="9" fill="#94a3b8" text-anchor="end">Illustrative render</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${el}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

module.exports = { listingArt };
