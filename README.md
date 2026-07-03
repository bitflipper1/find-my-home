# Charlotte Townhome Finder

A full-stack aggregator dashboard for new construction townhomes in the greater Charlotte, NC area — like Jome.com but built for you, focused on Charlotte, and connected to your Gmail.

## Screenshots

**Listings — every source in one grid, with live price-cut alerts**
![Listings](docs-assets/01-listings.png)

**My Tours — a personal board for places you visit or are considering**
![My Tours](docs-assets/04-my-tours.png)

**Listing detail — price history + one-tap tracking & contact**
![Detail](docs-assets/03-detail-modal.png)

## What it does

- **Aggregates** listings from Zillow, Realtor.com, Opendoor, Homes.com, NewHomeSource, and direct builder websites (D.R. Horton, Lennar, Ryan Homes, Meritage, Eastwood, Smith Douglas, and more)
- **Tracks price cuts** — shows original vs. current price, % reduction, and dollar savings
- **Scans your Gmail** daily for real estate alerts, builder emails, and price-drop notifications
- **Runs on a schedule** — automatic refresh at 7 AM and 12 PM Eastern every day
- **Dashboard** — filter by price, beds, city, builder, source, furnished, leaseback; sort by price cut %, freshness, size; click any listing to see details + price history chart + call button
- **Invest tab (HouseCanary-style)** — every listing gets a 0–100 investment score (value vs submarket $/sqft, rent yield, growth forecast, price-cut momentum, model/furnished/leaseback fit), rent + cap-rate + cash-flow estimates, a 17-submarket intel table, and a builder model-sale/leaseback program directory tuned for finding furnished models under $350K with sale-leaseback terms (including the SC 6% investor-tax warning)

## Quick start

```bash
# Install dependencies
npm run setup

# Start both server (port 3001) + client (port 5173) together
npm run dev
```

Then open **http://localhost:5173**

## Hosting on GitHub Pages (static, read-only)

GitHub Pages can't run the Node/SQLite backend, so there's a **static build**
that bakes the current data into `client/public/data.json` and stores your tour
tracker in the browser's `localStorage`. A GitHub Actions workflow
(`.github/workflows/deploy-pages.yml`) builds and publishes it automatically.

**One-time setup** (you only do this once, in the GitHub UI):

1. Go to **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Push to the branch (or run the workflow manually from the **Actions** tab)

The site publishes to:
`https://bitflipper1.github.io/find-my-home/`

Build it locally to preview the exact static artifact:

```bash
npm run build:static
npx serve client/dist   # or any static server
```

**What works in the static version:** browsing/filtering/sorting all listings,
price-cut highlights, the listing detail modal with price history, the Email
Leads tab, analytics, and the full **My Tours** tracker (saved per-browser).
**What doesn't:** the live "Refresh" button and the daily Gmail/scraper updates —
those need the backend. The data refreshes whenever the site is rebuilt (every
push, or on demand from the Actions tab).

For the always-fresh experience, run the full stack (`npm run dev`) or host the
server somewhere that can run Node (Render, Railway, Fly.io, a VPS).

## Gmail — already wired up (no setup)

This app reads your inbox through the **Gmail connector**, so there are no OAuth
credentials to configure. A scheduled daily scan reads
`***REDACTED-EMAIL***` for builder emails (Ryan Homes, David Weekley…),
Zillow/Redfin price-cut alerts, and open houses, then writes the results to:

- `server/data/gmail-listings.json` — full listings (price, beds/baths/sqft, builder, phone) → shown in the dashboard as the **📧 Your Inbox** source
- `server/data/gmail-leads.json` — price-cut / open-house / builder alerts → shown in the **Email Leads** tab

The server ingests these files on every scrape, so your real inbox data flows
straight into the listings grid alongside the other sources. See
[`AUTOMATION.md`](AUTOMATION.md) for how the daily scan is scheduled.

### Optional: direct OAuth mode
If you'd rather have the server hit the Gmail API itself (instead of the
connector-driven file refresh), copy `server/.env.example` → `server/.env` and
fill in `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN`. The
server auto-detects credentials and uses them when present.

## Data sources

| Source | Type | Notes |
|--------|------|-------|
| Zillow | Aggregator | New construction + price changes |
| Realtor.com | Aggregator | MLS data with builder info |
| Opendoor | iBuyer | Resale + quick-close townhomes |
| Homes.com | Aggregator | CoStar-powered listings |
| NewHomeSource | New construction only | Best for builder communities |
| D.R. Horton | Builder direct | Largest US builder |
| Lennar | Builder direct | Wi-Fi certified homes |
| Ryan Homes / NVR | Builder direct | Popular in Charlotte suburbs |
| Meritage Homes | Builder direct | Energy-efficient focused |
| Eastwood Homes | Builder direct | Charlotte-based, strong local presence |
| Smith Douglas Homes | Builder direct | Affordable new construction |

## Top Charlotte builder communities covered

Charlotte proper · Matthews · Huntersville · Cornelius · Mooresville · Mint Hill · Concord · Indian Land SC · Waxhaw · Pineville · Gastonia · Fort Mill SC

## Architecture

```
/
├── server/          Node.js + Express + SQLite
│   ├── src/
│   │   ├── db.js            SQLite (listings, price history, email leads, logs)
│   │   ├── aggregate.js     Runs all scrapers, saves to DB
│   │   ├── scheduler.js     node-cron — 7 AM + noon daily
│   │   ├── gmail.js         OAuth2 Gmail inbox scanner
│   │   └── scrapers/
│   │       ├── zillow.js
│   │       ├── realtor.js
│   │       ├── opendoor.js
│   │       ├── newhomesource.js
│   │       ├── homes.js
│   │       └── builders/index.js
│   └── index.js     REST API (port 3001)
└── client/          React 18 + Vite + Tailwind CSS
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/
            ├── StatsBar.jsx
            ├── FilterPanel.jsx
            ├── ListingCard.jsx
            ├── ListingModal.jsx    price history chart + contact info
            ├── SourceBreakdown.jsx bar charts
            ├── EmailLeads.jsx
            └── ActivityLog.jsx
```

## API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/listings` | All listings (filterable: source, city, builder, minPrice, maxPrice, beds, priceCut, sort) |
| `GET /api/listings/:id` | Single listing with full price history |
| `GET /api/stats` | Dashboard stats (total, price cuts, avg price, by source, by builder) |
| `POST /api/refresh` | Trigger a manual scrape now |
| `GET /api/builders` | Builder summary with price ranges |
| `GET /api/cities` | City breakdown |
| `GET /api/email-leads` | Emails found in Gmail |
| `GET /api/logs` | Scrape activity log |

## Notes on scraping

Most aggregator sites (Zillow, Realtor.com, etc.) block automated requests — the server gracefully falls back to curated sample data so the dashboard always has content. As those sites update their bot-protection policies, the scrapers automatically get the real data when available. Builder sites (D.R. Horton, Lennar, etc.) tend to be more accessible.

For production use, consider adding a RapidAPI key for enhanced Zillow/Realtor.com access.

