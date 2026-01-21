let ALL = [];
let CURRENT = [];
let idx = 0;
let correct = 0;
let chosen = [];

const $ = (id) => document.getElementById(id);

async function load() {
  const res = await fetch("questions.json");
  ALL = await res.json();

  const years = [...new Set(ALL.map(q => q.year))].sort((a,b)=>b-a);
  $("year").innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join("");

  const subjects = [...new Set(ALL.map(q => q.subject || "General"))].sort();
  $("subject").innerHTML = subjects.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join("");

  $("meta").textContent = `${ALL.length} questions`;
  $("start").onclick = () => startQuiz();
}

function shuffle(a){
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function startQuiz(){
  const year = Number($("year").value);
  const subject = $("subject").value;
  const mode = $("mode").value;
  const limit = Math.max(1, Number($("limit").value || 20));

  CURRENT = ALL.filter(q => q.year === year && (q.subject || "General") === subject);
  shuffle(CURRENT);
  CURRENT = CURRENT.slice(0, Math.min(limit, CURRENT.length));

  idx = 0;
  correct = 0;
  chosen = new Array(CURRENT.length).fill(null);

  renderQuestion(mode);
}

function renderQuestion(mode){
  const app = $("app");
  if (idx >= CURRENT.length){
    const scored = CURRENT.every(q => Number.isInteger(q.answerIndex));
    app.innerHTML = `
      <div class="card">
        <h3>Finished</h3>
        <p>${scored ? `Score: <b>${correct} / ${CURRENT.length}</b>` : `<b>Answer key not added yet</b> — scoring disabled.`}</p>
        ${mode === "exam" ? renderReview(scored) : ""}
      </div>
    `;
    return;
  }

  const q = CURRENT[idx];
  const n = idx + 1;

  app.innerHTML = `
    <div class="card">
      <div><b>Q${n}.</b> ${escapeHtml(q.question)}</div>
      <div style="margin-top:10px" id="opts"></div>
      <div class="row" style="margin-top:10px">
        <button id="prev" style="width:auto">Prev</button>
        <button id="next" style="width:auto">Next</button>
        <span class="pill">Progress: ${n}/${CURRENT.length}</span>
      </div>
      <div id="feedback" style="margin-top:10px"></div>
    </div>
  `;

  $("prev").onclick = () => { if (idx>0){ idx--; renderQuestion(mode);} };
  $("next").onclick = () => { idx++; renderQuestion(mode); };

  const opts = $("opts");
  q.options.forEach((text, i) => {
    const b = document.createElement("button");
    b.textContent = `${String.fromCharCode(65+i)}. ${text}`;
    b.onclick = () => choose(mode, i);
    opts.appendChild(b);
  });

  if (chosen[idx] !== null){
    $("feedback").innerHTML = `<span class="pill">Selected: ${String.fromCharCode(65+chosen[idx])}</span>`;
  }
}

function choose(mode, optionIndex){
  const q = CURRENT[idx];
  const hasKey = Number.isInteger(q.answerIndex);

  if (chosen[idx] === null){
    chosen[idx] = optionIndex;
  } else {
    // allow changing in exam mode
    chosen[idx] = optionIndex;
  }

  if (!hasKey){
    $("feedback").innerHTML = `<b>Saved ✅</b> (Answer key not added yet)`;
    return;
  }

  if (mode === "practice"){
    const isRight = optionIndex === q.answerIndex;
    $("feedback").innerHTML = isRight
      ? `<b>Correct ✅</b> (Answer: ${String.fromCharCode(65+q.answerIndex)})`
      : `<b>Wrong ❌</b> (Correct: ${String.fromCharCode(65+q.answerIndex)})`;
    // prevent double scoring
    if (isRight && !q.__counted){
      q.__counted = true;
      correct++;
    }
  } else {
    $("feedback").innerHTML = `<span class="pill">Selected: ${String.fromCharCode(65+optionIndex)}</span>`;
  }
}

function renderReview(scored){
  if (!scored){
    return `<p><b>Answer key not added yet</b> — review will show your selections only.</p>` +
      CURRENT.map((q,i)=>{
        const sel = chosen[i];
        return `<div class="card"><div><b>Q${i+1}.</b> ${escapeHtml(q.question)}</div><div style="margin-top:6px">Your: <b>${sel===null? "-" : String.fromCharCode(65+sel)}</b></div></div>`;
      }).join("");
  }

  correct = 0;
  const rows = CURRENT.map((q, i) => {
    const sel = chosen[i];
    const ok = sel === q.answerIndex;
    if (ok) correct++;
    return `
      <div class="card">
        <div><b>Q${i+1}.</b> ${escapeHtml(q.question)}</div>
        <div style="margin-top:6px">
          Your: <b>${sel === null ? "-" : String.fromCharCode(65+sel)}</b> |
          Correct: <b>${String.fromCharCode(65+q.answerIndex)}</b>
          ${ok ? "✅" : "❌"}
        </div>
      </div>
    `;
  }).join("");
  return `<p>Review:</p>${rows}`;
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}
function escapeAttr(s){
  return String(s ?? "").replaceAll('"', "&quot;");
}

load();
