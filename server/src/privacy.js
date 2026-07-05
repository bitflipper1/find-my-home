function normalizeAddress(address = '') {
  return String(address).replace(/^::ffff:/, '');
}

function isLoopbackAddress(address) {
  const normalized = normalizeAddress(address);
  return normalized === '127.0.0.1' || normalized === '::1';
}

function privateLocalOnly(req, res, next) {
  if (process.env.ALLOW_PRIVATE_LOCAL !== 'true') {
    return res.status(404).json({ error: 'Private API disabled' });
  }

  const address = req.ip || req.socket?.remoteAddress || '';
  if (!isLoopbackAddress(address)) {
    return res.status(403).json({ error: 'Private API is restricted to loopback access' });
  }

  return next();
}

function configuredCorsOrigins() {
  return (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

module.exports = { configuredCorsOrigins, isLoopbackAddress, privateLocalOnly };
