const $ = (id) => document.getElementById(id);

const students = [
  { name: "سلمان", info: "المرحلة: متوسط — الصف: 2", img: "unnamed-5.png" },
  { name: "محمد", info: "المرحلة: ابتدائي — الصف: 5", img: "unnamed-6.png" },
  { name: "فهد",   info: "المرحلة: ثانوي — الصف: 1",  img: "unnamed-3.png" },
];

let mode = "normal"; // normal | risk
let timer = null;

let vitals = {
  hr: 82,
  temp: 36.7,
  bpS: 118,
  bpD: 76,
  spo2: 98
};

let hrHistory = Array.from({ length: 30 }, () => vitals.hr);

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function rand(min, max){ return Math.random() * (max - min) + min; }

function log(msg){
  const box = $("logBox");
  const t = new Date().toLocaleTimeString("ar-SA");
  box.innerHTML = `<div>[${t}] ${msg}</div>` + box.innerHTML;
}

function setStudent(i){
  const s = students[i];
  $("studentName").textContent = s.name;
  $("studentInfo").textContent = s.info;
  $("studentImg").src = s.img;
  log(`تم اختيار الطالب: ${s.name}`);
}

function setMode(newMode){
  mode = newMode;

  if(mode === "normal"){
    $("studentStatus").textContent = "سليم";
    $("studentStatus").style.borderColor = "rgba(32,201,151,.35)";
    $("studentStatus").style.color = "#dffaf1";
    $("aiState").textContent = "تحليل مستقر";
    log("تفعيل وضع: حالة سليمة");
  } else {
    $("studentStatus").textContent = "خطر";
    $("studentStatus").style.borderColor = "rgba(255,92,92,.35)";
    $("studentStatus").style.color = "#ffe3e3";
    $("aiState").textContent = "تنبيه: حالة حرجة";
    log("تفعيل وضع: محاكاة خطر/حرارة");
  }

  runAI();
}

function updateBars(){
  // HR: 50..160
  const hrPct = ((vitals.hr - 50) / (160 - 50)) * 100;
  $("hrBar").style.width = `${clamp(hrPct,0,100)}%`;

  // Temp: 35..40.5
  const tempPct = ((vitals.temp - 35) / (40.5 - 35)) * 100;
  $("tempBar").style.width = `${clamp(tempPct,0,100)}%`;

  // BP: use systolic 90..170
  const bpPct = ((vitals.bpS - 90) / (170 - 90)) * 100;
  $("bpBar").style.width = `${clamp(bpPct,0,100)}%`;

  // SpO2: 85..100
  const spo2Pct = ((vitals.spo2 - 85) / (100 - 85)) * 100;
  $("spo2Bar").style.width = `${clamp(spo2Pct,0,100)}%`;
}

function renderVitals(){
  $("hr").textContent = Math.round(vitals.hr);
  $("temp").textContent = vitals.temp.toFixed(1);
  $("bp").textContent = `${Math.round(vitals.bpS)}/${Math.round(vitals.bpD)}`;
  $("spo2").textContent = Math.round(vitals.spo2);
  updateBars();
  drawChart();
}

function tick(){
  if(mode === "normal"){
    vitals.hr = clamp(vitals.hr + rand(-2, 2), 65, 105);
    vitals.temp = clamp(vitals.temp + rand(-0.05, 0.05), 36.2, 37.4);
    vitals.bpS = clamp(vitals.bpS + rand(-2, 2), 105, 135);
    vitals.bpD = clamp(vitals.bpD + rand(-2, 2), 65, 88);
    vitals.spo2 = clamp(vitals.spo2 + rand(-0.2, 0.2), 96, 100);
  } else {
    // Risk / fever simulation
    vitals.hr = clamp(vitals.hr + rand(1, 4), 105, 145);
    vitals.temp = clamp(vitals.temp + rand(0.05, 0.12), 38.2, 40.2);
    vitals.bpS = clamp(vitals.bpS + rand(-1, 3), 110, 155);
    vitals.bpD = clamp(vitals.bpD + rand(-1, 2), 70, 100);
    vitals.spo2 = clamp(vitals.spo2 + rand(-0.6, 0.2), 90, 97);
  }

  hrHistory.push(Math.round(vitals.hr));
  if(hrHistory.length > 30) hrHistory.shift();

  renderVitals();

  // refresh AI messages occasionally
  if(Math.random() < 0.25) runAI(true);
}

function riskLevel(){
  let score = 0;
  if(vitals.temp >= 38.0) score += 2;
  if(vitals.temp >= 39.0) score += 2;
  if(vitals.hr >= 120) score += 2;
  if(vitals.spo2 <= 94) score += 2;
  if(vitals.bpS >= 150) score += 1;
  return score; // 0..9
}

function runAI(soft=false){
  const score = riskLevel();
  const list = $("aiList");
  const lines = [];

  lines.push(`الاتصال بالمستشعرات: ✅`);
  lines.push(`تحديث البيانات: ${soft ? "جزئي" : "كامل"} ✅`);
  lines.push(`مطابقة السجل الصحي (محاكاة): ✅`);

  if(score <= 2){
    $("aiState").textContent = "نتيجة: منخفض المخاطر";
    lines.push(`التصنيف: منخفض المخاطر ✅`);
    lines.push(`توصية: متابعة بسيطة + إشعار للمرشد/الولي (حسب السياسة).`);
  } else if(score <= 5){
    $("aiState").textContent = "نتيجة: متوسط المخاطر";
    lines.push(`التصنيف: متوسط المخاطر ⚠`);
    lines.push(`توصية: إعادة قياس بعد 10 دقائق + تقييم ممرضة المدرسة.`);
  } else {
    $("aiState").textContent = "نتيجة: مرتفع المخاطر";
    lines.push(`التصنيف: مرتفع المخاطر ⛔`);
    lines.push(`توصية: تنبيه فوري + تحويل للعيادة/الطوارئ حسب البروتوكول.`);
  }

  list.innerHTML = lines.map(x => `<li>${x}</li>`).join("");
}

function drawChart(){
  const c = $("hrChart");
  const ctx = c.getContext("2d");

  // clear
  ctx.clearRect(0,0,c.width,c.height);

  // grid
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "rgba(255,255,255,.25)";
  for(let i=0;i<6;i++){
    const y = 10 + (i*(c.height-20))/5;
    ctx.beginPath(); ctx.moveTo(10,y); ctx.lineTo(c.width-10,y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // line
  const min = 60, max = 160;
  const padX = 12, padY = 14;
  const w = c.width - padX*2;
  const h = c.height - padY*2;

  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(76,141,255,.9)";
  ctx.beginPath();

  hrHistory.forEach((v, i) => {
    const x = padX + (i * w) / (hrHistory.length-1);
    const t = (v - min) / (max - min);
    const y = padY + (1 - clamp(t,0,1)) * h;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });

  ctx.stroke();

  // last point
  const last = hrHistory[hrHistory.length-1];
  const x = padX + w;
  const t = (last - min) / (max - min);
  const y = padY + (1 - clamp(t,0,1)) * h;

  ctx.fillStyle = "rgba(32,201,151,.95)";
  ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();

  // label
  ctx.fillStyle = "rgba(233,241,255,.9)";
  ctx.font = "bold 13px system-ui";
  ctx.fillText(`HR: ${last}`, x-70, y-10);
}

function start(){
  $("year").textContent = new Date().getFullYear();

  $("studentSelect").addEventListener("change", (e) => setStudent(+e.target.value));
  $("btnNormal").addEventListener("click", () => setMode("normal"));
  $("btnRisk").addEventListener("click", () => setMode("risk"));

  $("btnPrepare").addEventListener("click", () => {
    log("تم تفعيل وضع الاستعداد: تجهيز التحليل والتنبيهات");
    $("aiState").textContent = "وضع الاستعداد ✅";
    runAI();
  });

  $("btnExport").addEventListener("click", () => {
    const score = riskLevel();
    const report =
`تقرير محاكاة — العيادة المدرسية الذكية
-----------------------------------
HR: ${Math.round(vitals.hr)} bpm
Temp: ${vitals.temp.toFixed(1)} C
BP: ${Math.round(vitals.bpS)}/${Math.round(vitals.bpD)} mmHg
SpO2: ${Math.round(vitals.spo2)} %
RiskScore: ${score}

ملاحظة: هذا تقرير محاكاة للعرض.`;
    navigator.clipboard?.writeText(report);
    log("تم (نسخ) تقرير محاكاة للحافظة ✅");
    alert("تم نسخ تقرير المحاكاة (Demo) ✅");
  });

  setStudent(0);
  setMode("normal");
  renderVitals();

  if(timer) clearInterval(timer);
  timer = setInterval(tick, 900);

  log("تم تشغيل المحاكاة LIVE");
}

start();
