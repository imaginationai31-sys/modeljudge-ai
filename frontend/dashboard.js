const API_URL = window.MODELJUDGE_API_URL || "http://localhost:8787/api";
const dimensions = ["accuracy", "relevance", "clarity", "safety"];

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function setNotice(message, type = "success") { $("notice").textContent = message; $("notice").dataset.type = type; }
function average(records, fields) {
  const values = records.flatMap(r => fields.map(f => Number(r[f])).filter(Number.isFinite));
  return values.length ? values.reduce((a,b) => a+b, 0) / values.length : 0;
}
function distribution(records, field) {
  return records.reduce((out, r) => { const key = r[field] || "Unknown"; out[key] = (out[key] || 0) + 1; return out; }, {});
}
function renderBars(target, data, total) {
  const entries = Object.entries(data).sort((a,b) => b[1]-a[1]);
  $(target).innerHTML = entries.length ? entries.map(([label, count]) => {
    const pct = total ? (count / total) * 100 : 0;
    return `<div class="bar"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${pct}%"></div></div><b>${count}</b></div>`;
  }).join("") : `<div class="empty">No data available</div>`;
}

async function loadDashboard() {
  try {
    const [evalResponse, reviewerResponse] = await Promise.all([
      fetch(`${API_URL}/evaluations?limit=500`),
      fetch(`${API_URL}/reviewers/stats`)
    ]);
    if (!evalResponse.ok) throw new Error("Evaluation API returned an error");
    const evalData = await evalResponse.json();
    const records = evalData.records || [];
    let reviewerData = { reviewer_count: 0 };
    if (reviewerResponse.ok) reviewerData = await reviewerResponse.json();

    const uniquePrompts = new Set(records.map(r => r.prompt)).size;
    const verified = records.filter(r => r.verified === true).length;
    $("total").textContent = String(evalData.count ?? records.length);
    $("unique").textContent = String(uniquePrompts);
    $("verified").textContent = String(verified);
    $("reviewers").textContent = String(reviewerData.reviewer_count || 0);

    renderBars("preferences", distribution(records, "preferred_response"), records.length);
    renderBars("categories", distribution(records, "category"), records.length);
    renderBars("languages", distribution(records, "language"), records.length);

    const quality = {};
    for (const dimension of dimensions) {
      const value = average(records, [`${dimension}_a`, `${dimension}_b`]);
      quality[dimension[0].toUpperCase() + dimension.slice(1)] = Number(value.toFixed(2));
    }
    renderBars("quality", Object.fromEntries(Object.entries(quality).map(([k,v]) => [k, Math.round((v / 5) * 100)])), 100);
    $("quality").querySelectorAll(".bar").forEach((row, index) => {
      const key = Object.keys(quality)[index];
      row.querySelector("b").textContent = `${quality[key]}/5`;
    });

    $("recent").innerHTML = records.length ? records.slice(0, 20).map(r => {
      const q = average([r], dimensions.flatMap(d => [`${d}_a`, `${d}_b`])).toFixed(2);
      return `<tr><td>${esc(r.id)}</td><td>${esc(r.category)}</td><td><span class="badge">${esc(r.preferred_response)}</span></td><td>${q}/5</td><td>${r.verified ? "Yes" : "No"}</td><td>${esc(new Date(r.created_at).toLocaleDateString())}</td></tr>`;
    }).join("") : `<tr><td colspan="6" class="empty">No evaluations found.</td></tr>`;
    setNotice(`Loaded ${records.length} evaluations from the API.`);
  } catch (error) {
    setNotice(`Dashboard unavailable: ${error.message}. Start the backend with npm start.`, "error");
    $("recent").innerHTML = `<tr><td colspan="6" class="empty">Connect the ModelJudge API to inspect live data.</td></tr>`;
  }
}

$("refreshBtn").addEventListener("click", loadDashboard);
loadDashboard();
