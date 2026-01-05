// =======================
// AI-like Triage (Rule-based) — MVP Friendly
// =======================
function triageCase(vitals = {}, complaint = "") {
  const t = Number(vitals.temp ?? 36.8);
  const hr = Number(vitals.hr ?? 80);
  const spo2 = Number(vitals.spo2 ?? 98);
  const pain = Number(vitals.pain ?? 0);

  const text = (complaint || "").toLowerCase();

  let level = "أخضر";
  let reason = [];
  let actions = [];

  if (spo2 <= 92) { level = "أحمر"; reason.push("انخفاض تشبع الأكسجين"); }
  if (t >= 39.0) { level = level === "أحمر" ? "أحمر" : "برتقالي"; reason.push("حرارة عالية"); }
  if (hr >= 130) { level = "أحمر"; reason.push("نبض مرتفع جدًا"); }
  if (text.includes("ضيق") || text.includes("اختناق") || text.includes("إغماء")) {
    level = "أحمر"; reason.push("أعراض خطرة مذكورة في الشكوى");
  }

  if (level !== "أحمر") {
    if (t >= 38.0) { level = "برتقالي"; reason.push("حرارة مرتفعة"); }
    if (pain >= 7) { level = "برتقالي"; reason.push("ألم شديد"); }
    if (text.includes("قيء") || text.includes("دوخة") || text.includes("صداع")) {
      level = level === "برتقالي" ? "برتقالي" : "أصفر";
      reason.push("أعراض متوسطة");
    }
  }

  if (level === "أحمر") {
    actions = ["تفعيل إنذار فوري", "اتصال عاجل بالطبيب", "إشعار ولي الأمر فورًا"];
  } else if (level === "برتقالي") {
    actions = ["طلب استشارة خلال 10 دقائق", "مراقبة القياسات", "إشعار ولي الأمر عند بدء الجلسة"];
  } else if (level === "أصفر") {
    actions = ["متابعة داخل المدرسة", "توصية عامة + مراقبة", "إشعار ولي الأمر اختياري"];
  } else {
    actions = ["إرشادات بسيطة", "راحة/سوائل", "عودة للفصل مع متابعة"];
  }

  const aiNote = `الفرز الأولي (مساعد): مستوى ${level}. ${reason.length ? "الأسباب: " + reason.join("، ") : ""}`;

  return { level, reason, actions, aiNote };
}

// =======================
// Event Timeline (Audit-like)
// =======================
function addTimelineEvent(state, title, meta = {}) {
  const now = new Date();
  const item = {
    id: "EVT-" + Math.random().toString(16).slice(2),
    at: now.toISOString(),
    title,
    meta
  };
  state.timeline = state.timeline || [];
  state.timeline.unshift(item);
  return item;
}
function updateLiveStatus(state){
  document.getElementById("caseCount").textContent =
    `📋 الحالات اليوم: ${state.cases?.length || 1}`;
  document.getElementById("lastUpdate").textContent =
    `⏱ آخر تحديث: ${new Date().toLocaleTimeString("ar-SA")}`;
}
