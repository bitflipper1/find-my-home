# Automation — daily Gmail scan

This optional automation checks a privately configured inbox and writes local
connector output for the full-stack application.

## What runs each day

A scheduled task scans the configured Gmail connector for new
Charlotte-area townhome / new-construction emails from the last 2 days:

- **Price-cut alerts** — `instant-updates@mail.zillow.com`, `my-saved-home@mail.zillow.com`, `listings@redfin.com`
- **Builder emails** — messages from configured builder domains and contacts
- **Open houses & new listings** — Zillow / Redfin digests

It extracts structured listings (address, price, original price if a cut is
mentioned, beds/baths/sqft, builder, community, phone, URL), **merges** them into
the two real-data files (deduping by address), rebuilds the database to verify,
then stores the refreshed JSON locally. Never commit or push connector output.

The running web server reads those files on every scrape (its own 7 AM / 12 PM
cron, plus the dashboard's "Refresh" button), so new inbox data shows up in the
**📧 Your Inbox** source and the **Email Leads** tab automatically.

## The honest part: lifecycle

The scan is scheduled inside the Claude session that built this app. Two limits
you should know about:

1. **Recurring tasks auto-expire after 7 days.** After that the schedule needs
   to be re-armed (just ask Claude to "resume the daily Gmail scan").
2. **The web container is ephemeral.** If this session's container is reclaimed,
   the in-session schedule stops. Persist private connector output in an
   access-controlled store outside this public repository.

### Most durable option
The truly always-on version is to run the Gmail scan from a machine that's
always up (your laptop, a small VPS, or a cron box) using the OAuth mode in
`server/.env`. The connector-driven scan here is the zero-setup default; OAuth
is the set-and-forget upgrade. Everything in the codebase supports both.

## Re-arming or changing the schedule

- "Resume / re-arm the daily Gmail scan" → reschedules it.
- "Scan my email now" → runs the extraction locally without committing its output.
- "Change the scan to 8am / twice a day" → adjusts the cron expression.

## Files touched by the scan

| File | Contents |
|------|----------|
| `server/data/gmail-listings.json` | Full listings surfaced from your inbox |
| `server/data/gmail-leads.json` | Price-cut / open-house / builder alert rows |

These files and the SQLite DB (`server/data/*.db`) are intentionally gitignored.
The GitHub Pages exporter excludes Gmail listings and leads even when the files
exist locally.
