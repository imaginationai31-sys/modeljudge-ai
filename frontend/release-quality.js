// Buyer-facing release quality and provenance panel.
// Uses the public /api/release metadata only; no buyer credential is stored or sent.
(function () {
  "use strict";

  const API_URL = window.MODELJUDGE_API_URL || "/api";
  const formatPercent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
  const formatScore = (value) => `${Number(value || 0).toFixed(2)} / 5`;

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
          <div style="font-size:11px;letter-spacing:.12em;font-weight:700;opacity:.65;">BUYER DATASET</div>
          <h2 style="margin:5px 0 6px;font-size:20px;">Dataset Quality &amp; Provenance</h2>
          <p style="margin:0;opacity:.72;max-width:760px;">Live release metadata for buyers evaluating the dataset for model training, preference learning, benchmarking, or evaluation workflows.</p>
        </div>
        <span id="mj-release-status" style="font-size:12px;padding:6px 10px;border-radius:999px;background:rgba(34,197,94,.12);">Loading…</span>
      </div>
      <div id="mj-release-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin-top:18px;"></div>
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(148,163,184,.15);font-size:12px;line-height:1.6;opacity:.78;">
        <strong>Provenance:</strong> records originate from ModelJudge AI human-preference evaluations. Verification status is synchronized with reviewer approval records. Duplicate detection uses evaluation fingerprints. Quality scores are calculated from the stored accuracy, relevance, clarity, and safety ratings.
      </div>
    `;
    head.insertAdjacentElement("afterend", panel);

    try {
      const response = await fetch(`${API_URL}/release`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const grid = panel.querySelector("#mj-release-grid");
      const status = panel.querySelector("#mj-release-status");
      const cards = [
        ["Release", `v${data.version}`],
        ["Records", data.record_count],
        ["Unique prompts", data.unique_prompts],
        ["Human verified", formatPercent(data.human_verification_rate)],
        ["Avg quality", formatScore(data.average_quality_score)],
        ["Duplicate rate", formatPercent(data.duplicate_rate)],
        ["Format", data.format],
        ["Schema", data.schema ? "Evaluation schema" : "Not reported"]
      ];
      grid.innerHTML = cards.map(([label, value]) => `
        <div style="padding:13px;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(2,6,23,.25);">
          <div style="font-size:11px;opacity:.58;margin-bottom:5px;">${label}</div>
          <div style="font-size:16px;font-weight:700;word-break:break-word;">${String(value)}</div>
        </div>
      `).join("");
      status.textContent = "Live release metadata";
    } catch (error) {
      panel.querySelector("#mj-release-status").textContent = "Metadata unavailable";
      panel.querySelector("#mj-release-grid").innerHTML = `<div style="opacity:.65;font-size:13px;">Unable to load release metadata right now.</div>`;
      console.error("ModelJudge release metadata:", error);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadReleaseQuality, { once: true });
  else loadReleaseQuality();
})();
