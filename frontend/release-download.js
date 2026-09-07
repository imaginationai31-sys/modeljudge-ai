(() => {
  const API_BASE = String(window.MODELJUDGE_API_URL || "/api").replace(/\/$/, "");
  const KEY_STORAGE = "modeljudge_buyer_api_key";

  function esc(value) {
    return String(value ?? "").replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));
  }

  async function getRelease() {
    const response = await fetch(`${API_BASE}/release`, { headers: { Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Release metadata failed (${response.status})`);
    return data;
  }

  async function downloadDataset() {
    const key = document.getElementById("buyerDatasetKey")?.value.trim();
    const status = document.getElementById("buyerDatasetStatus");
    const button = document.getElementById("downloadVerifiedDataset");
    if (!key) {
      status.textContent = "Enter a buyer API key with dataset:read access.";
      status.dataset.type = "error";
      return;
    }

    button.disabled = true;
    status.textContent = "Preparing verified dataset…";
    status.dataset.type = "";
    try {
      const release = await getRelease();
      const version = release.version;
      if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("The live release version is invalid.");
      const response = await fetch(`${API_BASE}/buyer/releases/${encodeURIComponent(version)}/dataset?format=jsonl`, {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/jsonl, text/plain" }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || (response.status === 401 ? "Invalid buyer API key." : response.status === 403 ? "This API key does not have dataset:read access." : `Download failed (${response.status})`));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `modeljudge-ai-human-preference-evaluations-v${version}.jsonl`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      sessionStorage.setItem(KEY_STORAGE, key);
      status.textContent = `Verified JSONL downloaded — release v${esc(version)}, ${Number(release.record_count || 0)} records.`;
      status.dataset.type = "success";
    } catch (error) {
      status.textContent = error.message || "Dataset download failed.";
      status.dataset.type = "error";
    } finally {
      button.disabled = false;
    }
  }

  function initReleaseDownload() {
    const head = document.querySelector(".dash-head");
    if (!head || document.getElementById("verifiedDatasetPanel")) return;
    const panel = document.createElement("section");
    panel.id = "verifiedDatasetPanel";
    panel.className = "panel";
    panel.style.marginBottom = "24px";
    panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap"><div><span class="eyebrow">BUYER DATASET</span><h2 style="margin:4px 0 6px">Verified Dataset Download</h2><p class="muted" style="margin:0">Download the current human-verified JSONL release using a buyer API key with <code>dataset:read</code> access.</p></div><div style="display:flex;gap:10px;flex:1;min-width:280px;max-width:620px"><input id="buyerDatasetKey" type="password" autocomplete="off" placeholder="Buyer API key (dataset:read)" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:9px;background:var(--card);color:inherit"><button class="button primary" id="downloadVerifiedDataset" type="button">Download JSONL</button></div></div><div id="buyerDatasetStatus" class="muted" role="status" aria-live="polite" style="margin-top:12px"></div>`;
    head.insertAdjacentElement("afterend", panel);

    try {
      const savedKey = sessionStorage.getItem(KEY_STORAGE);
      if (savedKey) document.getElementById("buyerDatasetKey").value = savedKey;
    } catch (_) {}
    document.getElementById("downloadVerifiedDataset").addEventListener("click", downloadDataset);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initReleaseDownload, { once: true });
  else initReleaseDownload();
})();
