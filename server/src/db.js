const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'listings.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    url TEXT,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT DEFAULT 'NC',
    zip TEXT,
    neighborhood TEXT,
    price INTEGER,
    original_price INTEGER,
    price_history TEXT DEFAULT '[]',
    beds INTEGER,
    baths REAL,
    sqft INTEGER,
    lot_size TEXT,
    year_built INTEGER,
    type TEXT DEFAULT 'Townhome',
    status TEXT DEFAULT 'Available',
    builder TEXT,
    community TEXT,
    description TEXT,
    features TEXT DEFAULT '[]',
    images TEXT DEFAULT '[]',
    latitude REAL,
    longitude REAL,
    phone TEXT,
    email TEXT,
    days_on_market INTEGER DEFAULT 0,
    is_new_construction INTEGER DEFAULT 1,
    is_model INTEGER DEFAULT 0,
    is_furnished INTEGER DEFAULT 0,
    move_in_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    last_seen TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id TEXT NOT NULL,
    price INTEGER NOT NULL,
    recorded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (listing_id) REFERENCES listings(id)
  );

  CREATE TABLE IF NOT EXISTS scrape_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    listings_found INTEGER DEFAULT 0,
    listings_new INTEGER DEFAULT 0,
    listings_updated INTEGER DEFAULT 0,
    error TEXT,
    ran_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS email_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gmail_id TEXT UNIQUE,
    subject TEXT,
    sender TEXT,
    body_snippet TEXT,
    listing_address TEXT,
    price INTEGER,
    builder TEXT,
    url TEXT,
    received_at TEXT,
    processed_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tracked_places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id TEXT UNIQUE,
    status TEXT DEFAULT 'considering',
    rating INTEGER,
    notes TEXT,
    visit_date TEXT,
    -- snapshot so tracked places survive even if the listing goes inactive,
    -- and so manually-added places (no listing_id) carry their own details
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    price INTEGER,
    beds INTEGER,
    baths REAL,
    sqft INTEGER,
    builder TEXT,
    community TEXT,
    phone TEXT,
    url TEXT,
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);
  CREATE INDEX IF NOT EXISTS idx_listings_model ON listings(is_model);
  CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
  CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
  CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);
  CREATE INDEX IF NOT EXISTS idx_price_history_listing ON price_history(listing_id);
  CREATE INDEX IF NOT EXISTS idx_tracked_status ON tracked_places(status);
`);

// Migration: leaseback flag for model-home sale-leaseback opportunities
try { db.exec('ALTER TABLE listings ADD COLUMN leaseback INTEGER DEFAULT 0'); } catch { /* exists */ }

const { enrichListing } = require('./market');
const { listingArt } = require('./listingArt');

// Upsert a listing, tracking price changes
function upsertListing(listing) {
  const existing = db.prepare('SELECT id, price FROM listings WHERE id = ?').get(listing.id);

  if (existing) {
    if (existing.price !== listing.price && listing.price) {
      db.prepare(`
        INSERT INTO price_history (listing_id, price) VALUES (?, ?)
      `).run(existing.id, existing.price);

      const history = JSON.parse(
        db.prepare('SELECT price_history FROM listings WHERE id = ?').get(existing.id)?.price_history || '[]'
      );
      history.push({ price: existing.price, date: new Date().toISOString() });

      db.prepare(`
        UPDATE listings SET
          price = ?, price_history = ?, updated_at = datetime('now'),
          last_seen = datetime('now'), is_active = 1,
          status = ?, beds = COALESCE(?, beds), baths = COALESCE(?, baths),
          sqft = COALESCE(?, sqft), images = COALESCE(?, images),
          description = COALESCE(?, description), days_on_market = COALESCE(?, days_on_market)
        WHERE id = ?
      `).run(
        listing.price, JSON.stringify(history),
        listing.status || 'Available',
        listing.beds, listing.baths, listing.sqft,
        listing.images ? JSON.stringify(listing.images) : null,
        listing.description, listing.days_on_market,
        existing.id
      );
    } else {
      db.prepare(`
        UPDATE listings SET last_seen = datetime('now'), is_active = 1, updated_at = datetime('now')
        WHERE id = ?
      `).run(existing.id);
    }
    return { action: 'updated', id: existing.id };
  } else {
    db.prepare(`
      INSERT INTO listings (
        id, source, url, address, city, state, zip, neighborhood,
        price, original_price, price_history,
        beds, baths, sqft, lot_size, year_built,
        type, status, builder, community,
        description, features, images,
        latitude, longitude, phone, email,
        days_on_market, is_new_construction, is_model, is_furnished, leaseback,
        move_in_date, last_seen
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, datetime('now')
      )
    `).run(
      listing.id, listing.source, listing.url,
      listing.address, listing.city, listing.state || 'NC', listing.zip, listing.neighborhood,
      listing.price, listing.original_price || null, JSON.stringify([]),
      listing.beds, listing.baths, listing.sqft, listing.lot_size, listing.year_built,
      listing.type || 'Townhome', listing.status || 'Available',
      listing.builder, listing.community,
      listing.description,
      JSON.stringify(listing.features || []),
      JSON.stringify(listing.images || []),
      listing.latitude, listing.longitude,
      listing.phone, listing.email,
      listing.days_on_market || 0,
      listing.is_new_construction !== false ? 1 : 0,
      listing.is_model ? 1 : 0,
      listing.is_furnished ? 1 : 0,
      listing.leaseback ? 1 : 0,
      listing.move_in_date
    );
    return { action: 'created', id: listing.id };
  }
}

function getListings(filters = {}) {
  let query = `
    SELECT l.*,
      CASE WHEN l.original_price > 0 AND l.price < l.original_price
        THEN ROUND((l.original_price - l.price) * 100.0 / l.original_price, 1)
        ELSE NULL END AS price_cut_pct,
      CASE WHEN l.original_price > 0 AND l.price < l.original_price
        THEN l.original_price - l.price
        ELSE NULL END AS price_cut_amt
    FROM listings l
    WHERE l.is_active = 1
  `;
  const params = [];

  if (filters.source) { query += ' AND l.source = ?'; params.push(filters.source); }
  if (filters.city) { query += ' AND l.city LIKE ?'; params.push(`%${filters.city}%`); }
  if (filters.builder) { query += ' AND l.builder LIKE ?'; params.push(`%${filters.builder}%`); }
  if (filters.minPrice) { query += ' AND l.price >= ?'; params.push(filters.minPrice); }
  if (filters.maxPrice) { query += ' AND l.price <= ?'; params.push(filters.maxPrice); }
  if (filters.beds) { query += ' AND l.beds >= ?'; params.push(filters.beds); }
  if (filters.priceCut) { query += ' AND l.price < l.original_price AND l.original_price > 0'; }
  if (filters.isModel) { query += ' AND l.is_model = 1'; }
  if (filters.furnished) { query += ' AND l.is_furnished = 1'; }
  if (filters.leaseback) { query += ' AND l.leaseback = 1'; }
  if (filters.search) {
    query += ' AND (l.address LIKE ? OR l.community LIKE ? OR l.builder LIKE ? OR l.neighborhood LIKE ?)';
    const s = `%${filters.search}%`;
    params.push(s, s, s, s);
  }

  const sort = filters.sort || 'updated_at';
  const order = filters.order === 'asc' ? 'ASC' : 'DESC';
  const validSorts = ['price', 'updated_at', 'created_at', 'days_on_market', 'sqft', 'beds', 'price_cut_pct'];
  query += ` ORDER BY ${validSorts.includes(sort) ? sort : 'updated_at'} ${order}`;

  if (filters.limit) { query += ' LIMIT ?'; params.push(parseInt(filters.limit)); }

  return db.prepare(query).all(...params).map(row => {
    const images = JSON.parse(row.images || '[]');
    return {
      ...row,
      // Listings without photos get a generated render that reflects their
      // actual attributes (see listingArt.js) — never a blank card.
      images: images.length ? images : [listingArt(row)],
      features: JSON.parse(row.features || '[]'),
      price_history: JSON.parse(row.price_history || '[]'),
      invest: enrichListing(row),
    };
  });
}

function getStats() {
  return {
    total: db.prepare('SELECT COUNT(*) as c FROM listings WHERE is_active=1').get().c,
    price_cuts: db.prepare('SELECT COUNT(*) as c FROM listings WHERE is_active=1 AND price < original_price AND original_price > 0').get().c,
    new_today: db.prepare("SELECT COUNT(*) as c FROM listings WHERE is_active=1 AND date(created_at) = date('now')").get().c,
    avg_price: db.prepare('SELECT AVG(price) as a FROM listings WHERE is_active=1 AND price > 0').get().a,
    by_source: db.prepare('SELECT source, COUNT(*) as count FROM listings WHERE is_active=1 GROUP BY source').all(),
    by_builder: db.prepare('SELECT builder, COUNT(*) as count FROM listings WHERE is_active=1 AND builder IS NOT NULL GROUP BY builder ORDER BY count DESC LIMIT 10').all(),
    price_range: db.prepare('SELECT MIN(price) as min_price, MAX(price) as max_price FROM listings WHERE is_active=1 AND price > 0').get(),
  };
}

function logScrape(source, status, counts = {}, error = null) {
  db.prepare(`
    INSERT INTO scrape_log (source, status, listings_found, listings_new, listings_updated, error)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(source, status, counts.found || 0, counts.created || 0, counts.updated || 0, error);
}

function getScrapeLogs(limit = 50) {
  return db.prepare('SELECT * FROM scrape_log ORDER BY ran_at DESC LIMIT ?').all(limit);
}

function markStaleListings() {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(
    "UPDATE listings SET is_active = 0 WHERE last_seen < ? AND is_active = 1"
  ).run(twoDaysAgo);
  return result.changes;
}

// ---- Tracked places (personal tour tracker) ----

const TRACK_STATUSES = ['considering', 'scheduled', 'visited', 'favorite', 'passed'];

// Save or update a tracked place. If a listing_id is provided and already
// tracked, this updates it; otherwise it inserts a new row. Manual places
// (no listing_id) are always inserted unless an `id` is supplied.
function saveTrackedPlace(data) {
  const status = TRACK_STATUSES.includes(data.status) ? data.status : 'considering';

  // Pull a snapshot from the live listing when tracking by listing_id
  let snap = {};
  if (data.listing_id) {
    const l = db.prepare('SELECT * FROM listings WHERE id = ?').get(data.listing_id);
    if (l) {
      snap = {
        address: l.address, city: l.city, state: l.state, zip: l.zip,
        price: l.price, beds: l.beds, baths: l.baths, sqft: l.sqft,
        builder: l.builder, community: l.community, phone: l.phone,
        url: l.url, source: l.source,
      };
    }
  }

  // Update path: by explicit id, or by existing listing_id. Load the full
  // existing row so partial updates don't wipe snapshot fields.
  let existing = null;
  if (data.id) existing = db.prepare('SELECT * FROM tracked_places WHERE id = ?').get(data.id);
  else if (data.listing_id) existing = db.prepare('SELECT * FROM tracked_places WHERE listing_id = ?').get(data.listing_id);

  const prev = existing || {};
  // Snapshot fields: explicit input → live-listing snapshot → existing row → default
  const pick = (key, def = null) => data[key] ?? snap[key] ?? prev[key] ?? def;
  // User fields: honor an explicitly-sent value (even null, so they can be
  // cleared), but keep the existing value when the key is absent (e.g. the
  // quick heart-toggle only sends status).
  const userField = (key) => (key in data ? data[key] : (prev[key] ?? null));

  const fields = {
    status,
    rating: userField('rating'),
    notes: userField('notes'),
    visit_date: userField('visit_date'),
    address: pick('address'),
    city: pick('city'),
    state: pick('state', 'NC'),
    zip: pick('zip'),
    price: pick('price'),
    beds: pick('beds'),
    baths: pick('baths'),
    sqft: pick('sqft'),
    builder: pick('builder'),
    community: pick('community'),
    phone: pick('phone'),
    url: pick('url'),
    source: data.listing_id ? (snap.source || prev.source || 'tracked') : (prev.source || 'manual'),
  };

  if (existing) {
    db.prepare(`
      UPDATE tracked_places SET
        status=@status, rating=@rating, notes=@notes, visit_date=@visit_date,
        address=@address, city=@city, state=@state, zip=@zip, price=@price,
        beds=@beds, baths=@baths, sqft=@sqft, builder=@builder, community=@community,
        phone=@phone, url=@url, updated_at=datetime('now')
      WHERE id=@id
    `).run({ ...fields, id: existing.id });
    return { action: 'updated', id: existing.id };
  }

  const info = db.prepare(`
    INSERT INTO tracked_places (
      listing_id, status, rating, notes, visit_date,
      address, city, state, zip, price, beds, baths, sqft,
      builder, community, phone, url, source
    ) VALUES (
      @listing_id, @status, @rating, @notes, @visit_date,
      @address, @city, @state, @zip, @price, @beds, @baths, @sqft,
      @builder, @community, @phone, @url, @source
    )
  `).run({ listing_id: data.listing_id ?? null, ...fields });
  return { action: 'created', id: info.lastInsertRowid };
}

function getTrackedPlaces() {
  // Join live listing data when available so prices/price-cuts stay fresh
  return db.prepare(`
    SELECT t.*,
      l.price AS live_price,
      l.original_price AS live_original_price,
      l.is_active AS listing_active,
      l.images AS images
    FROM tracked_places t
    LEFT JOIN listings l ON l.id = t.listing_id
    ORDER BY
      CASE t.status
        WHEN 'scheduled' THEN 0
        WHEN 'favorite' THEN 1
        WHEN 'considering' THEN 2
        WHEN 'visited' THEN 3
        WHEN 'passed' THEN 4
        ELSE 5 END,
      t.updated_at DESC
  `).all().map(r => ({
    ...r,
    price: r.live_price ?? r.price,
    original_price: r.live_original_price ?? null,
    images: r.images ? JSON.parse(r.images) : [],
  }));
}

function getTrackedIds() {
  return db.prepare('SELECT listing_id FROM tracked_places WHERE listing_id IS NOT NULL').all().map(r => r.listing_id);
}

function deleteTrackedPlace(id) {
  return db.prepare('DELETE FROM tracked_places WHERE id = ?').run(id).changes;
}

function getTrackedStats() {
  const rows = db.prepare('SELECT status, COUNT(*) as count FROM tracked_places GROUP BY status').all();
  const byStatus = {};
  rows.forEach(r => { byStatus[r.status] = r.count; });
  return {
    total: db.prepare('SELECT COUNT(*) as c FROM tracked_places').get().c,
    by_status: byStatus,
    upcoming_visits: db.prepare(
      "SELECT COUNT(*) as c FROM tracked_places WHERE visit_date >= date('now') AND status='scheduled'"
    ).get().c,
  };
}

module.exports = {
  db, upsertListing, getListings, getStats, logScrape, getScrapeLogs, markStaleListings,
  saveTrackedPlace, getTrackedPlaces, getTrackedIds, deleteTrackedPlace, getTrackedStats, TRACK_STATUSES,
};
