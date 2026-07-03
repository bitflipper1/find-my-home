require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  getListings, getStats, getScrapeLogs, db,
  saveTrackedPlace, getTrackedPlaces, getTrackedIds, deleteTrackedPlace, getTrackedStats, TRACK_STATUSES,
} = require('./src/db');
const { runAllScrapers } = require('./src/aggregate');
const { startScheduler, getIsRunning } = require('./src/scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Listings ---
app.get('/api/listings', (req, res) => {
  try {
    const filters = {
      source: req.query.source,
      city: req.query.city,
      builder: req.query.builder,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
      beds: req.query.beds ? parseInt(req.query.beds) : undefined,
      priceCut: req.query.priceCut === 'true',
      isModel: req.query.isModel === 'true',
      furnished: req.query.furnished === 'true',
      leaseback: req.query.leaseback === 'true',
      search: req.query.search,
      sort: req.query.sort,
      order: req.query.order,
      limit: req.query.limit,
    };
    // Remove undefined keys
    Object.keys(filters).forEach(k => filters[k] === undefined && delete filters[k]);
    const listings = getListings(filters);
    res.json({ listings, count: listings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/listings/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const history = db.prepare('SELECT price, recorded_at FROM price_history WHERE listing_id = ? ORDER BY recorded_at').all(row.id);
    res.json({
      ...row,
      images: JSON.parse(row.images || '[]'),
      features: JSON.parse(row.features || '[]'),
      price_history_detail: history,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Stats ---
app.get('/api/stats', (req, res) => {
  try {
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Manual refresh ---
app.post('/api/refresh', async (req, res) => {
  if (getIsRunning()) {
    return res.json({ status: 'already_running', message: 'Scrape already in progress' });
  }
  res.json({ status: 'started', message: 'Scrape started in background' });
  runAllScrapers().catch(err => console.error('[Refresh] Error:', err));
});

// --- Scrape logs ---
app.get('/api/logs', (req, res) => {
  try {
    res.json(getScrapeLogs(req.query.limit ? parseInt(req.query.limit) : 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Email leads ---
app.get('/api/email-leads', (req, res) => {
  try {
    const leads = db.prepare('SELECT * FROM email_leads ORDER BY received_at DESC LIMIT 100').all();
    res.json({ leads, count: leads.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Builders list ---
app.get('/api/builders', (req, res) => {
  try {
    const builders = db.prepare(`
      SELECT builder, COUNT(*) as count, MIN(price) as min_price, MAX(price) as max_price, AVG(price) as avg_price
      FROM listings WHERE is_active=1 AND builder IS NOT NULL
      GROUP BY builder ORDER BY count DESC
    `).all();
    res.json(builders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Cities list ---
app.get('/api/cities', (req, res) => {
  try {
    const cities = db.prepare(`
      SELECT city, COUNT(*) as count FROM listings
      WHERE is_active=1 AND city IS NOT NULL
      GROUP BY city ORDER BY count DESC
    `).all();
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Price history for a listing ---
app.get('/api/listings/:id/price-history', (req, res) => {
  try {
    const history = db.prepare(
      'SELECT price, recorded_at FROM price_history WHERE listing_id = ? ORDER BY recorded_at'
    ).all(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Market intelligence (submarkets, leaseback programs, assumptions) ---
const { getMarketIntel } = require('./src/market');
app.get('/api/market', (req, res) => {
  try {
    res.json(getMarketIntel());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Personal research intelligence (Drive docs, inbox, insights) ---
const fs = require('fs');
const path = require('path');
app.get('/api/research', (req, res) => {
  try {
    const file = path.join(__dirname, 'data', 'research.json');
    res.json(fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tracked places (personal tour tracker) ---
app.get('/api/tracked', (req, res) => {
  try {
    res.json({ tracked: getTrackedPlaces(), ids: getTrackedIds(), stats: getTrackedStats() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tracked', (req, res) => {
  try {
    if (!req.body.listing_id && !req.body.address) {
      return res.status(400).json({ error: 'A listing_id or an address is required' });
    }
    const result = saveTrackedPlace(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tracked/:id', (req, res) => {
  try {
    const result = saveTrackedPlace({ ...req.body, id: parseInt(req.params.id) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tracked/:id', (req, res) => {
  try {
    const changes = deleteTrackedPlace(parseInt(req.params.id));
    res.json({ deleted: changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/track-statuses', (req, res) => res.json(TRACK_STATUSES));

// --- Health ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', scraping: getIsRunning(), time: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`Charlotte Townhome Aggregator API running on port ${PORT}`);
  startScheduler();

  // Seed with data on first startup if DB is empty
  const count = db.prepare('SELECT COUNT(*) as c FROM listings').get().c;
  if (count === 0) {
    console.log('[Startup] Empty database — running initial scrape...');
    runAllScrapers().catch(err => console.error('[Startup] Initial scrape error:', err));
  } else {
    console.log(`[Startup] ${count} listings already in database.`);
  }
});

module.exports = app;
