const path = require("path");
const http = require("http");
const { spawn, spawnSync } = require("child_process");
const express = require("../backend/node_modules/express");
const db = require("../backend/db");

const PUBLIC_PORT = Number(process.env.PORT || 10000);
const BACKEND_PORT = 8787;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

function runMigrations() {
  if (!db.isConfigured()) {
    console.log("DATABASE_URL not configured; starting in JSONL/local mode without migrations.");
    return;
  }
  console.log("DATABASE_URL detected; running PostgreSQL migrations before API startup...");
  const result = spawnSync(process.execPath, [path.join(__dirname, "migrate.js")], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

function runCalibrationDiagnostic() {
  if (!db.isConfigured()) return;
  console.log("Running calibration diagnostic against PostgreSQL...");
  const result = spawnSync(process.execPath, [path.join(__dirname, "diagnose-calibration.js")], { stdio: "inherit", env: process.env });
  if (result.error) console.error("Calibration diagnostic failed to start:", result.error.message);
  if (result.status !== 0) console.error(`Calibration diagnostic reported failures (exit ${result.status}). API startup will continue so Render logs can be inspected.`);
}

function syncVerifiedReviews() {
  if (!db.isConfigured()) return;
  const script = `const store=require('./backend/storage-adapter'); store.syncApprovedReviews().then(r=>{console.log('Verified-review sync:',JSON.stringify(r));process.exit(0)}).catch(e=>{console.error('Verified-review sync failed:',e);process.exit(1)})`;
  const result = spawnSync(process.execPath, ["-e", script], { stdio: "inherit", env: process.env, cwd: path.join(__dirname, "..") });
  if (result.status !== 0) console.error("Verified-review sync reported a failure; API startup will continue.");
}

function ensureBuyerRelease() {
  const script = `const {ensureBuyerRelease}=require('./backend/buyer-release'); ensureBuyerRelease('1.0.0').then(r=>{console.log('Buyer release:',JSON.stringify(r));process.exit(0)}).catch(e=>{console.error('Buyer release generation failed:',e);process.exit(1)})`;
  const result = spawnSync(process.execPath, ["-e", script], { stdio: "inherit", env: process.env, cwd: path.join(__dirname, "..") });
  if (result.status !== 0) console.error("Buyer release generation reported a failure; API startup will continue.");
}

runMigrations();
runCalibrationDiagnostic();
syncVerifiedReviews();
ensureBuyerRelease();
console.log(`Starting ModelJudge AI API internally on port ${BACKEND_PORT}...`);

const backendEnv = { ...process.env, PORT: String(BACKEND_PORT) };
const backend = spawn(process.execPath, [path.join(__dirname, "..", "backend", "server.js")], { stdio: "inherit", env: backendEnv });
backend.on("error", error => { console.error("Unable to start ModelJudge AI API:", error.message); process.exit(1); });

function proxyApi(req, res) {
  const headers = { ...req.headers, host: `127.0.0.1:${BACKEND_PORT}` };
  const options = { hostname: "127.0.0.1", port: BACKEND_PORT, path: req.originalUrl, method: req.method, headers };
  const proxy = http.request(options, backendRes => { res.writeHead(backendRes.statusCode || 502, backendRes.headers); backendRes.pipe(res); });
  proxy.on("error", error => { console.error("API proxy error:", error.message); if (!res.headersSent) res.status(502).json({ error: "API unavailable" }); else res.end(); });
  req.pipe(proxy);
}

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => { if (req.path === "/api" || req.path.startsWith("/api/")) return proxyApi(req, res); next(); });
app.use(express.static(FRONTEND_DIR, { extensions: ["html"] }));
app.get("/", (req, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));
app.use((req, res) => { if (req.method === "GET" && !req.path.startsWith("/api/")) return res.sendFile(path.join(FRONTEND_DIR, "index.html")); res.status(404).json({ error: "Not found" }); });
const publicServer = app.listen(PUBLIC_PORT, "0.0.0.0", () => console.log(`ModelJudge AI public web service listening on port ${PUBLIC_PORT}`));
function shutdown(signal) { publicServer.close(() => process.exit(0)); if (!backend.killed) backend.kill(signal); }
backend.on("exit", (code, signal) => { if (signal) return shutdown("SIGTERM"); if (code !== 0) { console.error(`ModelJudge AI API exited with code ${code}`); shutdown("SIGTERM"); } });
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));