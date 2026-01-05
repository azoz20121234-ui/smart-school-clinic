import { state } from "./state.js";
import { startVitals, stopVitals } from "./vitals.js";
import { triageCase } from "./triage.js";
import { addEvent } from "./timeline.js";

window.startVitalsUI=()=>{
  startVitals(v=>{
    temp.textContent=v.temp;
    hr.textContent=v.hr;
    spo2.textContent=v.spo2;
  });
};

window.createCaseUI=()=>{
  stopVitals();
  const complaint=complaintInput.value;
  const triage=triageCase(state.vitals,complaint);
  state.currentCase={vitals:state.vitals,complaint,triage};
  addEvent("تم إنشاء الحالة");
  triageResult.textContent=triage.note;
};
