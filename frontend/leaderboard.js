const API_URL = window.MODELJUDGE_API_URL || "http://localhost:8787/api";
const dimensions = ["accuracy", "relevance", "clarity", "safety"];
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function setNotice(message, type = "success") { $("notice").textContent = message; $("notice").dataset.type = type; }
function avg(values) { const valid = values.filter(Number.isFinite); return valid.length ? valid.reduce((a,b) => a+b, 0) / valid.length : 0; }
function renderScores(target, entries, scale = 5) {
  const max = Math.max(...entries.map(([,v]) => v), scale);
  $(target).innerHTML = entries.length ? entries.map(([label, value]) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `<div class="score-item"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${pct}%"></div></div><b>${Number(value).toFixed(2)}</b></div>`;
  }).join("") : `<div class="empty">No data available</div>`;
}

async function loadLeaderboard() {
  try {
    const [evalResponse, reviewResponse, reviewerResponse] = await Promise.all([
      fetch(`${API_URL}/evaluations?limit=500`),
      fetch(`${API_URL}/reviews`),
      fetch(`${API_URL}/reviewers/stats`)
    ]);
    if (!evalResponse.ok) throw new Error("Evaluation API returned an error");
    const evalData = await evalResponse.json();
    const reviewData = reviewResponse.ok ? await reviewResponse.json() : { count: 0, reviews: [] };
    const reviewerData = reviewerResponse.ok ? await reviewerResponse.json() : { reviewer_count: 0, reviewers: [] };
    const records = evalData.records || [];
    const reviews = reviewData.reviews || [];
    const reviewers = reviewerData.reviewers || [];

    $("evalCount").textContent = String(evalData.count ?? records.length);
    $("reviewCount").textContent = String(reviewData.count ?? reviews.length);
    $("reviewerCount").textContent = String(reviewerData.reviewer_count || new Set(reviews.map(r => r.reviewer_id)).size);
    $("agreement").textContent = reviewers.length ? `${avg(reviewers.map(r => Number(r.average_score))).toFixed(2)}/5` : "—";
    $("coverage").textContent = records.length ? `${(reviews.length / records.length).toFixed(2)}×` : "0×";

    const ranked = [...reviewers].sort((a,b) => Number(b.average_score) - Number(a.average_score) || Number(b.review_count) - Number(a.review_count));
    $("reviewerTable").innerHTML = ranked.length ? ranked.map((r, i) => `<tr><td class="rank">${i + 1}</td><td>${esc(r.reviewer_id)}</td><td>${Number(r.review_count)}</td><td>${Number(r.average_score).toFixed(2)}/5</td><td>${(Number(r.tie_rate) * 100).toFixed(1)}%</td></tr>`).join("") : `<tr><td colspan="5" class="empty">No reviewer data yet.</td></tr>`;

    const quality = dimensions.map(d => {
      const values = reviews.flatMap(r => [Number(r[`${d}_a`]), Number(r[`${d}_b`])]);
      return [d[0].toUpperCase() + d.slice(1), avg(values)];
    });
    renderScores("quality", quality);

    const pref = reviews.reduce((out, r) => { out[r.preferred_response] = (out[r.preferred_response] || 0) + 1; return out; }, {});
    const prefEntries = ["A", "B", "Tie"].map(k => [k, pref[k] || 0]);
    renderScores("preferences", prefEntries, Math.max(1, ...prefEntries.map(([,v]) => v)));
    setNotice(`Loaded ${reviews.length} reviews across ${reviewers.length} reviewers.`);
  } catch (error) {
    setNotice(`Leaderboard unavailable: ${error.message}. Start the backend with npm start.`, "error");
    $("reviewerTable").innerHTML = `<tr><td colspan="5" class="empty">Connect the ModelJudge API to inspect live reviewer data.</td></tr>`;
  }
}

$("refreshBtn").addEventListener("click", loadLeaderboard);
loadLeaderboard();
