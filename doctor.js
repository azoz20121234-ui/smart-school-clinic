import { requireRole } from "../auth.js";
import { loadDB, updateCase, addEvent } from "../storage.js";
import { toast, fmtTime, timelineClass, pillClass } from "../ui.js";

requireRole(["doctor","admin"]);
const $ = (id)=>document.getElementById(id);

function render(){
  const db = loadDB();
  const c = db.cases[0];

  if(!c){
    $("caseBox").textContent = "لا توجد حالات.";
  } else {
    $("caseBox").innerHTML = `
      <div class="row" style="justify-content:space-between; align-items:center">
        <div class="muted">ID: ${c.id}</div>
        <div class="${pillClass(c.triage.level)}">🧠 ${c.triage.level} • ${c.triage.score}/100</div>
      </div>
      <div class="muted" style="margin-top:10px">
        <b>الشكوى:</b> ${c.complaint}<br/>
        <b>Temp:</b> ${c.vitals.temp} — <b>HR:</b> ${c.vitals.hr} — <b>SpO₂:</b> ${c.vitals.spo2} — <b>Pain:</b> ${c.vitals.pain ?? 0}
      </div>
      <div class="muted" style="margin-top:10px"><b>أسباب AI:</b> ${(c.triage.reasons||["—"]).join("، ")}</div>
      <div class="muted" style="margin-top:10px"><b>إجراءات مقترحة:</b> ${c.triage.actions.join(" • ")}</div>
      <div class="muted" style="margin-top:10px"><b>الحالة:</b> ${c.status} — <b>آخر تحديث:</b> ${fmtTime(c.updatedAt)}</div>
    `;
    $("rec").value = c.recommendation || "";
  }

  $("events").innerHTML = "";
  db.events.slice(0,12).forEach(e=>{
    const li = document.createElement("li");
    li.className = timelineClass(e.meta?.level);
    li.innerHTML = `<div>${e.title}</div><div class="t">${fmtTime(e.at)}</div>`;
    $("events").appendChild(li);
  });
}

$("accept").onclick = ()=>{
  const db = loadDB();
  const c = db.cases[0];
  if(!c) return toast("ما فيه حالة");
  updateCase(db, c.id, { status:"IN_REVIEW", doctor:{name:"طبيب تجريبي"} });
  addEvent(db, "الطبيب بدأ مراجعة الحالة", { caseId:c.id, level: c.triage.level });
  toast("تم بدء المراجعة");
  render();
};

$("saveRec").onclick = ()=>{
  const db = loadDB();
  const c = db.cases[0];
  if(!c) return toast("ما فيه حالة");
  updateCase(db, c.id, { recommendation: $("rec").value.trim() || "توصية تجريبية" });
  addEvent(db, "تم حفظ توصية الطبيب", { caseId:c.id, level: c.triage.level });
  toast("تم حفظ التوصية");
  render();
};

$("close").onclick = ()=>{
  const db = loadDB();
  const c = db.cases[0];
  if(!c) return toast("ما فيه حالة");
  updateCase(db, c.id, { status:"DONE" });
  addEvent(db, "تم إغلاق الحالة", { caseId:c.id, level: c.triage.level });
  toast("تم الإغلاق");
  render();
};

render();
setInterval(render, 1500);
