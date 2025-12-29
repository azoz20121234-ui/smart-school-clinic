const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const yearEl = $("#year");
yearEl.textContent = new Date().getFullYear();

const tabs = $$(".tab");
const panels = {
  sim: $("#tab-sim"),
  tech: $("#tab-tech"),
  kpi: $("#tab-kpi"),
  contact: $("#tab-contact"),
};

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    Object.values(panels).forEach(p => p.classList.remove("show"));
    panels[btn.dataset.tab].classList.add("show");
  });
});

const steps = $$("#steps li");
function setStep(activeIndex){
  steps.forEach((li,i)=>{
    li.classList.remove("active");
    if(i < activeIndex) li.classList.add("done");
    else li.classList.remove("done");
  });
  if(steps[activeIndex]) steps[activeIndex].classList.add("active");
}

const pillOk = $("#pillOk");
const pillWarn = $("#pillWarn");
const pillDanger = $("#pillDanger");

function setPills(mode){
  [pillOk, pillWarn, pillDanger].forEach(p => p.classList.remove("on"));
  if(mode === "ok") pillOk.classList.add("on");
  if(mode === "warn") pillWarn.classList.add("on");
  if(mode === "danger") pillDanger.classList.add("on");
}

const scenarioChip = $("#scenarioChip");
const sysState = $("#sysState");
const sysHint = $("#sysHint");
const progressBar = $("#progressBar");
const triageLabel = $("#triageLabel");
const triageReason = $("#triageReason");
const recommendation = $("#recommendation");

const hr = $("#hr");
const temp = $("#temp");
const bp = $("#bp");
const spo2 = $("#spo2");

const hrSpark = $("#hrSpark");
const tempSpark = $("#tempSpark");
const bpSpark = $("#bpSpark");
const spo2Spark = $("#spo2Spark");

const logEl = $("#log");

function log(msg){
  const time = new Date().toLocaleTimeString("ar-SA", {hour:"2-digit", minute:"2-digit"});
  const line = document.createElement("div");
  line.innerHTML = `<b>${time}</b> — ${msg}`;
  logEl.prepend(line);
}

function setProgress(p){
  progressBar.style.width = `${p}%`;
}

function rnd(min, max){
  return Math.round((min + Math.random()*(max-min))*10)/10;
}

function setVitalValues(v){
  hr.textContent = v.hr ?? "--";
  temp.textContent = v.temp ?? "--";
  bp.textContent = v.bp ?? "--";
  spo2.textContent = v.spo2 ?? "--";

  hrSpark.style.width = `${Math.min(95, Math.max(25, (v.hr-50))) }%`;
  tempSpark.style.width = `${Math.min(95, Math.max(25, (v.temp-35)*40)) }%`;
  bpSpark.style.width = `${Math.min(95, Math.max(25, (parseInt(v.bp?.split("/")[0]||"0",10)-90))) }%`;
  spo2Spark.style.width = `${Math.min(95, Math.max(25, (v.spo2-80)*5)) }%`;
}

const scenarios = {
  ok: {
    name: "حالة سليمة",
    triage: "سليمة ✅",
    reason: "المؤشرات ضمن النطاق الطبيعي ولا توجد علامات خطر.",
    rec: "إكمال اليوم الدراسي + نصائح وقائية",
    gen: () => ({
      hr: Math.round(rnd(70, 95)),
      temp: rnd(36.4, 37.1),
      bp: `${Math.round(rnd(98,112))}/${Math.round(rnd(60,74))}`,
      spo2: Math.round(rnd(96, 99))
    })
  },
  warn: {
    name: "ملاحظة",
    triage: "ملاحظة 🟡",
    reason: "ارتفاع بسيط/عرض خفيف يحتاج متابعة خلال 30–60 دقيقة.",
    rec: "إعادة القياس + إشعار المرشد الصحي/ولي الأمر عند اللزوم",
    gen: () => ({
      hr: Math.round(rnd(95, 115)),
      temp: rnd(37.2, 38.0),
      bp: `${Math.round(rnd(110,124))}/${Math.round(rnd(70,82))}`,
      spo2: Math.round(rnd(94, 96))
    })
  },
  danger: {
    name: "خطر",
    triage: "خطر 🔴",
    reason: "علامات خطر محتملة (حرارة مرتفعة/تشبع منخفض/نبض عالي).",
    rec: "إحالة فورية للعيادة/الطوارئ + إشعار ولي الأمر",
    gen: () => ({
      hr: Math.round(rnd(120, 145)),
      temp: rnd(38.2, 40.0),
      bp: `${Math.round(rnd(130,150))}/${Math.round(rnd(85,98))}`,
      spo2: Math.round(rnd(88, 93))
    })
  }
};

let running = false;
let intervalId = null;
let mode = "ok";

function setMode(m){
  mode = m;
  setPills(m);
  scenarioChip.textContent = scenarios[m].name;
  scenarioChip.style.borderColor = m==="ok" ? "rgba(34,197,94,.45)" :
                                 m==="warn"? "rgba(245,158,11,.45)" :
                                             "rgba(239,68,68,.45)";
  log(`تم اختيار سيناريو: <b>${scenarios[m].name}</b>`);
}

function stopSim(){
  running = false;
  if(intervalId) clearInterval(intervalId);
  intervalId = null;
  sysState.textContent = "وضع الاستعداد";
  sysHint.textContent = "اضغط “بدء الفحص” لتشغيل المحاكاة.";
  setProgress(0);
  setStep(0);
  triageLabel.textContent = "—";
  triageReason.textContent = "بانتظار البيانات…";
  recommendation.textContent = "—";
  setVitalValues({hr:"--", temp:"--", bp:"--", spo2:"--"});
  setPills("ok"); // default visual
  log("تمت إعادة ضبط المحاكاة.");
}

async function runSim(){
  if(running) return;
  running = true;
  log("بدء الفحص…");

  // Step 1
  setStep(0);
  sysState.textContent = "الدخول والتحقق";
  sysHint.textContent = "التحقق من الهوية وفتح سجل الطالب…";
  setProgress(15);
  await sleep(650);
  log("تم التحقق من الهوية (محاكاة).");

  // Step 2
  setStep(1);
  sysState.textContent = "الفحص الذاتي";
  sysHint.textContent = "جمع المؤشرات الحيوية من أجهزة القياس…";
  setProgress(45);
  await sleep(650);
  log("يتم التقاط المؤشرات (نبض/حرارة/ضغط/SpO2)…");

  // Live stream vitals
  if(intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    const v = scenarios[mode].gen();
    setVitalValues(v);
  }, 800);

  await sleep(1600);

  // Step 3
  setStep(2);
  sysState.textContent = "تحليل الذكاء الاصطناعي";
  sysHint.textContent = "تحليل البيانات + مقارنة بالسجل الصحي…";
  setProgress(75);
  log("بدء التحليل (AI)…");
  await sleep(1100);

  // Result
  triageLabel.textContent = scenarios[mode].triage;
  triageReason.textContent = scenarios[mode].reason;
  recommendation.textContent = scenarios[mode].rec;

  // Step 4
  setStep(3);
  sysState.textContent = "القرار والإحالة";
  sysHint.textContent = "إصدار توصية + تسجيل الحدث + إشعار الجهات…";
  setProgress(100);
  log(`النتيجة: <b>${scenarios[mode].triage}</b> — ${scenarios[mode].reason}`);
  log(`التوصية: <b>${scenarios[mode].rec}</b>`);

  // keep vitals running (realistic live)
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

$("#btnStart").addEventListener("click", () => runSim());
$("#btnReset").addEventListener("click", () => stopSim());

$$(".controls [data-sim]").forEach(btn => {
  btn.addEventListener("click", () => {
    setMode(btn.dataset.sim);
    // if already running, update result text quickly
    if(running){
      triageLabel.textContent = scenarios[mode].triage;
      triageReason.textContent = scenarios[mode].reason;
      recommendation.textContent = scenarios[mode].rec;
    }
  });
});

$("#btnExport").addEventListener("click", async () => {
  const report =
`تقرير محاكاة — العيادة المدرسية الذكية
-----------------------------------
السيناريو: ${scenarios[mode].name}
الحالة: ${triageLabel.textContent}
السبب: ${triageReason.textContent}
التوصية: ${recommendation.textContent}

القياسات الحالية:
- نبض: ${hr.textContent} bpm
- حرارة: ${temp.textContent} °C
- ضغط: ${bp.textContent} mmHg
- SpO2: ${spo2.textContent} %

ملاحظة: هذا تقرير عرض (Demo) قابل للتحويل إلى MVP متصل بواجهة API.`;

  try{
    await navigator.clipboard.writeText(report);
    log("✅ تم نسخ التقرير إلى الحافظة.");
  }catch{
    log("⚠️ لم أستطع النسخ تلقائيًا (قيود المتصفح). انسخ يدويًا من الكونسول.");
    console.log(report);
  }
});

// init
log("جاهز. اختر سيناريو ثم ابدأ الفحص.");
setMode("ok");
setPills("ok");
