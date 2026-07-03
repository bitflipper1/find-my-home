// Export a static snapshot of the database for the GitHub Pages build.
// Runs the aggregator (so the DB is fresh), then writes everything the
// frontend needs into client/public/data.json. The static build reads this
// instead of calling the Express API.
const path = require('path');
const fs = require('fs');
const { runAllScrapers } = require('../src/aggregate');
const { getListings, getStats, getScrapeLogs, db } = require('../src/db');
const { getMarketIntel } = require('../src/market');

async function main() {
  const count = db.prepare('SELECT COUNT(*) as c FROM listings WHERE is_active=1').get().c;
  if (count === 0 || process.argv.includes('--refresh')) {
    console.log('[export] Seeding database…');
    await runAllScrapers();
  }

  const listings = getListings({ limit: 1000 });
  const stats = getStats();
  const logs = getScrapeLogs(50);
  const leads = db.prepare('SELECT * FROM email_leads ORDER BY received_at DESC LIMIT 100').all();
  const builders = db.prepare(`
    SELECT builder, COUNT(*) as count, MIN(price) as min_price, MAX(price) as max_price, AVG(price) as avg_price
    FROM listings WHERE is_active=1 AND builder IS NOT NULL
    GROUP BY builder ORDER BY count DESC
  `).all();
  const cities = db.prepare(`
    SELECT city, COUNT(*) as count FROM listings
    WHERE is_active=1 AND city IS NOT NULL GROUP BY city ORDER BY count DESC
  `).all();

  const snapshot = {
    generated_at: new Date().toISOString(),
    listings,
    stats,
    logs,
    leads,
    builders,
    cities,
    market: getMarketIntel(),
    research: (() => {
      const f = path.join(__dirname, '..', 'data', 'research.json');
      return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
    })(),
  };

  const outPath = path.join(__dirname, '..', '..', 'client', 'public', 'data.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`[export] Wrote ${listings.length} listings, ${leads.length} leads to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
