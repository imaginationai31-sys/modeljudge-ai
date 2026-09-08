// Buyer-facing release certification and quality panel.
// Public dataset metrics load without credentials. Optional manifest/reviewer details
// use a buyer API key only in memory; the key is never persisted.
(function () {
  "use strict";

  const API_URL = String(window.MODELJUDGE_API_URL || "/api").replace(/\/$/, "");
  const formatPercent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
  const formatScore = (value) => `${Number(value || 0).toFixed(2)} / 5`;
  const esc = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));

  async function getJson(path, key) {
    const headers = { Accept: "application/json" };
    if (key) headers.Authorization = `Bearer ${key}`;
    const response = await fetch(`${API_URL}${path}`, { headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  function checksumState(version) {
    try {
      return sessionStorage.getItem(`modeljudge_checksum_verified_v${version}`) === "true";
    } catch (_) {
      return false;
    }
  }

  function renderCertification(panel, data, manifest, reviewerQuality) {
    const version = data.version;
    const verified = checksumState(version);
    const expected = manifest?.files?.["evaluations.jsonl"];
    const reviewer = reviewerQuality?.reviewers?.[0];
    const status = panel.querySelector("#mj-cert-status");
    const integrity = panel.querySelector("#mj-cert-integrity");
    const checksum = expected?.sha256 ? `${expected.sha256.slice(0, 16)}…` : "Available in buyer manifest";

    panel.querySelector("#mj-cert-grid").innerHTML = [
      ["Release", `v${data.version}`],
      ["Dataset records", data.record_count],
      ["Human verified", `${data.human_verification_rate === 1 ? "5/5" : formatPercent(data.human_verification_rate)} (${formatPercent(data.human_verification_rate)})`],
      ["Average quality", formatScore(data.average_quality_score)],
      ["Unique prompts", data.unique_prompts],
      ["Duplicate rate", formatPercent(data.duplicate_rate)],
      ["Release type", manifest?.immutable === true ? "Immutable" : "Published release"],
      ["Formats", manifest?.formats?.join(" + ") || data.format || "JSONL"]
    ].map(([label, value]) => `
      <div class="mj-cert-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>
    `).join("");

    integrity.innerHTML = `
      <div><span class="mj-cert-label">Dataset integrity</span><strong class="mj-cert-value ${verified ? "good" : "pending"}">${verified ? "✓ SHA-256 verified" : "Manifest checksum published"}</strong></div>
      <div class="mj-cert-detail"><strong>JSONL SHA-256:</strong> <code>${esc(checksum)}</code>${expected?.bytes ? ` · ${Number(expected.bytes).toLocaleString()} bytes` : ""}</div>
      <div class="mj-cert-detail"><strong>Reviewer evidence:</strong> ${reviewer ? `${esc(reviewer.review_count)} reviews · ${esc(formatScore(reviewer.average_score))} average · ${esc(formatPercent(reviewer.tie_rate))} tie rate` : "Enter a buyer API key below to load reviewer statistics."}</div>
    `;
    status.textContent = verified ? "Certified · integrity verified in this browser" : "Release certification available";
    status.dataset.type = verified ? "success" : "";
  }

  async function loadReleaseQuality() {
    if (document.querySelector("#mj-release-quality")) return;
    const head = document.querySelector(".dash-head");
    if (!head) return;

    const panel = document.createElement("section");
    panel.id = "mj-release-quality";
    panel.style.cssText = "margin:20px 0;padding:22px;border:1px solid rgba(148,163,184,.22);border-radius:16px;background:rgba(15,23,42,.55);box-shadow:0 10px 30px rgba(0,0,0,.12);";
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;">
        <div>
          <div style="font-size:11px;letter-spacing:.12em;font-weight:700;opacity:.65;">BUYER CERTIFICATION</div>
          <h2 style="margin:5px 0 6px;font-size:20px;">Release Certification</h2>
          <p style="margin:0;opacity:.72;max-width:760px;">A buyer-facing snapshot of verification, quality, integrity, reviewer evidence, and release provenance. Public metrics require no credential.</p>
        </div>
        <span id="mj-cert-status" style="font-size:12px;padding:6px 10px;border-radius:999px;background:rgba(34,197,94,.12);">Loading…</span>
      </div>
      <div id="mj-cert-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin-top:18px;"></div>
      <div id="mj-cert-integrity" style="margin-top:14px;padding:14px;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(2,6,23,.25);line-height:1.55;font-size:12px;"></div>
      <div style="margin-top:14px;padding:14px;border:1px solid rgba(148,163,184,.16);border-radius:12px;">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Load buyer-only certification evidence</div>
        <div style="display:flex;gap:9px;flex-wrap:wrap;">
          <input id="mj-cert-key" type="password" autocomplete="off" placeholder="Buyer API key (dataset:read)" style="flex:1;min-width:230px;padding:10px;border:1px solid var(--border);border-radius:9px;background:var(--card);color:inherit;box-sizing:border-box;">
          <button id="mj-cert-load" class="button secondary" type="button">Load manifest & reviewer evidence</button>
        </div>
        <div id="mj-cert-key-status" class="muted" style="margin-top:8px;font-size:12px;">The key is used only for this request and is not stored.</div>
      </div>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(148,163,184,.15);font-size:12px;line-height:1.6;opacity:.78;">
        <strong>Provenance:</strong> records originate from ModelJudge AI human-preference evaluations. Verification status is synchronized with reviewer approval records. Duplicate detection uses evaluation fingerprints. Quality scores are calculated from stored accuracy, relevance, clarity, and safety ratings. A checksum confirms byte-for-byte integrity of a downloaded artifact against the published manifest; it does not by itself establish provenance or licensing rights.
      </div>
    `;
    head.insertAdjacentElement("afterend", panel);

    let release;
    try {
      release = await getJson("/release");
      renderCertification(panel, release, null, null);
    } catch (error) {
      panel.querySelector("#mj-cert-status").textContent = "Metadata unavailable";
      panel.querySelector("#mj-cert-grid").innerHTML = `<div style="opacity:.65;font-size:13px;">Unable to load release metadata right now.</div>`;
      console.error("ModelJudge release metadata:", error);
      return;
    }

    panel.querySelector("#mj-cert-load").addEventListener("click", async () => {
      const keyInput = panel.querySelector("#mj-cert-key");
      const keyStatus = panel.querySelector("#mj-cert-key-status");
      const button = panel.querySelector("#mj-cert-load");
      const key = keyInput.value.trim();
      if (!key) {
        keyStatus.textContent = "Enter a buyer API key with dataset:read access.";
        keyStatus.dataset.type = "error";
        return;
      }
      button.disabled = true;
      keyStatus.textContent = "Loading signed release manifest and reviewer evidence…";
      try {
        const version = encodeURIComponent(release.version);
        const [manifest, reviewerQuality] = await Promise.all([
          getJson(`/buyer/releases/${version}/manifest`, key),
          getJson(`/buyer/releases/${version}/reviewer-quality`, key)
        ]);
        renderCertification(panel, release, manifest, reviewerQuality);
        keyStatus.textContent = "Buyer-only manifest and reviewer evidence loaded. Key remains in memory only.";
        keyStatus.dataset.type = "success";
        keyInput.value = "";
      } catch (error) {
        keyStatus.textContent = error.message || "Unable to load buyer certification evidence.";
        keyStatus.dataset.type = "error";
      } finally {
        button.disabled = false;
      }
    });

    window.addEventListener("modeljudge:checksum-verified", () => renderCertification(panel, release, null, null));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadReleaseQuality, { once: true });
  else loadReleaseQuality();
})();
