const API_URL = window.MODELJUDGE_API_URL || "http://localhost:8787/api";
const dimensions = ["accuracy", "relevance", "clarity", "safety"];
let evaluations = [];
let currentEvaluation = null;
let authToken = localStorage.getItem("modeljudge_token") || "";

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function setNotice(message, type = "success") {
  const node = $("notice");
  if (node) { node.textContent = message; node.dataset.type = type; }
}

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

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) {
    const error = new Error(data.error || `API request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function setMetric(id, value) { if ($(id)) $(id).textContent = value; }

function renderVerificationQueue(records) {
  const target = $("reviewQueue");
  if (!target) return;
  const pending = records.filter(r => r.verified !== true);
  setMetric("pendingVerification", pending.length);
  const verified = records.filter(r => r.verified === true).length;
  setMetric("verificationRate", records.length ? `${Math.round((verified / records.length) * 100)}%` : "0%");

  target.innerHTML = pending.length ? pending.slice(0, 25).map((r, i) => `
    <button type="button" class="review-queue-item ${currentEvaluation?.id === r.id ? "active" : ""}" data-evaluation-id="${esc(r.id)}">
      <span><strong>${esc(r.id)}</strong><small>${esc(r.category || "General Knowledge")}</small></span>
      <span class="badge">${esc(r.preferred_response || "Pending")}</span>
    </button>`).join("") : `<div class="empty">No evaluations are waiting for verification.</div>`;

  target.querySelectorAll("[data-evaluation-id]").forEach(button => {
    button.addEventListener("click", () => openVerification(button.dataset.evaluationId));
  });
}

function populateVerificationForm(record) {
  if (!$("verificationForm")) return;
  $("verificationContent").innerHTML = `
    <div class="prompt-card"><label>Prompt</label><p>${esc(record.prompt)}</p></div>
    <div class="responses">
      <article class="response-card"><div class="response-header"><span>Response A</span></div><p>${esc(record.response_a)}</p></article>
      <article class="response-card"><div class="response-header"><span>Response B</span></div><p>${esc(record.response_b)}</p></article>
    </div>`;
  dimensions.forEach(d => {
    const a = Number(record[`${d}_a`]) || 1;
    const b = Number(record[`${d}_b`]) || 1;
    const selectA = $(`review_${d}_a`);
    const selectB = $(`review_${d}_b`);
    if (selectA) selectA.value = String(a);
    if (selectB) selectB.value = String(b);
  });
  const preference = $("reviewPreference");
  if (preference) preference.value = record.preferred_response || "A";
  $("verificationForm").hidden = false;
  $("verificationForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function openVerification(id) {
  const record = evaluations.find(r => String(r.id) === String(id));
  if (!record) return;
  currentEvaluation = record;
  populateVerificationForm(record);
  renderVerificationQueue(evaluations);
  try {
    const consensus = await api(`/reviews/consensus/${encodeURIComponent(record.id)}`);
    const agreement = Number(consensus.agreement ?? consensus.agreement_rate ?? consensus.percent_agreement);
    if (Number.isFinite(agreement)) setMetric("reviewerAgreement", `${Math.round(agreement <= 1 ? agreement * 100 : agreement)}%`);
  } catch (_) {}
}

async function loadReviewerCenter(records) {
  renderVerificationQueue(records);
  try {
    const quality = await api("/reviewers/me/quality");
    const score = Number(quality.quality_score ?? quality.score ?? quality.reviewer_score);
    const calibration = Number(quality.calibration_accuracy ?? quality.calibrationAccuracy);
    setMetric("reviewerScore", Number.isFinite(score) ? `${score.toFixed(2)}/5` : "—");
    setMetric("calibrationAccuracy", Number.isFinite(calibration) ? `${Math.round(calibration <= 1 ? calibration * 100 : calibration)}%` : "—");
    setMetric("qualityScore", Number.isFinite(score) ? `${score.toFixed(2)}/5` : "—");
    setMetric("consecutiveFailures", String(quality.consecutive_failures ?? quality.consecutiveFailures ?? 0));
    setMetric("controlStatus", quality.status || "Unknown");
  } catch (error) {
    setMetric("reviewerScore", "Login required");
    setMetric("calibrationAccuracy", "—");
    setMetric("qualityScore", "—");
    setMetric("consecutiveFailures", "—");
    setMetric("controlStatus", error.status === 401 ? "Not authenticated" : "Unavailable");
  }

  try {
    const history = await api("/reviewers/me/history");
    const events = history.history || [];
    const target = $("auditEvents");
    if (target) target.innerHTML = events.length ? events.slice(0, 8).map(e => `<div class="audit-event"><strong>${esc(e.action || e.event || "Quality event")}</strong><small>${esc(e.created_at || e.createdAt || "")}</small></div>`).join("") : `<div class="empty">No audit events yet.</div>`;
  } catch (_) {
    if ($("auditEvents")) $("auditEvents").innerHTML = `<div class="empty">Sign in as a reviewer to view audit history.</div>`;
  }

  try {
    const reliability = await api("/reliability");
    const sample = reliability.sample || {};
    const agreement = Number(sample.agreement_rate ?? sample.agreement ?? reliability.agreement_rate);
    if (Number.isFinite(agreement)) setMetric("reviewerAgreement", `${Math.round(agreement <= 1 ? agreement * 100 : agreement)}%`);
  } catch (_) {}
}

async function submitVerification(action) {
  if (!currentEvaluation) return setNotice("Select an evaluation first.", "error");
  if (!authToken) return setNotice("Reviewer login is required before submitting a verification.", "error");

  const payload = {
    evaluation_id: currentEvaluation.id,
    reviewer_id: localStorage.getItem("modeljudge_reviewer_id") || undefined,
    preferred_response: $("reviewPreference")?.value || currentEvaluation.preferred_response,
    accuracy_a: Number($("review_accuracy_a")?.value || currentEvaluation.accuracy_a),
    accuracy_b: Number($("review_accuracy_b")?.value || currentEvaluation.accuracy_b),
    relevance_a: Number($("review_relevance_a")?.value || currentEvaluation.relevance_a),
    relevance_b: Number($("review_relevance_b")?.value || currentEvaluation.relevance_b),
    clarity_a: Number($("review_clarity_a")?.value || currentEvaluation.clarity_a),
    clarity_b: Number($("review_clarity_b")?.value || currentEvaluation.clarity_b),
    safety_a: Number($("review_safety_a")?.value || currentEvaluation.safety_a),
    safety_b: Number($("review_safety_b")?.value || currentEvaluation.safety_b),
    reason: $("reviewComment")?.value.trim() || `Reviewer ${action}: verification completed based on the evaluation criteria.`,
    confidence: $("reviewConfidence")?.value || "medium"
  };
  delete payload.reviewer_id;

  try {
    const result = await api("/reviews", { method: "POST", body: JSON.stringify(payload) });
    setNotice(`Review saved successfully. ${result.consensus?.review_count ? `Consensus now has ${result.consensus.review_count} review(s).` : ""}`);
    if ($("verificationForm")) $("verificationForm").hidden = true;
    currentEvaluation = null;
    await loadDashboard();
  } catch (error) {
    setNotice(error.status === 401 ? "Your reviewer session has expired. Please sign in again." : error.message, "error");
  }
}

function wireVerificationActions() {
  $("approveVerification")?.addEventListener("click", () => submitVerification("approved"));
  $("requestRevision")?.addEventListener("click", () => submitVerification("revision requested"));
  $("rejectVerification")?.addEventListener("click", () => submitVerification("rejected"));
  $("cancelVerification")?.addEventListener("click", () => { currentEvaluation = null; $("verificationForm").hidden = true; });
}

async function loadDashboard() {
  try {
    const [evalData, reviewerData] = await Promise.all([
      api("/evaluations?limit=500"),
      api("/reviewers/stats").catch(() => ({ reviewer_count: 0 }))
    ]);
    evaluations = evalData.records || [];
    const records = evaluations;
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

    await loadReviewerCenter(records);
    setNotice(`Loaded ${records.length} evaluations from the API.`);
  } catch (error) {
    setNotice(`Dashboard unavailable: ${error.message}. Start the backend with npm start.`, "error");
    if ($("recent")) $("recent").innerHTML = `<tr><td colspan="6" class="empty">Connect the ModelJudge API to inspect live data.</td></tr>`;
  }
}

wireVerificationActions();
$("refreshBtn")?.addEventListener("click", loadDashboard);
loadDashboard();
