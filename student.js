import { requireRole } from "../auth.js";
import { loadDB, addCase, addEvent } from "../storage.js";
import { toast } from "../ui.js";
import { generateCaseInput } from "../generator.js";
import { triageCase } from "../triage.js";

requireRole(["student","admin"]);

let iotTimer = null;
let currentVitals = null;

const $ = (id)=>document.getElementById(id);

function setVitals(v){
  currentVitals = v;
  $("vTemp").textContent = v.temp.toFixed ? v.temp.toFixed(1) : v.temp;
  $("vHr").textContent = v.hr;
  $("vSpo2").textContent = v.spo2;
}

function startIoT(){
  stopIoT();
  // simulate smooth vitals
  let temp = 36.8, hr = 78, spo2 = 98;
  iotTimer = setInterval(()=>{
    temp += (Math.random()-0.5)*0.15;
    hr   += (Math.random()-0.5)*2.2;
    spo2 += (Math.random()-0.5)*0.6;
    setVitals({temp:+temp.toFixed(1), hr: Math.round(hr), spo2: Math.round(spo2), pain: 3});
  }, 700);
  toast("بدأ القياس (محاكاة)");
}

function stopIoT(){
  if(iotTimer){ clearInterval(iotTimer); iotTimer=null; }
}

function createCaseFrom(vitals, complaint){
  const db = loadDB();
  const triage = triageCase(vitals, complaint);

  const id = "CASE-" + Date.now().toString(36) + "-" + Math.random().toString(16).slice(2);
  const createdAt = new Date().toISOString();

  const caseObj = {
    id,
    createdAt,
    updatedAt: createdAt,
    status: "NEW",
    student: { name: "طالب تجريبي", grade:"ثالث متوسط" },
    complaint,
    vitals,
    triage,
    doctor: null,
    recommendation: null
  };

  addCase(db, caseObj);
  addEvent(db, "تم إنشاء حالة من الطالب", { caseId:id, level:triage.level, score:triage.score });

  $("resultBox").innerHTML = `
    <div class="${triage.level==='أحمر'?'pill red':triage.level==='برتقالي'?'pill orange':triage.level==='أصفر'?'pill yellow':'pill green'}">
      🧠 ${triage.aiNote}
    </div>
    <p class="muted" style="margin-top:10px">الإجراءات المقترحة:</p>
    <ul class="muted">
      ${triage.actions.map(a=>`<li>${a}</li>`).join("")}
    </ul>
  `;

  // Red alert moment
  if(triage.level==="أحمر"){
    document.body.classList.add("alert-shake");
    setTimeout(()=>document.body.classList.remove("alert-shake"), 650);
    toast("🚨 حالة حرجة — تم إشعار الطبيب/ولي الأمر (محاكاة)");
  } else {
    toast("تم إرسال الحالة ✅");
  }

  renderLatest();
}

function renderLatest(){
  const db = loadDB();
  const c = db.cases[0];
  if(!c){ $("latestBox").textContent="لا يوجد"; return; }
  $("latestBox").innerHTML = `
    <div class="row" style="justify-content:space-between; align-items:center">
      <span class="muted">ID: ${c.id}</span>
      <span class="${c.triage.level==='أحمر'?'pill red':c.triage.level==='برتقالي'?'pill orange':c.triage.level==='أصفر'?'pill yellow':'pill green'}">${c.triage.level}</span>
    </div>
    <div class="muted" style="margin-top:8px">
      شكوى: ${c.complaint}<br/>
      Temp: ${c.vitals.temp} | HR: ${c.vitals.hr} | SpO₂: ${c.vitals.spo2} | Pain: ${c.vitals.pain ?? 0}
    </div>
  `;
}

function printLatest(){
  const db = loadDB();
  const c = db.cases[0];
  if(!c){ toast("ما فيه حالة لطباعة"); return; }
  const w = window.open("", "_blank");
  w.document.write(`
    <html dir="rtl" lang="ar">
    <head><meta charset="utf-8"><title>تقرير حالة</title></head>
    <body style="font-family:system-ui; padding:18px">
      <h2>تقرير الحالة</h2>
      <p><b>رقم الحالة:</b> ${c.id}</p>
      <p><b>الشكوى:</b> ${c.complaint}</p>
      <h3>القياسات</h3>
      <ul>
        <li>Temp: ${c.vitals.temp}</li>
        <li>HR: ${c.vitals.hr}</li>
        <li>SpO₂: ${c.vitals.spo2}</li>
        <li>Pain: ${c.vitals.pain ?? 0}</li>
      </ul>
      <h3>قرار الفرز</h3>
      <p>${c.triage.aiNote}</p>
      <p><b>الأسباب:</b> ${c.triage.reasons?.join("، ") || "—"}</p>
      <h3>الإجراءات</h3>
      <ul>${c.triage.actions.map(a=>`<li>${a}</li>`).join("")}</ul>
      <hr/>
      <p style="color:#666">البيانات لأغراض العرض التجريبي.</p>
    </body></html>
  `);
  w.print();
}

$("startIoT").onclick = startIoT;
$("stopIoT").onclick = ()=>{ stopIoT(); toast("تم إيقاف القياس"); };

$("genCase").onclick = ()=>{
  const { vitals, complaint } = generateCaseInput();
  vitals.pain = vitals.pain ?? 3;
  $("complaint").value = complaint;
  setVitals(vitals);
  toast("تم توليد حالة جاهزة");
};

$("sendCase").onclick = ()=>{
  const complaint = $("complaint").value.trim() || "شكوى تجريبية";
  if(!currentVitals){
    const { vitals } = generateCaseInput();
    vitals.pain = vitals.pain ?? 3;
    setVitals(vitals);
  }
  createCaseFrom(currentVitals, complaint);
};

$("printReport").onclick = printLatest;

renderLatest();
