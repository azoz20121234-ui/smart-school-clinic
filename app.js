const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();

const menuBtn = document.getElementById("menuBtn");
const mobileNav = document.getElementById("mobileNav");
menuBtn?.addEventListener("click", () => {
  const isHidden = mobileNav.hasAttribute("hidden");
  if (isHidden) mobileNav.removeAttribute("hidden");
  else mobileNav.setAttribute("hidden", "");
});

const statusBox = document.getElementById("statusBox");
const hr = document.getElementById("hr");
const temp = document.getElementById("temp");
const bp = document.getElementById("bp");
const spo2 = document.getElementById("spo2");

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setStatus(type) {
  statusBox.classList.remove("status--good", "status--risk");

  if (type === "safe") {
    statusBox.classList.add("status--good");
    statusBox.querySelector(".status__title").textContent = "حالة سليمة ✅";
    statusBox.querySelector(".status__desc").textContent = "لا توجد مؤشرات خطر حالياً. يُنصح بالمتابعة الروتينية.";
    hr.textContent = rand(70, 92);
    temp.textContent = (rand(362, 370) / 10).toFixed(1);
    bp.textContent = `${rand(105, 120)}/${rand(65, 80)}`;
    spo2.textContent = rand(96, 99);
  } else {
    statusBox.classList.add("status--risk");
    statusBox.querySelector(".status__title").textContent = "تنبيه خطر (حرارة) ⚠️";
    statusBox.querySelector(".status__desc").textContent = "تم رصد حرارة مرتفعة. يُنصح بالعزل المؤقت وإبلاغ المرشد/الأهل وإعادة القياس.";
    hr.textContent = rand(95, 120);
    temp.textContent = (rand(381, 395) / 10).toFixed(1);
    bp.textContent = `${rand(115, 135)}/${rand(70, 88)}`;
    spo2.textContent = rand(92, 96);
  }
}

document.getElementById("btnSafe")?.addEventListener("click", () => setStatus("safe"));
document.getElementById("btnRisk")?.addEventListener("click", () => setStatus("risk"));
