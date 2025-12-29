// ===== Helpers
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

const setText = (id, value) => { $(id).textContent = value; };

const modal = $("#modal");
const statusChip = $("#statusChip");
const statusDesc = $("#statusDesc");
const noticeDot = $(".notice__dot");
const noticeText = $("#noticeText");

function openModal(title, desc, kind) {
  $("#modalTitle").textContent = title;
  statusDesc.textContent = desc;

  statusChip.className = "status " + (kind === "bad" ? "bad" : "good");
  statusChip.textContent = kind === "bad" ? "خطر" : "سليمة";

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

$$("[data-close='1']").forEach(el => el.addEventListener("click", closeModal));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// ===== Year
const y = new Date().getFullYear();
$("#year").textContent = y;
$("#year2").textContent = y;

// ===== Active nav (highlight section)
const sections = ["#about","#journey","#tech","#simulation","#kpis","#contact"].map(id => $(id));
const navLinks = $$(".nav__link");

const io = new IntersectionObserver((entries) => {
  const visible = entries
    .filter(e => e.isIntersecting)
    .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;

  const id = "#" + visible.target.id;
  navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === id));
}, { threshold: [0.2, 0.35, 0.5] });

sections.forEach(s => s && io.observe(s));

// ===== Simulation modes
const state = {
  mode: "idle", // idle | normal | fever
};

function setNotice(text, color) {
  noticeText.textContent = text;
  noticeDot.style.background = color || "rgba(255,255,255,.4)";
  if (color) noticeDot.style.boxShadow = `0 0 18px ${color}`;
  else noticeDot.style.boxShadow = "none";
}

function setVitals({ hr, temp, bp, spo2 }) {
  setText("#hr", hr);
  setText("#temp", temp);
  setText("#bp", bp);
  setText("#spo2", spo2);
}

function readyMode() {
  state.mode = "idle";
  setVitals({ hr:"— —", temp:"— —", bp:"— —", spo2:"— —" });
  setNotice("وضع الاستعداد… بانتظار بيانات", "rgba(255,255,255,.55)");
}

function normalMode() {
  state.mode = "normal";
  setVitals({ hr:"78", temp:"36.8", bp:"118/76", spo2:"98" });
  setNotice("الحالة سليمة ✅", "rgba(34,197,94,.85)");
  openModal("نتيجة الفحص", "المؤشرات ضمن المعدلات الطبيعية. لا يوجد إنذار حالياً.", "good");
}

function feverMode() {
  state.mode = "fever";
  setVitals({ hr:"112", temp:"39.4", bp:"132/84", spo2:"95" });
  setNotice("تنبيه: اشتباه حرارة مرتفعة ⚠️", "rgba(239,68,68,.85)");
  openModal("تنبيه حالة حرجة", "رُصدت حرارة مرتفعة مع تسارع نبض. يُوصى بالتقييم الفوري وإشعار المسؤول الصحي.", "bad");
}

$("#btnReady").addEventListener("click", readyMode);
$("#btnNormal").addEventListener("click", normalMode);
$("#btnFever").addEventListener("click", feverMode);

// ===== Contact (demo only)
$("#contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  openModal("تم الاستلام", "وصلت رسالتك (تجريبي). إذا تبي ربط إرسال فعلي ببريد/Google Form أعطيك الطريقة.", "good");
  e.target.reset();
});

// init
readyMode();
