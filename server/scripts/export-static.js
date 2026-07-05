// Export a static snapshot of the database for the GitHub Pages build.
// Runs the aggregator (so the DB is fresh), then writes everything the
// frontend needs into client/public/data.json. The static build reads this
// instead of calling the Express API.
const path = require('path');
const fs = require('fs');
const { runAllScrapers } = require('../src/aggregate');
const { getListings, getScrapeLogs, db } = require('../src/db');
const { getMarketIntel } = require('../src/market');
const { getBuilderProfiles } = require('../src/builderProfiles');
const { createPublicSnapshot } = require('../src/publicSnapshot');

async function main() {
  const count = db.prepare('SELECT COUNT(*) as c FROM listings WHERE is_active=1').get().c;
  if (count === 0 || process.argv.includes('--refresh')) {
    console.log('[export] Seeding database…');
    await runAllScrapers();
  }

  const listings = getListings({ limit: 1000 });
  const logs = getScrapeLogs(50);

  const snapshot = createPublicSnapshot({
    generatedAt: new Date().toISOString(),
    listings,
    logs,
    market: getMarketIntel(),
    builderProfiles: getBuilderProfiles(),
  });

  const outPath = path.join(__dirname, '..', '..', 'client', 'public', 'data.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`[export] Wrote ${snapshot.listings.length} public listings to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
