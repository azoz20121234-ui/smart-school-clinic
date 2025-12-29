// ====== Simple MVP State (LocalStorage) ======
const LS = {
  users: "ssc_users",
  session: "ssc_session",
  cases: "ssc_cases",
  results: "ssc_results"
};

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];

function nowTime(){
  const d = new Date();
  return d.toLocaleString("ar-SA");
}

function seedData(){
  const users = [
    { username:"admin", password:"1234", role:"school", name:"منسق المدرسة" },
    { username:"dr", password:"1234", role:"doctor", name:"د. سراج (تجريبي)" },
    { username:"parent", password:"1234", role:"parent", name:"ولي أمر محمد" }
  ];
  localStorage.setItem(LS.users, JSON.stringify(users));

  const cases = [
    { id: "C-1001", student:"محمد / صف 6", reason:"fever", status:"new", createdAt: nowTime() },
    { id: "C-1002", student:"سارة / صف 4", reason:"injury", status:"new", createdAt: nowTime() }
  ];
  localStorage.setItem(LS.cases, JSON.stringify(cases));
  localStorage.setItem(LS.results, JSON.stringify({}));
  alert("تم تجهيز بيانات تجريبية ✅");
  renderAll();
}

function getUsers(){
  return JSON.parse(localStorage.getItem(LS.users) || "[]");
}
function getCases(){
  return JSON.parse(localStorage.getItem(LS.cases) || "[]");
}
function setCases(cases){
  localStorage.setItem(LS.cases, JSON.stringify(cases));
}
function getResults(){
  return JSON.parse(localStorage.getItem(LS.results) || "{}");
}
function setResults(obj){
  localStorage.setItem(LS.results, JSON.stringify(obj));
}
function getSession(){
  return JSON.parse(localStorage.getItem(LS.session) || "null");
}
function setSession(s){
  localStorage.setItem(LS.session, JSON.stringify(s));
}
function clearSession(){
  localStorage.removeItem(LS.session);
}

// ====== Navigation ======
function showView(key){
  $$(".view").forEach(v => v.classList.add("hidden"));
  $(`#view-${key}`).classList.remove("hidden");
  window.scrollTo({ top:0, behavior:"smooth" });
}

function wireNav(){
  $$("[data-nav]").forEach(btn=>{
    btn.addEventListener("click", ()=> showView(btn.dataset.nav));
  });

  $("#btnGoDemo").addEventListener("click", ()=> showView("demo"));
  $("#btnStartNow").addEventListener("click", ()=> showView("demo"));
  $("#btnTour").addEventListener("click", ()=> showView("features"));

  $("#btnSeed").addEventListener("click", seedData);
}

// ====== Role-based Dashboard ======
function hideAllDash(){
  $("#dash-school").classList.add("hidden");
  $("#dash-doctor").classList.add("hidden");
  $("#dash-parent").classList.add("hidden");
  $("#dash-empty").classList.add("hidden");
}

function showDashByRole(role){
  hideAllDash();
  if(role === "school") $("#dash-school").classList.remove("hidden");
  else if(role === "doctor") $("#dash-doctor").classList.remove("hidden");
  else if(role === "parent") $("#dash-parent").classList.remove("hidden");
  else $("#dash-empty").classList.remove("hidden");
}

// ====== Rendering Lists ======
function reasonLabel(r){
  const map = {
    fever: "اشتباه حرارة",
    injury: "إصابة بسيطة",
    asthma: "أعراض تنفسية",
    other: "أخرى"
  };
  return map[r] || r;
}

function renderSchool(){
  const list = $("#schoolCases");
  if(!list) return;
  const cases = getCases();
  list.innerHTML = "";
  cases.slice().reverse().forEach(c=>{
    const el = document.createElement("div");
    el.className = "listItem";
    el.innerHTML = `
      <div>
        <strong>${c.id}</strong>
        <small>${c.student} — ${reasonLabel(c.reason)} — ${c.createdAt}</small>
      </div>
      <span class="badge ${c.status==="new"?"warn":(c.status==="closed"?"ok":"info")}">
        ${c.status==="new"?"جديدة":(c.status==="closed"?"مغلقة":"قيد المعالجة")}
      </span>
    `;
    list.appendChild(el);
  });
}

function renderDoctor(){
  const list = $("#doctorCases");
  if(!list) return;

  const cases = getCases().filter(c=> c.status !== "closed");
  list.innerHTML = "";

  if(cases.length === 0){
    list.innerHTML = `<div class="muted">لا توجد طلبات الآن.</div>`;
    return;
  }

  cases.slice().reverse().forEach(c=>{
    const el = document.createElement("div");
    el.className = "listItem";
    el.innerHTML = `
      <div>
        <strong>${c.id}</strong>
        <small>${c.student} — ${reasonLabel(c.reason)} — ${c.createdAt}</small>
      </div>
      <button class="btnGhost" data-pick="${c.id}">اختيار</button>
    `;
    list.appendChild(el);
  });

  $$("[data-pick]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const id = b.dataset.pick;
      localStorage.setItem("ssc_active_case", id);
      alert(`تم اختيار الحالة ${id} ✅`);
    });
  });
}

function renderParent(){
  const alertBox = $("#parentAlert");
  const resultBox = $("#parentResult");
  if(!alertBox || !resultBox) return;

  const cases = getCases();
  const last = cases.slice().reverse()[0];

  if(last){
    alertBox.innerHTML = `
      <div><strong>تنبيه:</strong> تم إنشاء طلب استشارة</div>
      <div class="muted">${last.student} — السبب: ${reasonLabel(last.reason)} — ${last.createdAt}</div>
      <div style="margin-top:10px">
        <span class="badge warn">بانتظار الطبيب</span>
      </div>
    `;
  }

  const results = getResults();
  const activeClosed = cases.slice().reverse().find(c=> c.status==="closed");
  if(activeClosed && results[activeClosed.id]){
    resultBox.textContent = results[activeClosed.id];
    alertBox.innerHTML = `
      <div><strong>تمت الاستشارة ✅</strong></div>
      <div class="muted">${activeClosed.student} — ${activeClosed.createdAt}</div>
      <div style="margin-top:10px">
        <span class="badge ok">تم إرسال توصية</span>
      </div>
    `;
  } else {
    resultBox.textContent = "—";
  }
}

function renderAll(){
  renderSchool();
  renderDoctor();
  renderParent();
}

// ====== Auth ======
function login(){
  const role = $("#role").value;
  const username = $("#username").value.trim();
  const password = $("#password").value;

  const users = getUsers();
  const u = users.find(x => x.username===username && x.password===password && x.role===role);

  if(!u){
    alert("بيانات الدخول غير صحيحة. جرّب الحسابات الجاهزة.");
    return;
  }

  setSession({ username:u.username, role:u.role, name:u.name, at: nowTime() });
  alert(`هلا ${u.name} 👋 تم الدخول بنجاح`);
  applySessionUI();
}

function logout(){
  clearSession();
  localStorage.removeItem("ssc_active_case");
  alert("تم تسجيل الخروج.");
  applySessionUI();
}

// ====== Doctor Actions ======
function createCase(){
  const student = $("#schoolStudent").value.trim() || "طالب غير محدد";
  const reason = $("#schoolReason").value;

  const id = "C-" + Math.floor(1000 + Math.random()*9000);
  const cases = getCases();
  cases.push({ id, student, reason, status:"new", createdAt: nowTime() });
  setCases(cases);

  $("#schoolStudent").value = "";
  alert(`تم إرسال الحالة ${id} للطبيب ✅`);
  renderAll();
}

function closeCase(){
  const activeId = localStorage.getItem("ssc_active_case");
  if(!activeId){
    alert("اختر حالة أولاً من قائمة الطلبات.");
    return;
  }
  const note = $("#doctorNote").value.trim();
  if(!note){
    alert("اكتب ملخص الطبيب قبل الإغلاق.");
    return;
  }

  const cases = getCases();
  const idx = cases.findIndex(c=> c.id===activeId);
  if(idx === -1){
    alert("الحالة غير موجودة.");
    return;
  }
  cases[idx].status = "closed";
  setCases(cases);

  const results = getResults();
  results[activeId] = note;
  setResults(results);

  $("#doctorNote").value = "";
  localStorage.removeItem("ssc_active_case");
  alert(`تم إغلاق الحالة ${activeId} وإرسال التوصية ✅`);
  renderAll();
}

// ====== Video (Local camera preview for MVP demo) ======
let mediaStream = null;

async function startCam(){
  try{
    mediaStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    $("#localVideo").srcObject = mediaStream;
  }catch(e){
    console.error(e);
    alert("تعذر تشغيل الكاميرا. تأكد من صلاحيات المتصفح.");
  }
}

function endCam(){
  if(mediaStream){
    mediaStream.getTracks().forEach(t=> t.stop());
    mediaStream = null;
  }
  const v = $("#localVideo");
  if(v) v.srcObject = null;
}

// ====== Apply Session ======
function applySessionUI(){
  const s = getSession();
  if(!s){
    showDashByRole(null);
    return;
  }
  showDashByRole(s.role);
  renderAll();
}

// ====== Init ======
function wireActions(){
  $("#btnLogin").addEventListener("click", login);
  $("#btnLogout").addEventListener("click", logout);

  const btnCreate = $("#btnCreateCase");
  if(btnCreate) btnCreate.addEventListener("click", createCase);

  const btnClose = $("#btnCloseCase");
  if(btnClose) btnClose.addEventListener("click", closeCase);

  const btnCam = $("#btnStartCam");
  if(btnCam) btnCam.addEventListener("click", startCam);

  const btnEnd = $("#btnEndCam");
  if(btnEnd) btnEnd.addEventListener("click", endCam);

  $("#year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", ()=>{
  wireNav();
  wireActions();
  applySessionUI();
  renderAll();
});
