const dimensions = ["Accuracy", "Relevance", "Clarity", "Safety"];
const scores = { A: {}, B: {} };
const API_URL = window.MODELJUDGE_API_URL || "http://localhost:8787/api";
let preference = null;

function renderScoreTable() {
  const root = document.getElementById("scoreTable");
  root.innerHTML = dimensions.map((dimension) => `
    <div class="score-row">
      <div class="score-label">${dimension}</div>
      <select data-side="A" data-dimension="${dimension}" aria-label="${dimension} Response A">
        ${[1,2,3,4,5].map(n => `<option value="${n}" ${n === 5 ? "selected" : ""}>${n}</option>`).join("")}
      </select>
      <select data-side="B" data-dimension="${dimension}" aria-label="${dimension} Response B">
        ${[1,2,3,4,5].map(n => `<option value="${n}" ${n === 5 ? "selected" : ""}>${n}</option>`).join("")}
      </select>
    </div>`).join("");

  root.querySelectorAll("select").forEach(select => {
    scores[select.dataset.side][select.dataset.dimension] = Number(select.value);
    select.addEventListener("change", () => {
      scores[select.dataset.side][select.dataset.dimension] = Number(select.value);
    });
  });
}

renderScoreTable();

document.querySelectorAll(".choice").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".choice").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    preference = button.dataset.preference;
    document.getElementById("cardA").classList.toggle("selected", preference === "A");
    document.getElementById("cardB").classList.toggle("selected", preference === "B");
  });
});

document.getElementById("reason").addEventListener("input", event => {
  document.getElementById("charCount").textContent = `${event.target.value.length} / 500`;
});

document.querySelectorAll(".copy").forEach(button => {
  button.addEventListener("click", async () => {
    const id = button.dataset.copy === "a" ? "responseA" : "responseB";
    try {
      await navigator.clipboard.writeText(document.getElementById(id).textContent);
      const old = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => button.textContent = old, 1000);
    } catch {
      button.textContent = "Copy failed";
      setTimeout(() => button.textContent = "Copy", 1000);
    }
  });
});

function setNotice(message, type = "success") {
  const notice = document.getElementById("notice");
  if (!notice) return;
  notice.textContent = message;
  notice.dataset.type = type;
}

function updateEvaluationCounter(delta = 0) {
  const counter = document.getElementById("totalEvaluations");
  if (!counter) return;
  counter.textContent = String(Number(counter.textContent || 0) + delta);
}

async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/evaluations?limit=1`);
    if (!response.ok) return;
    const data = await response.json();
    const counter = document.getElementById("totalEvaluations");
    if (counter) counter.textContent = String(data.count ?? 0);
  } catch {
    // The static frontend remains usable when the API is offline.
  }
}

async function submitEvaluation() {
  const reason = document.getElementById("reason").value.trim();
  if (!preference) {
    setNotice("Choose Response A, Response B, or Tie before submitting.", "error");
    return;
  }
  if (reason.length < 10) {
    setNotice("Add a short rationale of at least ten characters.", "error");
    return;
  }

  const button = document.getElementById("submitBtn");
  const record = {
    id: document.getElementById("recordId").textContent,
    prompt: document.getElementById("promptText").textContent.trim(),
    response_a: document.getElementById("responseA").textContent.trim(),
    response_b: document.getElementById("responseB").textContent.trim(),
    preferred_response: preference,
    accuracy_a: scores.A.Accuracy,
    accuracy_b: scores.B.Accuracy,
    relevance_a: scores.A.Relevance,
    relevance_b: scores.B.Relevance,
    clarity_a: scores.A.Clarity,
    clarity_b: scores.B.Clarity,
    safety_a: scores.A.Safety,
    safety_b: scores.B.Safety,
    preference_strength: document.getElementById("strength").value,
    reason,
    category: document.getElementById("categoryTag").textContent,
    language: "en"
  };

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const response = await fetch(`${API_URL}/evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
    const data = await response.json();

    if (!response.ok) {
      const message = data.errors?.join("; ") || data.error || "Unable to save evaluation";
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    setNotice("Evaluation saved to the ModelJudge dataset.", "success");
    updateEvaluationCounter(1);
    document.getElementById("reason").value = "";
    document.getElementById("charCount").textContent = "0 / 500";
    document.querySelectorAll(".choice").forEach(b => b.classList.remove("active"));
    document.getElementById("cardA").classList.remove("selected");
    document.getElementById("cardB").classList.remove("selected");
    preference = null;
  } catch (error) {
    if (error.status === 409) {
      setNotice(`This evaluation is already in the dataset: ${error.message}.`, "warning");
    } else if (error instanceof TypeError) {
      setNotice(`Unable to reach the production API: ${error.message}.`, "error");
    } else {
      setNotice(`Could not save evaluation: ${error.message}.`, "error");
    }
  } finally {
    button.disabled = false;
    button.textContent = "Submit evaluation";
  }
}

document.getElementById("submitBtn").addEventListener("click", submitEvaluation);
loadStats();
