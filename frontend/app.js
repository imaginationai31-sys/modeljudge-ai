const dimensions = ["Accuracy", "Relevance", "Clarity", "Safety"];
const scores = { A: {}, B: {} };
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

document.getElementById("reason").addEventListener("input", (event) => {
  document.getElementById("charCount").textContent = `${event.target.value.length} / 500`;
});

document.querySelectorAll(".copy").forEach(button => {
  button.addEventListener("click", async () => {
    const id = button.dataset.copy === "a" ? "responseA" : "responseB";
    await navigator.clipboard.writeText(document.getElementById(id).textContent);
    const old = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => button.textContent = old, 1000);
  });
});

document.getElementById("submitBtn").addEventListener("click", () => {
  const reason = document.getElementById("reason").value.trim();
  const notice = document.getElementById("notice");
  if (!preference) {
    notice.textContent = "Choose Response A, Response B, or Tie before submitting.";
    return;
  }
  if (reason.length < 10) {
    notice.textContent = "Add a short rationale of at least ten characters.";
    return;
  }

  const record = {
    id: document.getElementById("recordId").textContent,
    prompt: document.getElementById("promptText").textContent,
    response_a: document.getElementById("responseA").textContent,
    response_b: document.getElementById("responseB").textContent,
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
    language: "en",
    verified: false
  };

  console.log("ModelJudge evaluation record:", record);
  notice.textContent = "Evaluation captured locally. Backend persistence will be added in the next stage.";
  document.getElementById("totalEvaluations").textContent = "13";
});