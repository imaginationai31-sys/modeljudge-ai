(() => {
  "use strict";

  const API_BASE = String(window.MODELJUDGE_API_URL || "/api").replace(/\/$/, "");
  const keyInput = document.getElementById("apiKey");
  const releasesEl = document.getElementById("releases");
  const statusEl = document.getElementById("status");
  const evidenceEl = document.getElementById("evidence");
  const usageEl = document.getElementById("usage");
  const versionSelect = document.getElementById("quickVersion");
  let buyerKey = "";
  let selectedVersion = "";

  function key() { return buyerKey || keyInput.value.trim(); }
  function esc(s) { return String(s ?? "").replace(/[&<>\"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;" }[c])); }
  function setStatus(text, bad = false) {
    statusEl.textContent = text;
    statusEl.className = `status${bad ? " danger" : ""}`;
  }
  function authHeaders(extra = {}) {
    return { Accept: "application/json", "X-API-Key": key(), ...extra };
  }
  async function api(path, options = {}) {
    const headers = authHeaders(options.headers || {});
    const res = await fetch(`${API_BASE}/buyer${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }
  function apiUrl(path) { return `${API_BASE}/buyer${path}`; }
  function formatBytes(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "—";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }
  function pct(value) { return `${(Number(value || 0) * 100).toFixed(1)}%`; }

  function updateQuickstart(v) {
    selectedVersion = v || selectedVersion;
    if (!selectedVersion) return;
    const encoded = encodeURIComponent(selectedVersion);
    document.getElementById("manifestCode").textContent = `curl -H "X-API-Key: YOUR_BUYER_KEY" \\\n  ${apiUrl(`/releases/${encoded}/manifest`)}`;
    document.getElementById("qualityCode").textContent = `curl -H "X-API-Key: YOUR_BUYER_KEY" \\\n  ${apiUrl(`/releases/${encoded}/quality`)}`;
    document.getElementById("reviewerCode").textContent = `curl -H "X-API-Key: YOUR_BUYER_KEY" \\\n  ${apiUrl(`/releases/${encoded}/reviewer-quality`)}`;
    document.getElementById("jsonlCode").textContent = `curl -H "X-API-Key: YOUR_BUYER_KEY" \\\n  "${apiUrl(`/releases/${encoded}/dataset?format=jsonl`)}" \\\n  -o modeljudge-v${selectedVersion}.jsonl`;
  }

  async function inspect(v) {
    selectedVersion = v;
    versionSelect.value = v;
    updateQuickstart(v);
    evidenceEl.innerHTML = `<div class="empty">Loading release evidence…</div>`;
    try {
      const [manifest, quality, reviewer] = await Promise.all([
        api(`/releases/${encodeURIComponent(v)}/manifest`),
        api(`/releases/${encodeURIComponent(v)}/quality`),
        api(`/releases/${encodeURIComponent(v)}/reviewer-quality`).catch(() => null)
      ]);
      const jsonFile = manifest?.files?.["evaluations.jsonl"];
      const csvFile = manifest?.files?.["evaluations.csv"];
      const reviewerList = Array.isArray(reviewer?.reviewers) ? reviewer.reviewers : [];
      evidenceEl.innerHTML = `
        <div class="metric-grid">
          <div class="metric"><span>Release</span><strong>v${esc(manifest.release_version || v)}</strong></div>
          <div class="metric"><span>Records</span><strong>${esc(manifest.record_count)}</strong></div>
          <div class="metric"><span>Verified</span><strong>${esc(quality.verified_count)} / ${esc(quality.record_count)}</strong></div>
          <div class="metric"><span>Quality</span><strong>${Number(quality.average_quality_score || 0).toFixed(2)} / 5</strong></div>
        </div>
        <div class="console-grid">
          <div class="card"><h3>Integrity & release</h3><div class="evidence">
            <div class="evidence-row"><span>Immutable</span><strong>${manifest.immutable ? "Yes ✓" : "No"}</strong></div>
            <div class="evidence-row"><span>JSONL</span><strong>${formatBytes(jsonFile?.bytes)}</strong></div>
            <div class="evidence-row"><span>CSV</span><strong>${formatBytes(csvFile?.bytes)}</strong></div>
            <div class="evidence-row"><span>JSONL SHA-256</span><strong class="small">${esc(jsonFile?.sha256 || "Not reported")}</strong></div>
          </div></div>
          <div class="card"><h3>Quality evidence</h3><div class="evidence">
            <div class="evidence-row"><span>Human verified</span><strong>${pct(quality.verified_rate)}</strong></div>
            <div class="evidence-row"><span>Average quality</span><strong>${Number(quality.average_quality_score || 0).toFixed(2)} / 5</strong></div>
            <div class="evidence-row"><span>Score scale</span><strong>${esc(quality.score_scale || "1-5")}</strong></div>
            <div class="evidence-row"><span>Reviewer evidence</span><strong>${reviewerList.length ? `${reviewerList.length} reviewer(s)` : "Unavailable"}</strong></div>
          </div></div>
        </div>
        <div class="card" style="margin-top:16px"><h3>Reviewer evidence</h3>${reviewerList.length ? reviewerList.map(r => `<div class="evidence-row"><span>${esc(r.reviewer_id)} · ${esc(r.review_count)} reviews</span><strong>Avg ${Number(r.average_score || 0).toFixed(2)} · Tie ${pct(r.tie_rate)}</strong></div>`).join("") : "<p class='muted small'>Reviewer-quality evidence is not available for this release.</p>"}</div>
        <div class="card" style="margin-top:16px"><h3>Provenance & license</h3><p class="muted small">${esc(manifest.provenance || "See release manifest.")}</p><p class="muted small" style="margin-bottom:0">${esc(manifest.license || "See repository LICENSE and dataset-specific provenance records.")}</p></div>
      `;
    } catch (e) {
      evidenceEl.innerHTML = `<div class="status danger">${esc(e.message)}</div>`;
    }
  }

  async function load() {
    const entered = keyInput.value.trim();
    if (!entered) return setStatus("Enter a buyer API key", true);
    buyerKey = entered;
    setStatus("Connecting…");
    try {
      const [data, usage] = await Promise.all([api("/releases"), api("/usage")]);
      const versions = Array.isArray(data.versions) ? data.versions : [];
      releasesEl.innerHTML = versions.length ? versions.map(v => `
        <div class="release"><div><strong>v${esc(v)}</strong><span class="muted"> Immutable release</span></div>
        <div class="buttonrow"><button class="button secondary" type="button" data-v="${esc(v)}">Inspect</button></div>
        <div class="download-status" data-status="${esc(v)}"></div></div>`).join("") : "<div class='empty'>No releases published yet.</div>";
      versionSelect.innerHTML = versions.length ? versions.map(v => `<option value="${esc(v)}">v${esc(v)}</option>`).join("") : "<option value="">No releases</option>";
      releasesEl.querySelectorAll("button[data-v]").forEach(button => button.addEventListener("click", () => inspect(button.dataset.v)));
      usageEl.innerHTML = `<strong>${usage.total_downloads || 0}</strong> downloads · <strong>${usage.records_downloaded || 0}</strong> records · <strong>${usage.versions_downloaded || 0}</strong> versions<br><small>Server-side daily limit applies. Download activity is recorded for operational auditing.</small>`;
      setStatus(`Connected · ${versions.length} release${versions.length === 1 ? "" : "s"} available`);
      if (versions.length) await inspect(selectedVersion && versions.includes(selectedVersion) ? selectedVersion : versions[versions.length - 1]);
    } catch (e) {
      buyerKey = "";
      setStatus(e.message, true);
      releasesEl.innerHTML = "<div class='empty'>Unable to load buyer data.</div>";
      usageEl.textContent = "Unable to load usage.";
      evidenceEl.innerHTML = "<div class='empty'>No release selected.</div>";
    }
  }

  document.getElementById("connect").addEventListener("click", load);
  document.getElementById("clear").addEventListener("click", () => {
    buyerKey = "";
    keyInput.value = "";
    selectedVersion = "";
    setStatus("Not connected");
    releasesEl.innerHTML = "<div class='empty'>Connect to load releases.</div>";
    usageEl.textContent = "No usage details exposed to the browser.";
    evidenceEl.innerHTML = "<div class='empty'>No release selected.</div>";
    versionSelect.innerHTML = "<option value=\"\">Connect first</option>";
    ["manifestCode", "qualityCode", "reviewerCode", "jsonlCode"].forEach(id => { document.getElementById(id).textContent = "Connect and select a release."; });
  });
  versionSelect.addEventListener("change", () => { if (versionSelect.value) inspect(versionSelect.value); });
})();
