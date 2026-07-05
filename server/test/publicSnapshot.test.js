const test = require('node:test');
const assert = require('node:assert/strict');
const { createPublicSnapshot, assertPublicSnapshot } = require('../src/publicSnapshot');

test('public snapshot excludes inbox and private model listings', () => {
  const snapshot = createPublicSnapshot({
    listings: [
      { id: 'public', source: 'builders', builder: 'Example Homes', city: 'Charlotte', price: 300000 },
      { id: 'mail', source: 'gmail' },
      { id: 'private-model', source: 'models' },
    ],
    logs: [
      { source: 'builders', status: 'success' },
      { source: 'gmail', status: 'success' },
    ],
  });

  assert.deepEqual(snapshot.listings, [{ id: 'public', source: 'builders', builder: 'Example Homes', city: 'Charlotte', price: 300000 }]);
  assert.deepEqual(snapshot.logs, [{ source: 'builders', status: 'success' }]);
  assert.deepEqual(snapshot.stats.by_source, [{ source: 'builders', count: 1 }]);
  assert.deepEqual(snapshot.builders, [{ builder: 'Example Homes', count: 1 }]);
  assert.deepEqual(snapshot.cities, [{ city: 'Charlotte', count: 1 }]);
  assert.equal('leads' in snapshot, false);
  assert.equal('research' in snapshot, false);
});

test('privacy assertion rejects forbidden private payloads', () => {
  assert.throws(
    () => assertPublicSnapshot({ listings: [], leads: [] }),
    /private field: leads/
  );

  assert.throws(
    () => assertPublicSnapshot({ listings: [], builder_profiles: { gmail_id: 'private-message-id' } }),
    /private key: snapshot.builder_profiles.gmail_id/
  );
});
