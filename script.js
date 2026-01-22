let ALL = [];
let CURRENT = [];
let idx = 0;
let correct = 0;
let chosen = [];

const $ = id => document.getElementById(id);

async function load(){
  const res = await fetch("questions.json");
  ALL = await res.json();

  const years = [...new Set(ALL.map(q=>q.year))];
  $("year").innerHTML = years.map(y=>`<option>${y}</option>`).join("");
  $("meta").textContent = ALL.length + " questions";

  $("start").onclick = startQuiz;
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function startQuiz(){
  const year = Number($("year").value);
  const mode = $("mode").value;
  const doShuffle = $("shuffle").checked;
  const limit = Number($("limit").value)||200;

  let pool = ALL.filter(q=>q.year===year);
  if(doShuffle) shuffle(pool);
  pool = pool.slice(0,limit);

  CURRENT = pool.map(q=>{
    const pairs = q.options.map((o,i)=>({o,ok:i===q.answerIndex}));
    if(doShuffle) shuffle(pairs);
    return {
      question:q.question,
      options:pairs.map(p=>p.o),
      answerIndex:pairs.findIndex(p=>p.ok)
    };
  });

  idx=0; correct=0; chosen=[];
  show(mode);
}

function show(mode){
  if(idx>=CURRENT.length){
    $("app").innerHTML=`<div class="card"><h3>Score ${correct}/${CURRENT.length}</h3></div>`;
    return;
  }
  const q=CURRENT[idx];
  $("app").innerHTML=`
  <div class="card">
    <b>Q${idx+1}.</b> ${q.question}
    <div id="opts"></div>
  </div>`;

  const opts=$("opts");
  q.options.forEach((t,i)=>{
    const b=document.createElement("button");
    b.textContent=String.fromCharCode(65+i)+". "+t;
    b.onclick=()=>choose(i,mode);
    opts.appendChild(b);
  });
}

function choose(i,mode){
  const q=CURRENT[idx];
  if(i===q.answerIndex) correct++;
  idx++; show(mode);
}

load();
