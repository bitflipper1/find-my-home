const { scrapeZillow } = require('./scrapers/zillow');
const { scrapeRealtor } = require('./scrapers/realtor');
const { scrapeOpendoor } = require('./scrapers/opendoor');
const { scrapeNewHomeSource } = require('./scrapers/newhomesource');
const { scrapeHomes } = require('./scrapers/homes');
const { scrapeAllBuilders } = require('./scrapers/builders');
const { scrapeHeadlessBuilders } = require('./scrapers/headless');
const { searchEmails } = require('./gmail');
const { upsertListing, logScrape, markStaleListings, db } = require('./db');
const fs = require('fs');
const path = require('path');

// Real listings extracted from your inbox by the Gmail connector scan.
function loadGmailListings() {
  const file = path.join(__dirname, '..', 'data', 'gmail-listings.json');
  try {
    if (!fs.existsSync(file)) return [];
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return (raw.listings || []).filter(l => l.id && l.address);
  } catch (err) {
    console.error('[Aggregate] Could not read gmail-listings.json:', err.message);
    return [];
  }
}

// Curated model-home / furnished / leaseback opportunities.
// Four early entries were traced back to fabricated sample data (their
// addresses match the old scraper fallbacks and the communities don't
// exist as named) — filter them even if an older data file is in place.
const FABRICATED_MODEL_IDS = new Set([
  'model_lennar_sterling_pointe', 'model_drh_mallard_pointe',
  'model_sd_university_townes', 'model_century_gastonia',
]);

function loadModelHomes() {
  const file = path.join(__dirname, '..', 'data', 'model-homes.json');
  try {
    if (!fs.existsSync(file)) return [];
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return (raw.listings || []).filter(l => l.id && l.address && !FABRICATED_MODEL_IDS.has(l.id));
  } catch (err) {
    console.error('[Aggregate] Could not read model-homes.json:', err.message);
    return [];
  }
}

const SOURCES = [
  { name: 'gmail', fn: async () => loadGmailListings(), label: 'Your Gmail Inbox' },
  { name: 'models', fn: async () => loadModelHomes(), label: 'Model Home Leads' },
  { name: 'zillow', fn: scrapeZillow, label: 'Zillow' },
  { name: 'realtor', fn: scrapeRealtor, label: 'Realtor.com' },
  { name: 'opendoor', fn: scrapeOpendoor, label: 'Opendoor' },
  { name: 'newhomesource', fn: scrapeNewHomeSource, label: 'NewHomeSource' },
  { name: 'homes', fn: scrapeHomes, label: 'Homes.com' },
  { name: 'builders', fn: scrapeAllBuilders, label: 'Builder Sites' },
  // Real-browser scrapes of David Weekley / Lennar / Tri Pointe / Mungo —
  // these sites block plain HTTP or render inventory with JavaScript.
  { name: 'headless', fn: scrapeHeadlessBuilders, label: 'Builder Sites (headless)' },
];

async function runAllScrapers() {
  console.log('[Aggregate] Starting full scrape run...');
  const results = [];

  for (const source of SOURCES) {
    try {
      console.log(`[Aggregate] Scraping ${source.label}...`);
      const listings = await source.fn();
      const counts = { found: listings.length, created: 0, updated: 0 };

      for (const listing of listings) {
        const { action } = upsertListing(listing);
        if (action === 'created') counts.created++;
        else counts.updated++;
      }

      logScrape(source.name, 'success', counts);
      results.push({ source: source.name, ...counts });
      console.log(`[Aggregate] ${source.label}: ${counts.found} found, ${counts.created} new, ${counts.updated} updated`);

      // Polite delay between sources
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[Aggregate] ${source.label} failed:`, err.message);
      logScrape(source.name, 'error', {}, err.message);
      results.push({ source: source.name, error: err.message });
    }
  }

  // Scan Gmail for leads
  try {
    const { emails, error } = await searchEmails();
    if (emails.length > 0) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO email_leads (gmail_id, subject, sender, body_snippet, listing_address, price, builder, received_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of emails) {
        stmt.run(e.gmail_id, e.subject, e.sender, e.body_snippet, e.listing_address, e.price, e.builder, e.received_at);
      }
      console.log(`[Aggregate] Gmail: ${emails.length} relevant emails found`);
    }
  } catch (err) {
    console.error('[Aggregate] Gmail scan failed:', err.message);
  }

  // Mark old listings as inactive
  const stale = markStaleListings();
  if (stale > 0) console.log(`[Aggregate] Marked ${stale} stale listings inactive`);

  console.log('[Aggregate] Scrape run complete.');
  return results;
}

module.exports = { runAllScrapers };
