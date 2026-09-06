const crypto = require("crypto");

const WINDOW_MS = Number(process.env.SECURITY_RATE_WINDOW_MS) || 60_000;
const MAX_REQUESTS = Number(process.env.SECURITY_RATE_MAX_REQUESTS) || 120;
const buckets = new Map();

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function rateLimit(req, res, next) {
  const now = Date.now();
  const key = clientKey(req);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - bucket.startedAt)) / 1000));
    res.setHeader("Retry-After", retryAfter);
    return res.status(429).json({ error: "Too many requests", retry_after_seconds: retryAfter });
  }
  next();
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
}

function timingSafeEqualText(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function cleanup() {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [key, bucket] of buckets) if (bucket.startedAt < cutoff) buckets.delete(key);
}
const cleanupTimer = setInterval(cleanup, WINDOW_MS * 2);
cleanupTimer.unref();

module.exports = { rateLimit, securityHeaders, timingSafeEqualText, WINDOW_MS, MAX_REQUESTS };
