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

module.exports = { ROOT, safeSlug, safeName, ensureDealDir, listDeals, listDealFiles, filePath, deleteFile };
