import { requireRole } from "../auth.js";
import { loadDB } from "../storage.js";
import { fmtTime, pillClass, timelineClass, toast } from "../ui.js";

requireRole(["parent","admin"]);
const $ = (id)=>document.getElementById(id);

function render(){
  const db = loadDB();
  const c = db.cases[0];

  if(!c){
    $("parentBox").textContent = "لا توجد حالات.";
  } else {
    $("parentBox").innerHTML = `
      <div class="row" style="justify-content:space-between; align-items:center">
        <div class="muted">ID: ${c.id}</div>
        <div class="${pillClass(c.triage.level)}">الحالة: ${c.triage.level}</div>
      </div>
      <div class="muted" style="margin-top:10px">
        تم تسجيل حالة للطالب بتاريخ: ${fmtTime(c.createdAt)}<br/>
        <b>الشكوى:</b> ${c.complaint}
      </div>
      <hr class="sep"/>
      <div class="muted"><b>توصية الطبيب:</b><br/> ${c.recommendation || "لم تصدر توصية بعد."}</div>
      <div class="muted" style="margin-top:10px"><b>حالة المتابعة:</b> ${c.status}</div>
    `;
  }

  $("events").innerHTML = "";
  db.events.slice(0,10).forEach(e=>{
    const li = document.createElement("li");
    li.className = timelineClass(e.meta?.level);
    li.innerHTML = `<div>${e.title}</div><div class="t">${fmtTime(e.at)}</div>`;
    $("events").appendChild(li);
  });
}

$("print").onclick = ()=>{
  const db = loadDB();
  const c = db.cases[0];
  if(!c) return toast("لا يوجد شيء للطباعة");
  const w = window.open("", "_blank");
  w.document.write(`
    <html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير ولي الأمر</title></head>
    <body style="font-family:system-ui;padding:18px">
      <h2>تقرير متابعة الحالة</h2>
      <p><b>رقم الحالة:</b> ${c.id}</p>
      <p><b>الحالة:</b> ${c.triage.level} (${c.triage.score}/100)</p>
      <p><b>الشكوى:</b> ${c.complaint}</p>
      <p><b>توصية الطبيب:</b> ${c.recommendation || "—"}</p>
      <p><b>وضع الحالة:</b> ${c.status}</p>
      <hr/>
      <p style="color:#666">بيانات تجريبية لأغراض العرض.</p>
    </body></html>
  `);
  w.print();
};

render();
setInterval(render, 1500);
