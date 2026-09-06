const API_URL = window.MODELJUDGE_API_URL || "http://localhost:8787/api";
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function pct(v) { return `${(Number(v || 0) * 100).toFixed(1)}%`; }
function setNotice(message, type = "success") { $("notice").textContent = message; $("notice").dataset.type = type; }
async function json(path) { const r = await fetch(`${API_URL}${path}`); if (!r.ok) throw new Error(`${path} returned ${r.status}`); return r.json(); }
async function load() {
  try {
    const [release, reliability, reviewers] = await Promise.all([json("/release"), json("/reliability"), json("/reviewers/stats")]);
    const summary = { evaluations: release.record_count || 0, reviews: 0, average_quality_score: release.average_quality_score || 0, review_coverage: 0, calibration_accuracy: 0 };
    $("evaluations").textContent = summary.evaluations;
    $("qualityScore").textContent = `${Number(summary.average_quality_score).toFixed(2)}/5`;
    $("coverage").textContent = "—";
    $("calibration").textContent = "—";
    const sample = reliability.sample || {};
    summary.reviews = sample.review_count || 0;
    $("reviews").textContent = summary.reviews;
    $("coverage").textContent = pct(sample.evaluation_count ? summary.reviews / sample.evaluation_count : 0);
    const reliabilityText = `Fleiss κ: ${reliability.preference_reliability?.fleiss_kappa ?? "—"}<br>Krippendorff α: ${reliability.preference_reliability?.krippendorff_alpha_nominal ?? "—"}<br>Mean pairwise Cohen κ: ${reliability.preference_reliability?.mean_pairwise_cohen_kappa ?? "—"}<br>Multi-review coverage: ${pct(sample.multi_review_coverage)}`;
    $("reliability").innerHTML = reliabilityText;
    const reviewerList = reviewers.reviewers || [];
    $("reviewerSummary").textContent = `${reviewerList.length} reviewer(s) currently represented in the analytics feed.`;
    $("reviewerTable").innerHTML = reviewerList.length ? reviewerList.map(r => `<tr><td>${esc(r.reviewer_id)}</td><td><span class="badge">analytics</span></td><td>${Number(r.average_score).toFixed(2)}/5</td><td>—</td><td>${Number(r.review_count)}</td></tr>`).join("") : `<tr><td colspan="5" class="empty">No reviewer data available.</td></tr>`;
    const certification = await json("/certification");
    $("status").textContent = certification.status.replaceAll("_", " ");
    $("statusText").textContent = certification.status === "ready" ? "All configured release gates passed." : certification.status === "conditional" ? "Most gates passed; resolve remaining evidence before buyer certification." : "The dataset is not ready for internal certification under the configured gates.";
    $("checks").innerHTML = (certification.certification?.checks || []).map(c => `<div class="check"><span>${esc(c.key.replaceAll("_", " "))}<br><small class="muted">actual ${Number(c.actual).toFixed(3)} · required ${Number(c.required).toFixed(3)}</small></span><b class="${c.pass ? "pass" : "fail"}">${c.pass ? "PASS" : "FAIL"}</b></div>`).join("");
    setNotice("Quality evidence refreshed.");
  } catch (error) { setNotice(`Quality Center unavailable: ${error.message}. Ensure the API and generated reports are running.`, "error"); }
}
$("refreshBtn").addEventListener("click", load); load();
