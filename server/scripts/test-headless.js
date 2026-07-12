// Manual test-drive for the headless builder scrapers:
//   cd server && npm run scrape:headless
// Prints what each site yields without touching the database.
require('dotenv').config();
const { scrapeHeadlessBuilders } = require('../src/scrapers/headless');

(async () => {
  console.log('Running headless builder scrape (David Weekley, Lennar, Tri Pointe, Mungo)...\n');
  const listings = await scrapeHeadlessBuilders();
  const bySource = {};
  for (const l of listings) (bySource[l.source] ||= []).push(l);
  for (const [source, ls] of Object.entries(bySource)) {
    console.log(`\n== ${source} — ${ls.length} listings ==`);
    for (const l of ls.slice(0, 10)) {
      console.log(`  $${(l.price || 0).toLocaleString().padEnd(9)} ${l.address}${l.community ? `  (${l.community})` : ''}`);
    }
    if (ls.length > 10) console.log(`  ...and ${ls.length - 10} more`);
  }
  if (!listings.length) {
    console.log('No listings extracted. If playwright is missing, run: npm install');
  }
  process.exit(0);
})();
