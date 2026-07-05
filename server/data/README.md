# Local data boundary

This public repository contains public-source builder research only.

The following runtime files are private and gitignored:

- `gmail-listings.json`
- `gmail-leads.json`
- `model-homes.json`
- `research.json`
- `*.db`, `*.db-shm`, and `*.db-wal`

Do not commit contracts, payment records, inbox exports, negotiation notes,
personal contact details, tracked places, or buyer-specific underwriting.
The static exporter independently excludes private listing sources and private
top-level payloads as a second line of defense.
