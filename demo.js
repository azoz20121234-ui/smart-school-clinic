import { loadDB, addCase, addEvent } from "./storage.js";
import { generateCaseInput } from "./generator.js";
import { triageCase } from "./triage.js";

let timer = null;

export function startDemo(intervalMs=7000){
  stopDemo();
  timer = setInterval(()=> runOnce(), intervalMs);
  runOnce();
}

export function stopDemo(){
  if(timer){ clearInterval(timer); timer=null; }
}

export function runOnce(){
  const db = loadDB();
  const { vitals, complaint } = generateCaseInput();
  const triage = triageCase(vitals, complaint);

  const id = "CASE-" + Date.now().toString(36) + "-" + Math.random().toString(16).slice(2);
  const createdAt = new Date().toISOString();

  addCase(db, {
    id,
    createdAt,
    updatedAt: createdAt,
    status: "NEW", // NEW -> IN_REVIEW -> DONE
    student: { name: "طالب تجريبي", grade: "ثالث متوسط" },
    complaint,
    vitals,
    triage,
    doctor: null,
    recommendation: null
  });

  addEvent(db, "تم إنشاء حالة جديدة (Demo)", { caseId:id, level: triage.level, score: triage.score });
}
