function hasAny(text, words){
  const t = (text||"").toLowerCase();
  return words.some(w=>t.includes(w));
}

export function triageCase(vitals, complaint){
  const t = Number(vitals.temp);
  const hr = Number(vitals.hr);
  const spo2 = Number(vitals.spo2);
  const pain = Number(vitals.pain || 0);

  // score 0..100
  let score = 0;
  // vitals weighting
  if(spo2 < 94) score += (94 - spo2) * 8;      // big risk
  if(t >= 38)   score += (t - 37.2) * 12;
  if(hr >= 110) score += (hr - 100) * 0.7;
  score += pain * 2.2;

  // symptom keywords
  if(hasAny(complaint, ["إغماء","اختناق","ضيق","ألم صدر","نزيف"])) score += 35;
  if(hasAny(complaint, ["قيء","دوخة","صداع"])) score += 12;
  if(hasAny(complaint, ["كحة","حلق","حرارة"])) score += 8;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level = "أخضر";
  if(score >= 75) level = "أحمر";
  else if(score >= 55) level = "برتقالي";
  else if(score >= 35) level = "أصفر";

  const actions = {
    "أحمر":   ["تفعيل إنذار فوري", "اتصال عاجل بالطبيب", "إشعار ولي الأمر فورًا"],
    "برتقالي":["طلب استشارة خلال 10 دقائق", "مراقبة القياسات", "تحضير نموذج التوثيق"],
    "أصفر":  ["متابعة داخل المدرسة", "إرشادات عامة", "إشعار ولي الأمر اختياري"],
    "أخضر":  ["طمأنة + سوائل/راحة", "عودة للفصل مع متابعة", "إرشادات وقائية"]
  }[level];

  const reasons = [];
  if(spo2 < 94) reasons.push("انخفاض تشبع الأكسجين");
  if(t >= 38.5) reasons.push("حرارة مرتفعة");
  if(hr >= 120) reasons.push("نبض مرتفع");
  if(pain >= 7) reasons.push("ألم شديد");
  if(hasAny(complaint, ["إغماء","اختناق","ضيق"])) reasons.push("أعراض عالية الخطورة مذكورة");

  const aiNote = `AI-assisted triage: مستوى ${level} (Score: ${score}/100).`;

  return { level, score, reasons, actions, aiNote };
}
