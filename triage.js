export function triageCase(vitals, complaint=""){
  let level = "أخضر";
  let reasons = [];

  if(vitals.spo2 <= 92){
    level = "أحمر";
    reasons.push("انخفاض تشبع الأكسجين");
  }

  if(vitals.temp >= 39){
    level = level === "أحمر" ? "أحمر" : "برتقالي";
    reasons.push("ارتفاع شديد في الحرارة");
  }

  if(/دوخة|إغماء|ضيق/.test(complaint)){
    level = "أحمر";
    reasons.push("أعراض خطرة مذكورة");
  }

  return {
    level,
    reasons,
    note: `AI-assisted triage: مستوى ${level}`
  };
}
