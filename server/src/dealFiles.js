// Per-deal document vault — uploads and a Drive index, both private.
//
// Files live under server/data/deal-files/<deal-slug>/ (gitignored, never in
// the public snapshot). An optional manifest.json alongside the uploads
// indexes the deal's Google Drive folder so the UI can link out to documents
// that stay in Drive. Routes that use this module must sit behind
// privateLocalOnly.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'data', 'deal-files');
const MANIFEST = 'manifest.json';

// Slugs and filenames are used to build filesystem paths — keep both to a
// conservative charset so traversal ("../") is impossible by construction.
function safeSlug(slug) {
  const s = String(slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!s) throw new Error('Invalid deal slug');
  return s;
}

function safeName(name) {
  const n = path.basename(String(name || '')).replace(/[^\w.\- ()]/g, '_').trim();
  if (!n || n === MANIFEST) throw new Error('Invalid file name');
  return n;
}

function dealDir(slug) {
  return path.join(ROOT, safeSlug(slug));
}

function ensureDealDir(slug) {
  const dir = dealDir(slug);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function listDeals() {
  if (!fs.existsSync(ROOT)) return [];
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

// Deal metadata (title/address per slug) lives in deals.json at the vault
// root — private like everything else here.
const DEALS_META = path.join(ROOT, 'deals.json');

function readDealsMeta() {
  try { return JSON.parse(fs.readFileSync(DEALS_META, 'utf8')); } catch { return {}; }
}

function writeDealsMeta(meta) {
  fs.mkdirSync(ROOT, { recursive: true });
  fs.writeFileSync(DEALS_META, JSON.stringify(meta, null, 2));
}

// Slug from a human title/address: "3912 Craig Ave" → "3912-craig-ave".
function slugify(text) {
  return safeSlug(String(text || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60));
}

// Every deal the vault knows about: directories on disk merged with saved
// metadata, so deals created before metadata existed still show up.
function listDealsWithMeta() {
  const meta = readDealsMeta();
  const slugs = new Set([...listDeals(), ...Object.keys(meta)]);
  return [...slugs].sort().map(slug => ({
    slug,
    title: meta[slug]?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    address: meta[slug]?.address || null,
    created_at: meta[slug]?.created_at || null,
  }));
}

function createDeal({ title, address }) {
  const name = String(title || address || '').trim();
  if (!name) throw new Error('Deal needs a title or address');
  const slug = slugify(name);
  ensureDealDir(slug);
  const meta = readDealsMeta();
  if (!meta[slug]) {
    meta[slug] = { title: name, address: String(address || '').trim() || null, created_at: new Date().toISOString() };
    writeDealsMeta(meta);
  }
  return { slug, ...meta[slug] };
}

function listDealFiles(slug) {
  const dir = dealDir(slug);
  let uploads = [];
  let drive = null;
  if (fs.existsSync(dir)) {
    uploads = fs.readdirSync(dir)
      .filter(f => f !== MANIFEST && !f.startsWith('.'))
      .map(f => {
        const st = fs.statSync(path.join(dir, f));
        return { name: f, size: st.size, modified: st.mtime.toISOString() };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
    const mPath = path.join(dir, MANIFEST);
    if (fs.existsSync(mPath)) {
      try { drive = JSON.parse(fs.readFileSync(mPath, 'utf8')); } catch { drive = null; }
    }
  }
  return { slug: safeSlug(slug), uploads, drive };
}

function filePath(slug, name) {
  const p = path.join(dealDir(slug), safeName(name));
  if (!fs.existsSync(p)) return null;
  return p;
}

function deleteFile(slug, name) {
  const p = filePath(slug, name);
  if (!p) return false;
  fs.unlinkSync(p);
  return true;
}

module.exports = {
  ROOT, safeSlug, safeName, ensureDealDir, listDeals, listDealFiles, filePath, deleteFile,
  listDealsWithMeta, createDeal,
};
