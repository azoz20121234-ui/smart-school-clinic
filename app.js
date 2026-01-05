const appState = {
  vitals:{},
  timeline:[],
  cases:[]
};

// ========== IoT Simulation ==========
let sim;
function startVitals(){
  clearInterval(sim);
  sim = setInterval(()=>{
    appState.vitals = {
      temp:(36.5 + Math.random()*2).toFixed(1),
      hr:Math.floor(70 + Math.random()*40),
      spo2:Math.floor(93 + Math.random()*6)
    };
    temp.textContent = appState.vitals.temp;
    hr.textContent = appState.vitals.hr;
    spo2.textContent = appState.vitals.spo2;
  },800);
}

// ========== AI-like Triage ==========
function triageCase(v,c){
  let level="أخضر", reason=[];
  if(v.spo2<=92){level="أحمر";reason.push("انخفاض الأكسجين")}
  if(v.temp>=39){level="برتقالي";reason.push("حرارة عالية")}
  if(c.includes("دوخة")||c.includes("إغماء")){level="أحمر"}
  return {
    level,
    note:`الفرز الأولي (مساعد): مستوى ${level}`
  };
}

// ========== Timeline ==========
function addEvent(title,level){
  appState.timeline.unshift({
    at:new Date().toLocaleTimeString("ar-SA"),
    title,level
  });
  renderTimeline();
}

function renderTimeline(){
  timeline.innerHTML="";
  appState.timeline.forEach(e=>{
    const li=document.createElement("li");
    li.className=e.level;
    li.textContent=`${e.at} — ${e.title}`;
    timeline.appendChild(li);
  });
}

// ========== Case ==========
function createCase(){
  clearInterval(sim);
  const complaint = document.getElementById("complaint").value;
  const triage = triageCase(appState.vitals,complaint);
  appState.cases.push(triage);

  triageResult.textContent = triage.note;
  addEvent("تم إنشاء الحالة",triage.level);

  if(triage.level==="أحمر"){
    document.body.classList.add("alert-red");
    alert("🚨 حالة حرجة — تفعيل الطوارئ (محاكاة)");
  }

  updateStatus();
}

// ========== Status ==========
function updateStatus(){
  caseCount.textContent = `📋 الحالات اليوم: ${appState.cases.length}`;
  lastUpdate.textContent = `⏱ آخر تحديث: ${new Date().toLocaleTimeString("ar-SA")}`;
}

// ========== PDF ==========
function exportReport(){
  const w = window.open("");
  w.document.write(`<h2>تقرير الحالة</h2>
    <p>${triageResult.textContent}</p>
    <pre>${appState.timeline.map(t=>t.title).join("\n")}</pre>
  `);
  w.print();
}
