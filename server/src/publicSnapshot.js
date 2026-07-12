const PRIVATE_LISTING_SOURCES = new Set(['gmail', 'models']);
const FORBIDDEN_TOP_LEVEL_KEYS = new Set(['leads', 'research', 'tracked']);
const FORBIDDEN_PRIVATE_KEYS = new Set([
  'body_snippet',
  'earnest_money',
  'earnest_paid',
  'gmail_id',
  'sales_consultant',
  'source_account',
]);

function isPublicListing(listing) {
  return listing && !PRIVATE_LISTING_SOURCES.has(String(listing.source || '').toLowerCase());
}

function countBy(listings, field) {
  const counts = new Map();
  for (const listing of listings) {
    const value = listing[field];
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].map(([value, count]) => ({ [field]: value, count }));
}

function summarize(listings, generatedAt) {
  const prices = listings.map(listing => listing.price).filter(price => Number(price) > 0);
  const today = String(generatedAt).slice(0, 10);
  const byBuilder = countBy(listings, 'builder').sort((a, b) => b.count - a.count).slice(0, 10);

  return {
    total: listings.length,
    // Same rule as getStats/App.jsx: source-reported reduction, or a drop we
    // observed ourselves in tracked price history.
    price_cuts: listings.filter(listing =>
      (listing.original_price > 0 && listing.price < listing.original_price)
      || (listing.price_history?.length > 0 && listing.price < listing.price_history[listing.price_history.length - 1].price)
    ).length,
    new_today: listings.filter(listing => String(listing.created_at || '').slice(0, 10) === today).length,
    avg_price: prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null,
    by_source: countBy(listings, 'source'),
    by_builder: byBuilder,
    price_range: {
      min_price: prices.length ? Math.min(...prices) : null,
      max_price: prices.length ? Math.max(...prices) : null,
    },
  };
}

function createPublicSnapshot({
  generatedAt = new Date().toISOString(),
  listings = [],
  logs = [],
  market = {},
  builderProfiles = {},
} = {}) {
  const publicListings = listings.filter(isPublicListing);
  const snapshot = {
    generated_at: generatedAt,
    listings: publicListings,
    stats: summarize(publicListings, generatedAt),
    logs: logs.filter(log => String(log?.source || '').toLowerCase() !== 'gmail'),
    builders: countBy(publicListings, 'builder').sort((a, b) => b.count - a.count),
    cities: countBy(publicListings, 'city').sort((a, b) => b.count - a.count),
    market,
    builder_profiles: builderProfiles,
  };

  assertPublicSnapshot(snapshot);
  return snapshot;
}

function assertPublicSnapshot(snapshot) {
  for (const key of FORBIDDEN_TOP_LEVEL_KEYS) {
    if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
      throw new Error(`Public snapshot must not contain private field: ${key}`);
    }
  }

  const privateListing = (snapshot.listings || []).find(listing => !isPublicListing(listing));
  if (privateListing) {
    throw new Error(`Public snapshot contains private listing source: ${privateListing.source}`);
  }

  const visit = (value, path = 'snapshot') => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_PRIVATE_KEYS.has(key.replace(/^_/, ''))) {
        throw new Error(`Public snapshot contains private key: ${path}.${key}`);
      }
      visit(child, `${path}.${key}`);
    }
  };
  visit(snapshot);

  return snapshot;
}

module.exports = { createPublicSnapshot, assertPublicSnapshot, isPublicListing, summarize };
