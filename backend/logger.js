const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = /authorization|cookie|password|token|secret|api[_-]?key/i;

function sanitize(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitize);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEYS.test(key) ? REDACTED : sanitize(item)]));
}

function write(level, message, fields = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "modeljudge-api",
    message,
    ...sanitize(fields)
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.log(line);
}

const logger = {
  info(message, fields) { write("info", message, fields); },
  warn(message, fields) { write("warn", message, fields); },
  error(message, fields) { write("error", message, fields); }
};

function requestLogger(req, res, next) {
  const started = process.hrtime.bigint();
  const requestId = req.get("x-request-id") || require("crypto").randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    logger.info("http_request", {
      request_id: requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Number(durationMs.toFixed(2))
    });
  });
  next();
}

module.exports = { logger, requestLogger, sanitize };
