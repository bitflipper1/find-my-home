// Import tour entries into My Tours (tracked_places):
//   cd server && npm run import:tours -- path/to/tours-seed.json
//
// The seed file is private (tour history is personal data) and is never
// committed — this script is the generic loader. Entries are matched by
// address: existing places are left untouched, so re-running is safe.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db, saveTrackedPlace } = require('../src/db');

const seedPath = process.argv[2];
if (!seedPath) {
  console.error('Usage: npm run import:tours -- path/to/tours-seed.json');
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync(path.resolve(seedPath), 'utf8'));
const places = seed.places || [];
let added = 0, skipped = 0;

for (const p of places) {
  const existing = db.prepare('SELECT id FROM tracked_places WHERE address = ?').get(p.address);
  if (existing) { skipped++; continue; }
  saveTrackedPlace(p);
  added++;
  console.log(`+ ${p.address} (${p.status || 'considering'})`);
}

console.log(`\nDone: ${added} added, ${skipped} already present.`);
