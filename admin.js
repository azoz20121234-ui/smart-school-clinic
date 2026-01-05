import { requireRole } from "../auth.js";
import { loadDB, resetDB } from "../storage.js";
import { toast, pillClass, fmtTime } from "../ui.js";
import { startDemo, stopDemo, runOnce } from "../demo.js";

requireRole(["admin"]);
const $ = (id)=>document.getElementById(id);

function render(){
  const db = loadDB();
  const cases = db.cases;

  $("kCases").textContent = cases.length;
  $("kNew").textContent = cases.filter(c=>c.status==="NEW").length;
  $("kDone").textContent = cases.filter(c=>c.status==="DONE").length;

  const wrap = $("cases");
  wrap.innerHTML = "";
  cases.slice(0,8).forEach(c=>{
    const div = document.createElement("div");
    div.className = "card";
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <div class="row" style="justify-content:space-between; align-items:center">
        <div class="muted">ID: ${c.id}</div>
        <div class="${pillClass(c.triage.level)}">${c.triage.level} • ${c.triage.score}/100</div>
      </div>
      <div class="muted" style="margin-top:8px">
        ${c.complaint}<br/>
        Temp:${c.vitals.temp} HR:${c.vitals.hr} SpO₂:${c.vitals.spo2} Pain:${c.vitals.pain ?? 0}<br/>
        Status: ${c.status} — ${fmtTime(c.updatedAt)}
      </div>
    `;
    wrap.appendChild(div);
  });
}

$("demoStart").onclick = ()=>{ startDemo(7000); toast("Demo شغّال"); };
$("demoStop").onclick  = ()=>{ stopDemo(); toast("Demo متوقف"); };
$("demoOnce").onclick  = ()=>{ runOnce(); toast("تم توليد حالة"); render(); };

$("reset").onclick = ()=>{
  resetDB();
  toast("تمت إعادة ضبط البيانات");
  render();
};

render();
setInterval(render, 1500);
