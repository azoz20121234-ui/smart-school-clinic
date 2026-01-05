const complaints = [
  "صداع مع دوخة",
  "ارتفاع حرارة وآلام جسم",
  "ضيق تنفس بسيط",
  "ألم بطن مع غثيان",
  "التهاب حلق وكحة",
  "دوخة شديدة وإحساس بإغماء",
  "إرهاق عام وخمول",
  "ألم صدر (شكوى تجريبية)"
];

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

export function generateVitals(severity=0.35){
  // severity: 0..1
  let temp = 36.6 + severity*2.8 + (Math.random()-0.5)*0.4;     // ~36.4..39.8
  let hr   = 75   + severity*55  + (Math.random()-0.5)*10;       // ~70..140
  let spo2 = 98   - severity*9   + (Math.random()-0.5)*2;        // ~88..99
  let pain = Math.round(clamp(2 + severity*8 + (Math.random()-0.5)*2, 0, 10));

  temp = clamp(temp, 35.8, 40.2);
  hr   = clamp(hr, 55, 160);
  spo2 = clamp(spo2, 85, 100);

  return {
    temp: Number(temp.toFixed(1)),
    hr: Math.round(hr),
    spo2: Math.round(spo2),
    pain
  };
}

export function generateCaseInput(){
  const severity = Math.random(); // random difficulty for testing AI decision
  const vitals = generateVitals(severity);
  const complaint = pick(complaints);
  return {severity, vitals, complaint};
}
