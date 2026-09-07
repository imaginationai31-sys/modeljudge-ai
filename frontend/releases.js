const API_URL = window.MODELJUDGE_API_URL || "http://localhost:8787/api";
const $ = id => document.getElementById(id);

function setNotice(message, type = "success") {
  $("notice").textContent = message;
  $("notice").dataset.type = type;
}

function getBuyerApiKey() {
  try {
    return sessionStorage.getItem("modeljudge_buyer_api_key") ||
      localStorage.getItem("modeljudge_buyer_api_key") ||
      sessionStorage.getItem("modeljudge_buyer_key") ||
      localStorage.getItem("modeljudge_buyer_key") ||
      "";
  } catch {
    return "";
  }
}

function saveBuyerApiKey(key) {
  try {
    sessionStorage.setItem("modeljudge_buyer_api_key", key);
    localStorage.setItem("modeljudge_buyer_api_key", key);
  } catch {}
}

async function getOrRequestBuyerApiKey() {
  const existing = getBuyerApiKey();
  if (existing) return existing;

  const entered = window.prompt(
    "Enter your ModelJudge buyer API key (mj_live_...). It will be saved in this browser for protected release downloads."
  );
  const key = String(entered || "").trim();
  if (!key) return "";
  saveBuyerApiKey(key);
  return key;
}

async function openProtectedRelease(event) {
  event.preventDefault();
  const link = event.currentTarget;
  const key = await getOrRequestBuyerApiKey();

  if (!key) {
    setNotice("Valid buyer API key required. Open Buyer Management and copy your active dataset:read key.", "error");
    return;
  }

  try {
    setNotice(`Opening ${link.textContent.trim()}…`);
    const response = await fetch(link.href, {
      headers: { "X-API-Key": key }
    });

    if (!response.ok) {
      let message = `Release request failed (${response.status})`;
      try {
        const data = await response.json();
        if (data.error) message = data.error;
      } catch {}

      if (response.status === 401 || response.status === 403) {
        try {
          sessionStorage.removeItem("modeljudge_buyer_api_key");
          localStorage.removeItem("modeljudge_buyer_api_key");
        } catch {}
        setNotice(`${message}. Your buyer key may be invalid, revoked, or missing dataset:read scope.`, "error");
        return;
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const newWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

    if (!newWindow) {
      const download = document.createElement("a");
      download.href = objectUrl;
      download.download = link.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "modeljudge-release";
      document.body.appendChild(download);
      download.click();
      download.remove();
    }

    setNotice(`${link.textContent.trim()} opened with buyer authentication.`, "success");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    setNotice(`Unable to open release file: ${error.message}`, "error");
  }
}

function wireProtectedReleaseLinks() {
  document.querySelectorAll('a[href*="/api/buyer/releases/"]').forEach(link => {
    if (link.dataset.buyerAuth === "true") return;
    link.dataset.buyerAuth = "true";
    link.addEventListener("click", openProtectedRelease);
  });
}

async function loadRelease() {
  try {
    const response = await fetch(`${API_URL}/release`);
    if (!response.ok) throw new Error("Release API unavailable");
    const data = await response.json();
    $("version").textContent = data.version;
    $("count").textContent = data.record_count.toLocaleString();
    $("quality").textContent = `${data.average_quality_score}/5`;
    $("verified").textContent = `${(data.human_verification_rate * 100).toFixed(1)}%`;
    setNotice(`Release ${data.version} metadata loaded.`);
    wireProtectedReleaseLinks();
  } catch (error) {
    setNotice(`Live metadata unavailable: ${error.message}. The release files remain accessible when generated.`, "error");
    wireProtectedReleaseLinks();
  }
}

$("refreshBtn").addEventListener("click", loadRelease);
loadRelease();
