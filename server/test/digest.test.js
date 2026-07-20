// The digest composer is pure: rows in, ranked deltas out. These tests pin
// thesis matching, ranking, and the drop/hike split without touching the DB.
const { test } = require('node:test');
const assert = require('node:assert');
const { composeDigest, matchesThesis } = require('../src/digest');

const thesis = {
  corridors: [{ name: 'west', zips: ['28208'], cities: ['Belmont'] }],
  price_min: 250000,
  price_max: 400000,
  criteria: { is_new_construction: true },
};

const westMatch = { id: 'a', address: '1 West St', zip: '28208', city: 'Charlotte', price: 300000, is_new_construction: 1, source: 'rentcast' };
const tooRich = { id: 'b', address: '2 Pricey Ln', zip: '28208', city: 'Charlotte', price: 450000, is_new_construction: 1, source: 'rentcast' };
const wrongZip = { id: 'c', address: '3 Elsewhere Rd', zip: '28277', city: 'Charlotte', price: 300000, is_new_construction: 1, source: 'zillow' };
const byCity = { id: 'd', address: '4 Belmont Ave', zip: '28099', city: 'Belmont', price: 310000, is_new_construction: 1, source: 'models' };
const resale = { id: 'e', address: '5 Old House Ct', zip: '28208', city: 'Charlotte', price: 300000, is_new_construction: 0, source: 'rentcast' };

test('thesis matching: corridor by zip or city, price band, criteria', () => {
  assert.strictEqual(matchesThesis(westMatch, thesis), true);
  assert.strictEqual(matchesThesis(tooRich, thesis), false, 'above price band');
  assert.strictEqual(matchesThesis(wrongZip, thesis), false, 'outside corridors');
  assert.strictEqual(matchesThesis(byCity, thesis), true, 'city corridor');
  assert.strictEqual(matchesThesis(resale, thesis), false, 'fails criteria');
  assert.strictEqual(matchesThesis(westMatch, null), false, 'no thesis, no match');
});

test('digest ranks thesis matches first and splits drops from hikes', () => {
  const d = composeDigest({
    newListings: [wrongZip, westMatch],
    priceChanges: [
      { ...westMatch, prior_price: 320000 },   // drop
      { ...wrongZip, prior_price: 290000 },    // hike
    ],
    statusFlips: [{ ...byCity, from_status: 'Available', to_status: 'Pending' }],
    wentDark: [resale],
  }, thesis, '2026-07-19 00:00:00');

  assert.strictEqual(d.new_listings[0].id, 'a', 'thesis match ranked first');
  assert.strictEqual(d.new_listings[0].thesis_match, true);
  assert.strictEqual(d.counts.drops, 1);
  assert.strictEqual(d.counts.hikes, 1);
  assert.strictEqual(d.price_drops[0].delta, -20000);
  assert.strictEqual(d.price_hikes[0].delta, 10000);
  assert.strictEqual(d.status_flips[0].to_status, 'Pending');
  assert.strictEqual(d.counts.dark, 1);
});
