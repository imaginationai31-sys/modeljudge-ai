const API_URL = window.MODELJUDGE_API_URL || "http://localhost:8787/api";
const $ = id => document.getElementById(id);
function setNotice(message, type = "success") { $("notice").textContent = message; $("notice").dataset.type = type; }

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
  } catch (error) {
    setNotice(`Live metadata unavailable: ${error.message}. The release files remain accessible when generated.`, "error");
  }
}
$("refreshBtn").addEventListener("click", loadRelease);
loadRelease();
