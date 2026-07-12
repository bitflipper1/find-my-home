// Headless-browser scrapers for builder sites that block plain HTTP or
// render listings with JavaScript. Builders advertise this inventory
// publicly and use little bot protection, unlike the consumer portals.
//
// Playwright is loaded lazily: if it isn't installed the source degrades to
// an empty result with a clear log line instead of crashing the pipeline.
// Extraction is layered for resilience against redesigns:
//   1. schema.org JSON-LD blocks (most builder sites embed these)
//   2. framework state (__NEXT_DATA__ / __NUXT__)
//   3. DOM heuristics: cards containing both a $price and an address-ish line
const crypto = require('crypto');

const NAV_TIMEOUT = 30000;
const PER_SITE_BUDGET = 60000; // total ms per site, so one slow site can't stall the run

function makeId(source, key) {
  return `${source}_${crypto.createHash('md5').update(String(key)).digest('hex').slice(0, 12)}`;
}

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    console.error('[Headless] playwright not installed — run `npm install` in server/ (first install downloads a browser)');
    return null;
  }
}

async function launch(pw) {
  const opts = { headless: true };
  // Sandboxed environments route egress through a proxy; a real Mac won't
  // have HTTPS_PROXY set and launches directly.
  if (process.env.HTTPS_PROXY) opts.proxy = { server: process.env.HTTPS_PROXY };
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) opts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  return pw.chromium.launch(opts);
}

// ---- extraction layers -----------------------------------------------------

// JSON-LD: builder pages commonly embed Product/SingleFamilyResidence/Offer
// nodes with name, address, and price.
function fromJsonLd(blocks) {
  const out = [];
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    const type = String(node['@type'] || '');
    const price = node.offers?.price ?? node.price ?? null;
    const addr = node.address;
    if ((/Residence|Product|House|Apartment|Accommodation/i.test(type)) && (price || addr)) {
      out.push({
        name: node.name || '',
        price: parseInt(String(price || '').replace(/[^0-9]/g, '')) || null,
        street: addr?.streetAddress || '',
        city: addr?.addressLocality || '',
        state: addr?.addressRegion || '',
        zip: addr?.postalCode || '',
        url: node.url || node.offers?.url || null,
        beds: node.numberOfBedrooms ?? null,
        baths: node.numberOfBathroomsTotal ?? node.numberOfFullBathrooms ?? null,
        sqft: parseInt(String(node.floorSize?.value || '').replace(/[^0-9]/g, '')) || null,
      });
    }
    Object.values(node).forEach(walk);
  };
  blocks.forEach(b => { try { walk(JSON.parse(b)); } catch { /* malformed block */ } });
  return out;
}

// DOM heuristic run inside the page: find repeated card-like elements that
// contain both a price and something address-shaped.
const DOM_HARVEST = `
(() => {
  const priceRe = /\\$\\s?([2-9]\\d{2}[,.]?\\d{3})/;
  const addrRe = /\\d{2,5}\\s+[A-Z][A-Za-z]+.{0,40}(?:NC|SC|\\d{5})|\\d{2,5}\\s+[A-Z][A-Za-z]+\\s+(?:St|Ave|Dr|Rd|Ln|Ct|Way|Blvd|Trl|Pl)\\b/;
  const seen = new Set();
  const cards = [];
  for (const el of document.querySelectorAll('a[href], article, li, div')) {
    const t = (el.innerText || '').trim();
    if (t.length < 20 || t.length > 600) continue;
    const pm = t.match(priceRe);
    const am = t.match(addrRe);
    if (!pm || !am) continue;
    const key = am[0] + pm[1];
    if (seen.has(key)) continue;
    // prefer the innermost matching element: skip if a child already matched
    if (cards.some(c => el.contains(c.el))) continue;
    seen.add(key);
    const link = el.closest('a[href]')?.href || el.querySelector('a[href]')?.href || location.href;
    cards.push({ el, text: t.slice(0, 400), price: pm[1], address: am[0], url: link });
  }
  return cards.map(({ text, price, address, url }) => ({ text, price, address, url }));
})()
`;

async function harvestPage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await page.waitForTimeout(4000); // let client-side rendering settle
  const ld = await page.$$eval('script[type="application/ld+json"]', els => els.map(e => e.textContent));
  const structured = fromJsonLd(ld);
  if (structured.length) return { items: structured, via: 'json-ld' };
  const cards = await page.evaluate(DOM_HARVEST);
  return {
    items: cards.map(c => ({
      name: '',
      price: parseInt(String(c.price).replace(/[^0-9]/g, '')) || null,
      street: c.address, city: '', state: '', zip: '',
      url: c.url, beds: null, baths: null, sqft: null,
    })),
    via: 'dom',
  };
}

// ---- per-builder configs ---------------------------------------------------

const SITES = [
  {
    source: 'davidweekley', builder: 'David Weekley Homes',
    urls: ['https://www.davidweekleyhomes.com/new-homes/nc/charlotte'],
  },
  {
    source: 'lennar', builder: 'Lennar',
    urls: ['https://www.lennar.com/new-homes/north-carolina/charlotte'],
  },
  {
    source: 'tripointe', builder: 'Tri Pointe Homes',
    urls: ['https://www.tripointehomes.com/nc/charlotte/'],
  },
  {
    source: 'mungo', builder: 'Mungo Homes',
    urls: ['https://www.mungo.com/communities/charlotte/charlotte-nc'],
  },
];

function toListing(site, item, pageUrl) {
  const address = [item.street, item.city, item.state, item.zip].filter(Boolean).join(', ') || item.name;
  if (!address || !item.price) return null;
  return {
    id: makeId(site.source, address),
    source: site.source,
    url: item.url || pageUrl,
    address,
    city: item.city || 'Charlotte',
    state: item.state || 'NC',
    zip: item.zip || '',
    price: item.price,
    beds: item.beds, baths: item.baths, sqft: item.sqft,
    type: 'Townhome',
    status: 'for_sale',
    builder: site.builder,
    community: item.name || null,
    images: [],
    is_new_construction: 1,
  };
}

async function scrapeHeadlessBuilders() {
  const pw = loadPlaywright();
  if (!pw) return [];

  let browser;
  try {
    browser = await launch(pw);
  } catch (err) {
    console.error('[Headless] browser launch failed:', err.message);
    return [];
  }

  const results = [];
  try {
    for (const site of SITES) {
      const started = Date.now();
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      });
      try {
        for (const url of site.urls) {
          if (Date.now() - started > PER_SITE_BUDGET) break;
          const { items, via } = await harvestPage(page, url);
          const listings = items.map(i => toListing(site, i, url)).filter(Boolean);
          console.log(`[Headless] ${site.builder}: ${listings.length} listings via ${via} (${url})`);
          results.push(...listings);
        }
      } catch (err) {
        console.error(`[Headless] ${site.builder} failed:`, err.message);
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  // De-dupe across pages by id
  const byId = new Map();
  for (const l of results) byId.set(l.id, l);
  return [...byId.values()];
}

// harvestPage/fromJsonLd/toListing exported for the fixture tests in
// server/scripts — not part of the scraping API.
module.exports = { scrapeHeadlessBuilders, SITES, harvestPage, fromJsonLd, toListing, launch, loadPlaywright };
