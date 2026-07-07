require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  getListings, getStats, getScrapeLogs, db,
  saveTrackedPlace, getTrackedPlaces, getTrackedIds, deleteTrackedPlace, getTrackedStats, TRACK_STATUSES,
} = require('./src/db');
const { runAllScrapers } = require('./src/aggregate');
const { startScheduler, getIsRunning } = require('./src/scheduler');
const { configuredCorsOrigins, privateLocalOnly } = require('./src/privacy');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const allowedOrigins = new Set(configuredCorsOrigins());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS policy'));
  },
}));
app.use(express.json({ limit: '100kb' }));

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
    const { listingArt } = require('./src/listingArt');
    const images = JSON.parse(row.images || '[]');
    res.json({
      ...row,
      images: images.length ? images : [listingArt(row)],
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
app.post('/api/refresh', privateLocalOnly, async (req, res) => {
  if (getIsRunning()) {
    return res.json({ status: 'already_running', message: 'Scrape already in progress' });
  }
  res.json({ status: 'started', message: 'Scrape started in background' });
  runAllScrapers().catch(err => console.error('[Refresh] Error:', err));
});

// --- Scrape logs ---
app.get('/api/logs', privateLocalOnly, (req, res) => {
  try {
    res.json(getScrapeLogs(req.query.limit ? parseInt(req.query.limit) : 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Email leads ---
app.get('/api/email-leads', privateLocalOnly, (req, res) => {
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
app.get('/api/research', privateLocalOnly, (req, res) => {
  try {
    const file = path.join(__dirname, 'data', 'research.json');
    res.json(fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Builder knowledge base (markdown, mirrors Real-Estate-Knowledge/builders structure) ---
const { getBuilderProfiles } = require('./src/builderProfiles');
app.get('/api/builder-profiles', (req, res) => {
  try {
    res.json(getBuilderProfiles());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Live external data (Census, permits, RentCast, HUD) ---
const live = require('./src/liveapis');
app.get('/api/live/census', async (req, res) => res.json(await live.censusMecklenburg()));
app.get('/api/live/permits', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ ok: false, reason: 'lat and lng required' });
  res.json(await live.permitsNear(parseFloat(lat), parseFloat(lng)));
});
app.get('/api/live/rent', async (req, res) => {
  if (!req.query.address) return res.status(400).json({ ok: false, reason: 'address required' });
  res.json(await live.rentEstimate(req.query.address));
});
app.get('/api/live/fmr/:zip', async (req, res) => res.json(await live.hudFmr(req.params.zip)));

// Official Charlotte/Meck REST layers — the corridor screen, one call each.
// Usage: /api/live/policy-map?lat=35.19&lng=-80.83 (same for rezonings/crime/pipeline)
for (const [route, fn] of [['policy-map', 'policyMapNear'], ['rezonings', 'rezoningsNear'], ['crime', 'crimeNear'], ['pipeline', 'pipelineNear']]) {
  app.get(`/api/live/${route}`, async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ ok: false, reason: 'lat and lng required' });
    res.json(await live[fn](parseFloat(lat), parseFloat(lng)));
  });
}
app.get('/api/live/parcel/:pid', async (req, res) => res.json(await live.parcelByPid(req.params.pid)));

// Premium providers. ATTOM wants address1 (street) + address2 ("City, ST" or zip);
// HouseCanary wants address + zipcode. Both return {ok:false} until keys are set.
for (const [route, fn] of [['attom/profile', 'attomProfile'], ['attom/avm', 'attomAvm'], ['attom/sales-history', 'attomSalesHistory']]) {
  app.get(`/api/live/${route}`, async (req, res) => {
    const { address1, address2 } = req.query;
    if (!address1 || !address2) return res.status(400).json({ ok: false, reason: 'address1 and address2 required' });
    res.json(await live[fn](address1, address2));
  });
}
for (const [route, fn] of [['hc/value', 'hcValue'], ['hc/rent', 'hcRentalValue'], ['hc/forecast', 'hcValueForecast']]) {
  app.get(`/api/live/${route}`, async (req, res) => {
    const { address, zipcode } = req.query;
    if (!address || !zipcode) return res.status(400).json({ ok: false, reason: 'address and zipcode required' });
    res.json(await live[fn](address, zipcode));
  });
}

// The corridor screen: run all official layers for a point in one shot —
// the boom-signal test (policy ∩ entitlements ∩ pipeline) plus crime context.
app.get('/api/live/corridor', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ ok: false, reason: 'lat and lng required' });
  const [policy, rezonings, crime, pipeline] = await Promise.all([
    live.policyMapNear(+lat, +lng), live.rezoningsNear(+lat, +lng), live.crimeNear(+lat, +lng), live.pipelineNear(+lat, +lng),
  ]);
  const boom = (policy.ok && policy.boom_signal_types?.length > 0) && (rezonings.ok && rezonings.count > 0) && (pipeline.ok && pipeline.count > 0);
  res.json({ ok: true, boom_signal: boom, note: boom ? 'Policy ∩ entitlements ∩ pipeline all present — verify infrastructure (CAP) + flood before pursuing' : 'Not all three boom conditions present (or a layer was unreachable)', policy, rezonings, crime, pipeline });
});

// --- Deal document vault (private: contracts, photos, closing docs) ---
// Files live in gitignored server/data/deal-files/<slug>/; a manifest.json
// there indexes the deal's Google Drive folder for link-outs.
const multer = require('multer');
const dealFiles = require('./src/dealFiles');
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try { cb(null, dealFiles.ensureDealDir(req.params.slug)); } catch (e) { cb(e); }
    },
    filename: (req, file, cb) => {
      try { cb(null, dealFiles.safeName(file.originalname)); } catch (e) { cb(e); }
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 20 },
});

app.get('/api/deals', privateLocalOnly, (req, res) => {
  try { res.json({ deals: dealFiles.listDeals() }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/deals/:slug/files', privateLocalOnly, (req, res) => {
  try { res.json(dealFiles.listDealFiles(req.params.slug)); } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/deals/:slug/files', privateLocalOnly, upload.array('files'), (req, res) => {
  res.json({ uploaded: (req.files || []).map(f => ({ name: f.filename, size: f.size })) });
});

app.get('/api/deals/:slug/files/:name', privateLocalOnly, (req, res) => {
  try {
    const p = dealFiles.filePath(req.params.slug, req.params.name);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.sendFile(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/deals/:slug/files/:name', privateLocalOnly, (req, res) => {
  try { res.json({ deleted: dealFiles.deleteFile(req.params.slug, req.params.name) }); } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- Tracked places (personal tour tracker) ---
app.get('/api/tracked', privateLocalOnly, (req, res) => {
  try {
    res.json({ tracked: getTrackedPlaces(), ids: getTrackedIds(), stats: getTrackedStats() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tracked', privateLocalOnly, (req, res) => {
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

app.put('/api/tracked/:id', privateLocalOnly, (req, res) => {
  try {
    const result = saveTrackedPlace({ ...req.body, id: parseInt(req.params.id) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tracked/:id', privateLocalOnly, (req, res) => {
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

app.listen(PORT, HOST, async () => {
  console.log(`Charlotte Townhome Aggregator API running at http://${HOST}:${PORT}`);
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
