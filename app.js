import { state } from "./state.js";
import { startVitals, stopVitals } from "./vitals.js";
import { triageCase } from "./triage.js";
import { addEvent } from "./timeline.js";

window.startVitalsUI = () =>{
  startVitals(v=>{
    temp.textContent=v.temp;
    hr.textContent=v.hr;
    spo2.textContent=v.spo2;
  });
};

window.createCaseUI = () =>{
  stopVitals();
  const complaint = complaintInput.value;

  const triage = triageCase(state.vitals, complaint);
  state.currentCase = { vitals:state.vitals, complaint, triage };
  state.cases.push(state.currentCase);

  addEvent("تم إنشاء الحالة", {level:triage.level});
  triageResult.textContent = triage.note;

  renderTimeline();
};

function renderTimeline(){
  timeline.innerHTML="";
  state.timeline.forEach(e=>{
    const li=document.createElement("li");
    li.textContent=`${e.time} — ${e.title}`;
    li.style.borderRight = e.meta.level==="أحمر" ? "4px solid red" : "";
    timeline.appendChild(li);
  });
}
