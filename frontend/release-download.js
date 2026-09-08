(() => {
  const API_BASE = String(window.MODELJUDGE_API_URL || "/api").replace(/\/$/, "");

  async function getRelease() {
    const response = await fetch(`${API_BASE}/release`, { headers: { Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Release metadata failed (${response.status})`);
    return data;
  }

  async function getManifest(version, key) {
    const response = await fetch(`${API_BASE}/buyer/releases/${encodeURIComponent(version)}/manifest`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || (response.status === 401 ? "Invalid buyer API key." : response.status === 403 ? "This API key does not have dataset:read access." : `Manifest lookup failed (${response.status})`));
    }
    return data;
  }

  async function sha256Hex(buffer) {
    if (!window.crypto?.subtle) throw new Error("This browser does not support automatic SHA-256 verification.");
    const digest = await window.crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
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
    status.textContent = "Preparing verified dataset and checking SHA-256 checksum…";
    status.dataset.type = "";
    try {
      const release = await getRelease();
      const version = release.version;
      if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("The live release version is invalid.");

      const manifest = await getManifest(version, key);
      const expected = manifest?.files?.["evaluations.jsonl"];
      if (!expected?.sha256) throw new Error("Release manifest does not contain a JSONL SHA-256 checksum.");

      const response = await fetch(`${API_BASE}/buyer/releases/${encodeURIComponent(version)}/dataset?format=jsonl`, {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/jsonl, text/plain" }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || (response.status === 401 ? "Invalid buyer API key." : response.status === 403 ? "This API key does not have dataset:read access." : `Download failed (${response.status})`));
      }

      const buffer = await response.arrayBuffer();
      const actual = await sha256Hex(buffer);
      const actualBytes = buffer.byteLength;
      const expectedBytes = Number(expected.bytes);
      if (Number.isFinite(expectedBytes) && actualBytes !== expectedBytes) {
        throw new Error(`Checksum verification failed: expected ${expectedBytes} bytes, received ${actualBytes}. The file was not downloaded.`);
      }
      if (actual.toLowerCase() !== String(expected.sha256).toLowerCase()) {
        throw new Error(`Checksum verification failed: expected ${expected.sha256}, received ${actual}. The file was not downloaded.`);
      }

      try {
        sessionStorage.setItem(`modeljudge_checksum_verified_v${version}`, "true");
      } catch (_) {}
      window.dispatchEvent(new CustomEvent("modeljudge:checksum-verified", { detail: { version, bytes: actualBytes, sha256: actual } }));

      const blob = new Blob([buffer], { type: "application/jsonl" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `modeljudge-ai-human-preference-evaluations-v${version}.jsonl`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      status.textContent = `SHA-256 verified ✓ JSONL downloaded — release v${version}, ${actualBytes.toLocaleString()} bytes, ${Number(release.record_count || 0)} records.`;
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
    panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap"><div><span class="eyebrow">BUYER DATASET</span><h2 style="margin:4px 0 6px">Verified Dataset Download</h2><p class="muted" style="margin:0">Download the current human-verified JSONL release. The browser automatically checks the downloaded bytes against the release manifest SHA-256 checksum before saving the file.</p></div><div style="display:flex;gap:10px;flex:1;min-width:280px;max-width:620px"><input id="buyerDatasetKey" type="password" autocomplete="off" placeholder="Buyer API key (dataset:read)" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:9px;background:var(--card);color:inherit"><button class="button primary" id="downloadVerifiedDataset" type="button">Download & Verify JSONL</button></div></div><div id="buyerDatasetStatus" class="muted" role="status" aria-live="polite" style="margin-top:12px"></div>`;
    head.insertAdjacentElement("afterend", panel);
    document.getElementById("downloadVerifiedDataset").addEventListener("click", downloadDataset);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initReleaseDownload, { once: true });
  else initReleaseDownload();
})();
