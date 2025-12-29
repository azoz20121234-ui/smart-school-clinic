// Smart School Clinic - MVP Simulation (Front-end only)
// ملاحظة: محاكاة توضيحية وليست قراءة طبية حقيقية.

const el = (id) => document.getElementById(id);

const startBtn = el("startBtn");
const resetBtn = el("resetBtn");
const simulateNormal = el("simulateNormal");
const simulateAlert = el("simulateAlert");

const systemDot = el("systemDot");
const systemText = el("systemText");
const sessionId = el("sessionId");
const clockEl = el("clock");

const faceState = el("faceState");
const confidence = el("confidence");

const hrEl = el("hr");
const tempEl = el("temp");
const bpEl = el("bp");
const spo2El = el("spo2");

const hrBar = el("hrBar");
const tempBar = el("tempBar");
const bpBar = el("bpBar");
const spo2Bar = el("spo2Bar");

const riskChip = el("riskChip");
const resultTitle = el("resultTitle");
const resultMsg = el("resultMsg");

const logArea = el("logArea");
const logHint = el("logHint");

const s1 = el("s1");
const s2 = el("s2");
const s3 = el("s3");
const s4 = el("s4");

const downloadBtn = el("downloadBtn");
const shareBtn = el("shareBtn");

let timer = null;
let phaseTimer = null;
let running = false;

let state = {
  session: null,
  mode: "idle", // idle | running | done
  scenario: "normal", // normal | alert
  t: 0,
  vitals: { hr: 78, temp: 36.8, sys: 118, dia: 76, spo2: 98 },
};

function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function log(msg) {
  const line = document.createElement("div");
  line.className = "logLine";
  line.innerHTML = `<span class="logTime">[${nowTime()}]</span> ${msg}`;
  logArea.prepend(line);
  logHint.textContent = `آخر تحديث ${nowTime()}`;
}

function setPill(kind, text) {
  systemText.textContent = text;

  if (kind === "idle") {
    systemDot.style.background = "#556";
  } else if (kind === "run") {
    systemDot.style.background = "#2dd4ff";
  } else if (kind === "ok") {
    systemDot.style.background = "#23c55e";
  } else if (kind === "warn") {
    systemDot.style.background = "#ffb020";
  } else if (kind === "danger") {
    systemDot.style.background = "#ff4d4d";
  }
}

function setSteps(activeIndex, doneUpTo = -1) {
  const steps = [s1, s2, s3, s4];
  steps.forEach((x, i) => {
    x.classList.remove("active", "done");
    if (i < doneUpTo) x.classList.add("done");
    if (i === activeIndex) x.classList.add("active");
    if (i < activeIndex) x.classList.add("done");
  });
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function setVitalsUI(v) {
  hrEl.textContent = Math.round(v.hr);
  tempEl.textContent = v.temp.toFixed(1);
  bpEl.textContent = `${Math.round(v.sys)}/${Math.round(v.dia)}`;
  spo2El.textContent = Math.round(v.spo2);

  // Bars (rough scaling)
  hrBar.style.width = `${clamp((v.hr - 50) / 80 * 100, 0, 100)}%`;
  tempBar.style.width = `${clamp((v.temp - 35) / 4 * 100, 0, 100)}%`;
  bpBar.style.width = `${clamp((v.sys - 90) / 70 * 100, 0, 100)}%`;
  spo2Bar.style.width = `${clamp((v.spo2 - 85) / 15 * 100, 0, 100)}%`;
}

function riskFromVitals(v) {
  // قواعد مبسطة للعرض فقط
  let score = 0;
  let reasons = [];

  if (v.temp >= 38.0) { score += 2; reasons.push("حرارة مرتفعة"); }
  if (v.hr >= 110) { score += 1; reasons.push("نبض مرتفع"); }
  if (v.spo2 <= 94) { score += 2; reasons.push("انخفاض الأكسجين"); }
  if (v.sys >= 140 || v.dia >= 90) { score += 1; reasons.push("ضغط مرتفع"); }

  let label = "منخفض";
  let color = "ok";
  if (score >= 3) { label = "مرتفع"; color = "danger"; }
  else if (score === 2) { label = "متوسط"; color = "warn"; }

  return { score, label, color, reasons };
}

function setRiskChip(r) {
  riskChip.textContent = `مستوى الخطر: ${r.label}`;
  if (r.color === "ok") {
    riskChip.style.borderColor = "rgba(35,197,94,.35)";
    riskChip.style.background = "rgba(35,197,94,.10)";
    riskChip.style.color = "rgba(234,240,255,.95)";
  } else if (r.color === "warn") {
    riskChip.style.borderColor = "rgba(255,176,32,.35)";
    riskChip.style.background = "rgba(255,176,32,.10)";
    riskChip.style.color = "rgba(234,240,255,.95)";
  } else {
    riskChip.style.borderColor = "rgba(255,77,77,.35)";
    riskChip.style.background = "rgba(255,77,77,.10)";
    riskChip.style.color = "rgba(234,240,255,.95)";
  }
}

function setResult(title, msg, type) {
  resultTitle.textContent = title;
  resultMsg.textContent = msg;

  const box = el("resultBox");
  if (type === "ok") {
    box.style.borderColor = "rgba(35,197,94,.35)";
    box.style.background = "linear-gradient(180deg, rgba(35,197,94,.12), rgba(255,255,255,.03))";
  } else if (type === "warn") {
    box.style.borderColor = "rgba(255,176,32,.35)";
    box.style.background = "linear-gradient(180deg, rgba(255,176,32,.12), rgba(255,255,255,.03))";
  } else if (type === "danger") {
    box.style.borderColor = "rgba(255,77,77,.35)";
    box.style.background = "linear-gradient(180deg, rgba(255,77,77,.12), rgba(255,255,255,.03))";
  } else {
    box.style.borderColor = "rgba(255,255,255,.10)";
    box.style.background = "linear-gradient(180deg, rgba(0,0,0,.18), rgba(255,255,255,.03))";
  }
}

function newSession() {
  const seed = Math.random().toString(16).slice(2, 8).toUpperCase();
  state.session = `SSC-${seed}`;
  sessionId.textContent = state.session;
}

function resetAll() {
  running = false;
  clearInterval(timer);
  clearTimeout(phaseTimer);

  state.mode = "idle";
  state.t = 0;
  state.scenario = "normal";
  state.vitals = { hr: 78, temp: 36.8, sys: 118, dia: 76, spo2: 98 };

  faceState.textContent = "بانتظار البدء…";
  confidence.textContent = "—%";

  setPill("idle", "وضع الاستعداد");
  setSteps(0, 0);
  setVitalsUI(state.vitals);

  riskChip.textContent = "—";
  setResult("جاهز", "اضغط “بدء الفحص الآن” لتشغيل المحاكاة.", "idle");
  log("تمت إعادة تعيين المحاكاة.");
}

function runPhases() {
  // مراحل تجربة واقعية
  setSteps(0);
  setPill("run", "جاري بدء الجلسة");
  faceState.textContent = "إنشاء جلسة فحص…";
  confidence.textContent = `${Math.round(rand(86, 94))}%`;
  log("بدء جلسة فحص جديدة.");
  log("التحقق من الهوية (محاكاة) …");

  phaseTimer = setTimeout(() => {
    setSteps(1);
    faceState.textContent = "تحقق مبدئي: تم";
    log("تم التحقق المبدئي. الانتقال للفحص الذاتي.");
    setPill("run", "قراءة المؤشرات الحيوية");

    phaseTimer = setTimeout(() => {
      setSteps(2);
      faceState.textContent = "جمع البيانات + تنظيفها…";
      log("جمع البيانات الحيوية + فلترة الضجيج (محاكاة).");
      setPill("run", "تحليل الذكاء الاصطناعي");

      phaseTimer = setTimeout(() => {
        setSteps(3);
        faceState.textContent = "قرار النظام…";
        log("تشغيل نموذج تحليل (محاكاة) …");

        const r = riskFromVitals(state.vitals);
        setRiskChip(r);

        if (r.color === "ok") {
          setPill("ok", "اكتملت الجلسة: حالة سليمة");
          setResult("✅ فحص حالة سليمة",
            "النتيجة: ضمن النطاق الطبيعي. (محاكاة) لا توجد مؤشرات تستدعي الإحالة.",
            "ok"
          );
          log("القرار: حالة سليمة — لا إحالة.");
        } else if (r.color === "warn") {
          setPill("warn", "اكتملت الجلسة: تحتاج متابعة");
          setResult("⚠️ تحتاج متابعة",
            `النتيجة: مؤشرات متوسطة. أسباب: ${r.reasons.join("، ")}. (محاكاة) يوصى بإعادة القياس أو متابعة العيادة المدرسية.`,
            "warn"
          );
          log("القرار: متابعة — إعادة قياس/متابعة.");
        } else {
          setPill("danger", "اكتملت الجلسة: إنذار");
          setResult("🚨 إنذار / إحالة",
            `النتيجة: مؤشرات مرتفعة. أسباب: ${r.reasons.join("، ")}. (محاكاة) يوصى بإحالة فورية للممارس/الجهة المختصة.`,
            "danger"
          );
          log("القرار: إنذار — إحالة.");
        }

        state.mode = "done";
        running = false;

      }, 1800);

    }, 1800);

  }, 1800);
}

function tickVitals() {
  // تحريك القيم تدريجيًا (واقعي أكثر من القفزات)
  const v = state.vitals;

  if (state.scenario === "normal") {
    v.hr += rand(-1.2, 1.2);
    v.temp += rand(-0.05, 0.05);
    v.sys += rand(-1.4, 1.4);
    v.dia += rand(-1.1, 1.1);
    v.spo2 += rand(-0.3, 0.3);

    v.hr = clamp(v.hr, 62, 98);
    v.temp = clamp(v.temp, 36.3, 37.4);
    v.sys = clamp(v.sys, 105, 128);
    v.dia = clamp(v.dia, 68, 82);
    v.spo2 = clamp(v.spo2, 96, 100);
  } else {
    // سيناريو “خطر/حرارة”
    v.hr += rand(0.2, 1.8);
    v.temp += rand(0.02, 0.10);
    v.sys += rand(0.3, 2.2);
    v.dia += rand(0.2, 1.6);
    v.spo2 += rand(-0.7, 0.1);

    v.hr = clamp(v.hr, 85, 132);
    v.temp = clamp(v.temp, 37.4, 39.4);
    v.sys = clamp(v.sys, 120, 155);
    v.dia = clamp(v.dia, 78, 98);
    v.spo2 = clamp(v.spo2, 90, 98);
  }

  setVitalsUI(v);

  // أثناء التشغيل أعطِ لمحة تحليل مباشر
  if (running) {
    const r = riskFromVitals(v);
    setRiskChip(r);
  }
}

function startSimulation(scenario) {
  if (running) return;

  state.scenario = scenario || "normal";
  running = true;
  state.mode = "running";
  state.t = 0;

  newSession();
  setPill("run", "جاري بدء الفحص");
  setResult("جاري التشغيل…", "ابدأ بملاحظة تغيّر المؤشرات + مراحل النظام.", "idle");
  log(`تشغيل السيناريو: ${state.scenario === "normal" ? "حالة سليمة" : "خطر/حرارة"}`);

  // “مشهد الكاميرا”
  faceState.textContent = "التقاط صورة/فيديو (محاكاة)…";
  confidence.textContent = `${Math.round(rand(88, 97))}%`;

  // ابدأ تحديث المؤشرات
  clearInterval(timer);
  timer = setInterval(() => {
    state.t += 1;
    tickVitals();

    // رسائل لطيفة تعطي واقعية
    if (state.t === 2) log("تم تهيئة المستشعرات (محاكاة).");
    if (state.t === 5) log("قراءة حرارة/نبض/أكسجين…");
    if (state.t === 8) log("بناء خصائص Feature Engineering (محاكاة).");
  }, 900);

  // تشغيل المراحل (سيناريو)
  runPhases();

  // إيقاف تحديث المؤشرات بعد مدة (حتى ما يظل شغال للأبد)
  setTimeout(() => {
    clearInterval(timer);
  }, 12000);
}

// أزرار
startBtn?.addEventListener("click", () => startSimulation("normal"));
simulateNormal?.addEventListener("click", () => startSimulation("normal"));
simulateAlert?.addEventListener("click", () => startSimulation("alert"));
resetBtn?.addEventListener("click", resetAll);

downloadBtn?.addEventListener("click", () => {
  log("ميزة PDF: ستكون جاهزة عند ربطها بمولّد تقارير (لاحقًا).");
  alert("مؤقتًا: زر التقرير للعرض فقط. إذا تبغى، أضيف لك توليد تقرير HTML قابل للطباعة فورًا.");
});

shareBtn?.addEventListener("click", async () => {
  const v = state.vitals;
  const r = riskFromVitals(v);
  const txt =
`[Smart School Clinic Demo]
Session: ${state.session || "-"}
HR: ${Math.round(v.hr)} bpm | Temp: ${v.temp.toFixed(1)}°C | BP: ${Math.round(v.sys)}/${Math.round(v.dia)} | SpO2: ${Math.round(v.spo2)}%
Risk: ${r.label} (${r.reasons.join("، ") || "لا أسباب"})`;

  try{
    await navigator.clipboard.writeText(txt);
    log("تم نسخ ملخص الجلسة للحافظة.");
    alert("تم نسخ الملخص ✅");
  }catch{
    log("تعذر النسخ (صلاحيات المتصفح).");
    alert("ما قدرنا ننسخ—جرّب من متصفح كروم أو فعّل صلاحيات الحافظة.");
  }
});

// الساعة
setInterval(() => {
  clockEl.textContent = nowTime();
}, 1000);

// تشغيل أولي
resetAll();
log("النظام جاهز. اختر بدء الفحص أو محاكاة خطر.");
