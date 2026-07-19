// Deal ⇄ URL codec for the leaseback analyzer's explicit share links.
//
// Base64url is ENCODING, not encryption: a share link contains the full deal
// terms in trivially decodable form. That is why the analyzer persists to
// localStorage by default and only produces one of these when the user
// clicks "Copy share link" past a visible warning.

const VERSION = 1;

function toBase64Url(str) {
  const b64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(str)))
    : Buffer.from(str, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  return typeof atob === 'function'
    ? decodeURIComponent(escape(atob(b64)))
    : Buffer.from(b64, 'base64').toString('utf8');
}

export function serializeDeal(deal) {
  return `${VERSION}.${toBase64Url(JSON.stringify(deal))}`;
}

export function deserializeDeal(param) {
  const dot = param.indexOf('.');
  if (dot < 0) throw new Error('Malformed deal parameter');
  const version = parseInt(param.slice(0, dot), 10);
  if (version !== VERSION) throw new Error(`Unsupported deal-link version ${version}`);
  return JSON.parse(fromBase64Url(param.slice(dot + 1)));
}
