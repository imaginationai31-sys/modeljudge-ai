const path = require("path");
const http = require("http");
const { spawn, spawnSync } = require("child_process");
const express = require("../backend/node_modules/express");
const db = require("../backend/db");
const { logger, requestLogger } = require("../backend/logger");
const { captureException, installProcessHandlers } = require("../backend/error-tracker");

const PUBLIC_PORT = Number(process.env.PORT || 10000);
const BACKEND_PORT = 8787;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

installProcessHandlers();

function runMigrations() {
  if (!db.isConfigured()) {
    logger.info("database_not_configured", { mode: "jsonl" });
    return;
  }
  logger.info("database_detected", { action: "run_migrations" });
  const result = spawnSync(process.execPath, [path.join(__dirname, "migrate.js")], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

function runCalibrationDiagnostic() {
  if (!db.isConfigured()) return;
  logger.info("calibration_diagnostic_start");
  const result = spawnSync(process.execPath, [path.join(__dirname, "diagnose-calibration.js")], { stdio: "inherit", env: process.env });
  if (result.error) logger.error("calibration_diagnostic_start_failed", { error: result.error.message });
  if (result.status !== 0) logger.warn("calibration_diagnostic_reported_failure", { exit_code: result.status });
}

function syncVerifiedReviews() {
  if (!db.isConfigured()) return;
  const script = `const store=require('./backend/storage-adapter'); store.syncApprovedReviews().then(r=>{console.log('Verified-review sync:',JSON.stringify(r));process.exit(0)}).catch(e=>{console.error('Verified-review sync failed:',e);process.exit(1)})`;
  const result = spawnSync(process.execPath, ["-e", script], { stdio: "inherit", env: process.env, cwd: path.join(__dirname, "..") });
  if (result.status !== 0) logger.warn("verified_review_sync_failed", { exit_code: result.status });
}

function ensureBuyerRelease() {
  const script = `const {ensureBuyerRelease}=require('./backend/buyer-release'); ensureBuyerRelease('1.0.0').then(r=>{console.log('Buyer release:',JSON.stringify(r));process.exit(0)}).catch(e=>{console.error('Buyer release generation failed:',e);process.exit(1)})`;
  const result = spawnSync(process.execPath, ["-e", script], { stdio: "inherit", env: process.env, cwd: path.join(__dirname, "..") });
  if (result.status !== 0) logger.warn("buyer_release_generation_failed", { exit_code: result.status });
}

runMigrations();
runCalibrationDiagnostic();
syncVerifiedReviews();
ensureBuyerRelease();
logger.info("api_starting", { backend_port: BACKEND_PORT });

const backendEnv = { ...process.env, PORT: String(BACKEND_PORT) };
const backend = spawn(process.execPath, [path.join(__dirname, "..", "backend", "server.js")], { stdio: "inherit", env: backendEnv });
backend.on("error", error => {
  captureException(error, { source: "backend_process" });
  logger.error("api_process_start_failed", { error: error.message });
  process.exit(1);
});

function proxyApi(req, res) {
  const headers = { ...req.headers, host: `127.0.0.1:${BACKEND_PORT}` };
  const options = { hostname: "127.0.0.1", port: BACKEND_PORT, path: req.originalUrl, method: req.method, headers };
  const proxy = http.request(options, backendRes => { res.writeHead(backendRes.statusCode || 502, backendRes.headers); backendRes.pipe(res); });
  proxy.on("error", error => {
    captureException(error, { source: "api_proxy", request_id: req.requestId, path: req.path });
    logger.error("api_proxy_error", { request_id: req.requestId, error: error.message });
    if (!res.headersSent) res.status(502).json({ error: "API unavailable" }); else res.end();
  });
  req.pipe(proxy);
}

const app = express();
app.disable("x-powered-by");
app.use(requestLogger);
app.use((req, res, next) => { if (req.path === "/api" || req.path.startsWith("/api/")) return proxyApi(req, res); next(); });
app.use(express.static(FRONTEND_DIR, { extensions: ["html"] }));
app.get("/", (req, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));
app.use((req, res) => { if (req.method === "GET" && !req.path.startsWith("/api/")) return res.sendFile(path.join(FRONTEND_DIR, "index.html")); res.status(404).json({ error: "Not found" }); });
const publicServer = app.listen(PUBLIC_PORT, "0.0.0.0", () => logger.info("public_service_listening", { port: PUBLIC_PORT }));
function shutdown(signal) { logger.info("service_shutdown", { signal }); publicServer.close(() => process.exit(0)); if (!backend.killed) backend.kill(signal); }
backend.on("exit", (code, signal) => { if (signal) return shutdown("SIGTERM"); if (code !== 0) { logger.error("api_process_exited", { exit_code: code }); shutdown("SIGTERM"); } });
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
