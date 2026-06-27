const { scrapeZillow } = require('./scrapers/zillow');
const { scrapeRealtor } = require('./scrapers/realtor');
const { scrapeOpendoor } = require('./scrapers/opendoor');
const { scrapeNewHomeSource } = require('./scrapers/newhomesource');
const { scrapeHomes } = require('./scrapers/homes');
const { scrapeAllBuilders } = require('./scrapers/builders');
const { searchEmails } = require('./gmail');
const { upsertListing, logScrape, markStaleListings, db } = require('./db');

const SOURCES = [
  { name: 'zillow', fn: scrapeZillow, label: 'Zillow' },
  { name: 'realtor', fn: scrapeRealtor, label: 'Realtor.com' },
  { name: 'opendoor', fn: scrapeOpendoor, label: 'Opendoor' },
  { name: 'newhomesource', fn: scrapeNewHomeSource, label: 'NewHomeSource' },
  { name: 'homes', fn: scrapeHomes, label: 'Homes.com' },
  { name: 'builders', fn: scrapeAllBuilders, label: 'Builder Sites' },
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
