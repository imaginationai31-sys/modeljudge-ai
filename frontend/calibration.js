(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c] || c));
  const API = window.MODELJUDGE_API_URL || "/api";
  let task = null;

  async function calibrationApi(path, options = {}) {
    const token = localStorage.getItem("modeljudge_token") || "";
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API}${path}`, { ...options, headers });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      const error = new Error(data.error || data.errors?.join("; ") || `Calibration request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function injectCalibrationCenter() {
    if ($("calibrationCenter")) return true;
    const anchor = $("reviewerVerification");
    if (!anchor || !anchor.parentNode) return false;
    const section = document.createElement("section");
    section.id = "calibrationCenter";
    section.className = "panel calibration-center";
    section.innerHTML = `<div class="section-kicker"><div><span class="eyebrow">REVIEWER READINESS</span><h2>Gold Calibration Center</h2><p class="muted">Prove reviewer consistency on hidden reference tasks before production verification.</p></div><span class="badge" id="calibrationStatus">Login required</span></div><div class="calibration-grid"><div class="calibration-stat"><span>Attempts</span><strong id="calibrationAttempts">—</strong></div><div class="calibration-stat"><span>Accuracy</span><strong id="calibrationAccuracyCenter">—</strong></div><div class="calibration-stat"><span>Status</span><strong id="calibrationControlStatus">—</strong></div></div><div id="calibrationTask" class="calibration-task"><div class="empty">Sign in as a reviewer, then start calibration.</div></div><div class="form-actions"><button class="small-button primary-action" id="startCalibration" type="button">Start calibration</button><button class="small-button" id="submitCalibration" type="button" hidden>Submit answer</button></div><div id="calibrationResult" class="verification-note" style="margin-top:12px;display:none"></div>`;
    anchor.parentNode.insertBefore(section, anchor);
    $("startCalibration").addEventListener("click", startCalibration);
    $("submitCalibration").addEventListener("click", submitCalibration);
    loadCalibrationQuality();
    return true;
  }

  function renderTask() {
    const target = $("calibrationTask");
    if (!target || !task) return;
    target.innerHTML = `<div class="response-box"><h4>Calibration prompt</h4><p>${esc(task.prompt)}</p></div><div class="response-box"><h4>Response A</h4><p>${esc(task.response_a)}</p></div><div class="response-box"><h4>Response B</h4><p>${esc(task.response_b)}</p></div><fieldset class="calibration-choice"><legend>Which response is better?</legend><label><input type="radio" name="calibrationPreference" value="A"> Response A</label><label><input type="radio" name="calibrationPreference" value="B"> Response B</label><label><input type="radio" name="calibrationPreference" value="Tie"> Tie</label></fieldset>`;
    $("submitCalibration").hidden = false;
    $("startCalibration").disabled = true;
  }

  async function startCalibration() {
    const button = $("startCalibration");
    button.disabled = true;
    button.textContent = "Loading…";
    try {
      task = await calibrationApi("/gold/task");
      renderTask();
      $("calibrationResult").style.display = "none";
      $("calibrationStatus").textContent = "Task ready";
    } catch (error) {
      $("calibrationStatus").textContent = error.status === 401 ? "Login required" : "Unavailable";
      $("calibrationResult").textContent = error.message || "Unable to load calibration task.";
      $("calibrationResult").style.display = "block";
    } finally {
      button.disabled = Boolean(task);
      button.textContent = "Start calibration";
    }
  }

  async function submitCalibration() {
    const selected = document.querySelector('input[name="calibrationPreference"]:checked');
    if (!selected) {
      $("calibrationResult").textContent = "Choose Response A, Response B, or Tie before submitting.";
      $("calibrationResult").style.display = "block";
      return;
    }
    const button = $("submitCalibration");
    button.disabled = true;
    button.textContent = "Submitting…";
    try {
      const result = await calibrationApi("/gold/submit", { method: "POST", body: JSON.stringify({ gold_evaluation_id: task.gold_evaluation_id, preferred_response: selected.value }) });
      const correct = result.correct === true;
      const resultBox = $("calibrationResult");
      resultBox.textContent = correct ? "Correct calibration answer. Continue with the next calibration task." : "Calibration answer recorded as incorrect. Review the rubric before trying the next task.";
      resultBox.style.display = "block";
      task = null;
      $("calibrationTask").innerHTML = `<div class="empty">Calibration answer recorded. Start the next task when ready.</div>`;
      $("submitCalibration").hidden = true;
      $("startCalibration").disabled = false;
      $("calibrationStatus").textContent = correct ? "Answer recorded" : "Needs improvement";
      await loadCalibrationQuality();
    } catch (error) {
      $("calibrationResult").textContent = error.message || "Unable to submit calibration.";
      $("calibrationResult").style.display = "block";
    } finally {
      button.disabled = false;
      button.textContent = "Submit answer";
    }
  }

  async function loadCalibrationQuality() {
    try {
      const data = await calibrationApi("/gold/me");
      $("calibrationAttempts").textContent = String(data.calibration_attempts ?? 0);
      $("calibrationAccuracyCenter").textContent = data.accuracy == null ? "—" : `${Math.round(Number(data.accuracy) * 100)}%`;
      $("calibrationControlStatus").textContent = data.status || "—";
      $("calibrationStatus").textContent = data.status === "pass" ? "Calibration passed" : data.status === "insufficient" ? "More tasks required" : "Review required";
    } catch (error) {
      $("calibrationAttempts").textContent = "—";
      $("calibrationAccuracyCenter").textContent = "—";
      $("calibrationControlStatus").textContent = error.status === 401 ? "Not authenticated" : "Unavailable";
      $("calibrationStatus").textContent = error.status === 401 ? "Login required" : "Unavailable";
    }
  }

  function addStyles() {
    if ($("calibrationStyles")) return;
    const style = document.createElement("style");
    style.id = "calibrationStyles";
    style.textContent = `.calibration-center{margin:24px 0}.calibration-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}.calibration-stat{border:1px solid var(--border);border-radius:12px;padding:14px}.calibration-stat span{display:block;color:var(--muted);font-size:.8rem}.calibration-stat strong{display:block;margin-top:5px;font-size:1.35rem}.calibration-task{margin-top:8px}.calibration-choice{border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;gap:18px;flex-wrap:wrap}.calibration-choice legend{font-size:.85rem;color:var(--muted);padding:0 5px}.calibration-choice label{cursor:pointer}@media(max-width:560px){.calibration-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  function init() {
    addStyles();
    if (!injectCalibrationCenter()) setTimeout(injectCalibrationCenter, 250);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
