/* Smart School Clinic — MVP (Static + LocalStorage) */

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const LS = {
  user: "ssc_user",
  data: "ssc_data",
};

const DEMO_USERS = {
  admin: { role: "school", username: "admin", password: "1234", name: "منسق المدرسة" },
  dr: { role: "doctor", username: "dr", password: "1234", name: "د. خالد" },
  parent: { role: "parent", username: "parent", password: "1234", name: "ولي أمر محمد" },
};

function nowStr(){
  const d = new Date();
  return d.toLocaleString("ar-SA", { hour12: true });
}

function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("is-show");
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => el.classList.remove("is-show"), 2200);
}

function loadData(){
  const raw = localStorage.getItem(LS.data);
  if(raw) return JSON.parse(raw);
  return null;
}
function saveData(data){
  localStorage.setItem(LS.data, JSON.stringify(data));
}

function seedData(){
  const data = {
    students: [
      { id:"S1", name:"محمد", grade:"6", status:"سليم", lastVitals:{ temp: 37.1, hr: 88, spo2: 98 } },
      { id:"S2", name:"سارة", grade:"5", status:"جيد", lastVitals:{ temp: 36.8, hr: 92, spo2: 99 } },
      { id:"S3", name:"عبدالله", grade:"4", status:"ملاحظة", lastVitals:{ temp: 38.7, hr: 104, spo2: 97 } },
    ],
    requests: [],
    alerts: [],
    logs: [
      { t: nowStr(), txt: "تم تهيئة بيانات تجريبية." },
    ],
    closed: [],
  };
  saveData(data);
  toast("تمت تهيئة البيانات ✅");
  renderAll();
}

function getUser(){
  const raw = localStorage.getItem(LS.user);
  return raw ? JSON.parse(raw) : { role:"guest" };
}
function setUser(user){
  localStorage.setItem(LS.user, JSON.stringify(user));
  renderAll();
}
function logout(){
  localStorage.removeItem(LS.user);
  toast("تم تسجيل الخروج");
  renderAll();
}

function guardRoute(){
  const role = getUser().role || "guest";
  // dashboards
  $$(".dash").forEach(d => d.classList.remove("is-active"));
  const target = $(`.dash[data-guard="${role}"]`) || $(`.dash[data-guard="guest"]`);
  target.classList.add("is-active");
}

function setActiveNav(route){
  $$(".nav__link").forEach(a => a.classList.toggle("is-active", a.dataset.route === route));
}

function route(){
  const hash = (location.hash || "#home").replace("#","");
  const routeName = ["home","features","demo","contact"].includes(hash) ? hash : "home";
  $$(".route").forEach(r => r.classList.remove("is-active"));
  $(`#route-${routeName}`)?.classList.add("is-active");
  setActiveNav(routeName);
  // close mobile nav
  $("#mobileNav").style.display = "none";
}

function renderStudentsSelect(){
  const data = loadData();
  const sel = $("#schoolStudent");
  if(!sel) return;
  sel.innerHTML = "";
  if(!data?.students?.length){
    sel.innerHTML = `<option>لا توجد بيانات — اضغط "تهيئة بيانات"</option>`;
    return;
  }
  data.students.forEach(s=>{
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (صف ${s.grade}) — آخر حرارة: ${s.lastVitals.temp}`;
    sel.appendChild(opt);
  });
}

function renderSchoolLog(){
  const data = loadData();
  const el = $("#schoolLog");
  if(!el) return;
  el.innerHTML = "";
  const logs = data?.logs || [];
  if(!logs.length){
    el.innerHTML = `<div class="item"><div class="item__title">لا يوجد سجل بعد</div><div class="item__meta">ابدأ بتهيئة البيانات ثم أنشئ طلب.</div></div>`;
    return;
  }
  logs.slice().reverse().slice(0,6).forEach(l=>{
    el.insertAdjacentHTML("beforeend", `
      <div class="item">
        <div class="item__title">${l.txt}</div>
        <div class="item__meta">${l.t}</div>
      </div>
    `);
  });
}

function renderDoctorRequests(){
  const data = loadData();
  const el = $("#doctorRequests");
  if(!el) return;
  el.innerHTML = "";
  const reqs = (data?.requests || []).filter(r => r.status !== "closed");
  if(!reqs.length){
    el.innerHTML = `<div class="item"><div class="item__title">لا توجد طلبات</div><div class="item__meta">خلّ المدرسة ترسل طلب استشارة.</div></div>`;
    return;
  }
  reqs.slice().reverse().forEach(r=>{
    el.insertAdjacentHTML("beforeend", `
      <div class="item">
        <div class="item__title">طلب #${r.id} — ${r.studentName}</div>
        <div class="item__meta">
          السبب: ${r.reason}<br/>
          الحالة: <b>${r.status}</b><br/>
          وقت الإنشاء: ${r.createdAt}
        </div>
        <div class="item__actions">
          <button class="btn btn--primary" data-action="pick" data-id="${r.id}">اختيار الحالة</button>
          <button class="btn btn--ghost" data-action="mark" data-id="${r.id}">تغيير إلى "قيد الاستشارة"</button>
        </div>
      </div>
    `);
  });

  el.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if(action === "pick") pickCase(id);
      if(action === "mark") markInCall(id);
    });
  });
}

function renderParentAlerts(){
  const data = loadData();
  const el = $("#parentAlerts");
  if(!el) return;
  el.innerHTML = "";
  const alerts = data?.alerts || [];
  if(!alerts.length){
    el.innerHTML = `<div class="item"><div class="item__title">لا توجد تنبيهات بعد</div><div class="item__meta">بانتظار إنشاء طلب أو إغلاق حالة.</div></div>`;
    return;
  }
  alerts.slice().reverse().slice(0,6).forEach(a=>{
    el.insertAdjacentHTML("beforeend", `
      <div class="item">
        <div class="item__title">${a.title}</div>
        <div class="item__meta">${a.body}<br/>${a.t}</div>
      </div>
    `);
  });
}

function renderParentResult(){
  const data = loadData();
  const el = $("#parentResult");
  if(!el) return;
  const last = (data?.closed || []).slice().reverse()[0];
  if(!last){
    el.innerHTML = `<div class="muted">التوصية تظهر هنا بعد إغلاق الطبيب للحالة.</div>`;
    return;
  }
  el.innerHTML = `
    <div><b>آخر حالة مغلقة:</b> ${last.studentName} (طلب #${last.id})</div>
    <div style="margin-top:8px"><b>التوصية:</b><br/>${escapeHtml(last.recommendation).replace(/\n/g,"<br/>")}</div>
    <div class="muted small" style="margin-top:10px">${last.closedAt}</div>
  `;
}

function escapeHtml(s){
  return (s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

let activeCaseId = null;

function createRequest(){
  const user = getUser();
  if(user.role !== "school"){ toast("هذه العملية للمدرسة فقط"); return; }

  const data = loadData();
  if(!data){ toast("اضغط تهيئة بيانات أولًا"); return; }

  const sid = $("#schoolStudent").value;
  const reason = $("#schoolReason").value;

  const student = data.students.find(s=>s.id===sid);
  if(!student){ toast("اختر طالبًا"); return; }

  const id = String(Math.floor(1000 + Math.random()*9000));
  const req = {
    id,
    studentId: student.id,
    studentName: student.name,
    reason,
    status: "new",
    createdAt: nowStr(),
    consent: "pending",
  };

  data.requests.push(req);
  data.logs.push({ t: nowStr(), txt: `إنشاء طلب استشارة للطالب ${student.name} (سبب: ${reason})` });

  data.alerts.push({
    t: nowStr(),
    title: "تنبيه جديد لولي الأمر",
    body: `تم إنشاء طلب استشارة لابنك/ابنتك (${student.name}) بسبب: ${reason}.`,
    type: "request_created",
    requestId: id,
  });

  saveData(data);
  $("#schoolHint").textContent = `تم إرسال الطلب للطبيب (طلب #${id}).`;
  toast("تم إرسال الطلب للطبيب ✅");
  renderAll();
}

function pickCase(id){
  const data = loadData();
  const req = data?.requests?.find(r=>r.id===id);
  if(!req){ toast("الطلب غير موجود"); return; }
  activeCaseId = id;
  $("#doctorHint").textContent = `تم اختيار الحالة: طلب #${id} — ${req.studentName}`;
  toast("تم اختيار الحالة");
}

function markInCall(id){
  const data = loadData();
  const req = data?.requests?.find(r=>r.id===id);
  if(!req){ toast("الطلب غير موجود"); return; }
  req.status = "in_call";
  data.logs.push({ t: nowStr(), txt: `الطبيب بدأ الاستشارة لطلب #${id} (${req.studentName})` });
  saveData(data);
  toast("تم تحديث الحالة إلى قيد الاستشارة");
  renderAll();
}

function closeCase(){
  const user = getUser();
  if(user.role !== "doctor"){ toast("هذه العملية للطبيب فقط"); return; }

  const data = loadData();
  if(!data){ toast("لا توجد بيانات"); return; }

  const id = activeCaseId || (data.requests.slice().reverse().find(r=>r.status!=="closed")?.id);
  if(!id){ toast("اختر حالة أولًا"); return; }

  const req = data.requests.find(r=>r.id===id);
  if(!req){ toast("الطلب غير موجود"); return; }

  const notes = ($("#doctorNotes").value || "").trim();
  if(!notes){ toast("اكتب ملخص/توصية قبل الإغلاق"); return; }

  req.status = "closed";
  const closed = {
    id: req.id,
    studentName: req.studentName,
    recommendation: notes,
    closedAt: nowStr(),
  };
  data.closed.push(closed);

  data.logs.push({ t: nowStr(), txt: `إغلاق طلب #${req.id} وإرسال التوصية لولي الأمر.` });
  data.alerts.push({
    t: nowStr(),
    title: "نتيجة الاستشارة جاهزة",
    body: `تم إغلاق الحالة للطالب (${req.studentName}). يمكنك الآن مشاهدة التوصية.`,
    type: "case_closed",
    requestId: req.id,
  });

  saveData(data);
  $("#doctorHint").textContent = `تم إغلاق الحالة: طلب #${req.id} ✅`;
  toast("تم إرسال التوصية لولي الأمر ✅");
  renderAll();
}

function approveOrDeny(decision){
  const user = getUser();
  if(user.role !== "parent"){ toast("هذه العملية لولي الأمر فقط"); return; }

  const data = loadData();
  if(!data){ toast("لا توجد بيانات"); return; }

  const latest = data.requests.slice().reverse().find(r=>r.consent === "pending");
  if(!latest){
    toast("لا يوجد طلب يحتاج موافقة");
    return;
  }

  latest.consent = decision;
  data.logs.push({ t: nowStr(), txt: `ولي الأمر قام بـ ${decision === "approved" ? "الموافقة" : "الرفض"} على طلب #${latest.id}.` });

  data.alerts.push({
    t: nowStr(),
    title: "تحديث من ولي الأمر",
    body: `ولي الأمر قام بـ ${decision === "approved" ? "الموافقة" : "الرفض"} على طلب #${latest.id}.`,
    type: "consent",
    requestId: latest.id,
  });

  saveData(data);

  $("#parentHint").textContent = decision === "approved"
    ? `تمت الموافقة على طلب #${latest.id}.`
    : `تم رفض طلب #${latest.id}.`;

  toast(decision === "approved" ? "تمت الموافقة ✅" : "تم الرفض");
  renderAll();
}

/* Camera (Local) */
let camStream = null;
async function startCam(){
  try{
    const video = $("#localVideo");
    camStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
    video.srcObject = camStream;
    toast("تم تشغيل الكاميرا 📹");
  }catch(e){
    toast("تعذر تشغيل الكاميرا (تحقق من الصلاحيات)");
  }
}
function stopCam(){
  if(camStream){
    camStream.getTracks().forEach(t=>t.stop());
    camStream = null;
    $("#localVideo").srcObject = null;
    toast("تم إيقاف الكاميرا");
  }
}

/* Render */
function renderAll(){
  guardRoute();
  renderStudentsSelect();
  renderSchoolLog();
  renderDoctorRequests();
  renderParentAlerts();
  renderParentResult();

  // UI hints
  const user = getUser();
  const roleMap = { school:"مدرسة", doctor:"طبيب", parent:"ولي أمر", guest:"ضيف" };
  document.title = `العيادة المدرسية الذكية — ${roleMap[user.role] || "MVP"}`;
}

/* Login */
function mapRoleToSelect(role){
  if(role === "school") return "school";
  if(role === "doctor") return "doctor";
  if(role === "parent") return "parent";
  return "school";
}

function handleLogin(e){
  e.preventDefault();
  const role = $("#role").value;
  const username = ($("#username").value || "").trim();
  const password = ($("#password").value || "").trim();

  const ok =
    (role==="school" && username==="admin" && password==="1234") ||
    (role==="doctor" && username==="dr" && password==="1234") ||
    (role==="parent" && username==="parent" && password==="1234");

  if(!ok){ toast("بيانات الدخول غير صحيحة"); return; }

  const name =
    role==="school" ? DEMO_USERS.admin.name :
    role==="doctor" ? DEMO_USERS.dr.name :
    DEMO_USERS.parent.name;

  setUser({ role, username, name });
  toast(`أهلًا ${name} 👋`);
  location.hash = "#demo";
}

/* Quick fills */
function fillAccount(which){
  if(which === "admin"){
    $("#role").value = "school";
    $("#username").value = "admin";
    $("#password").value = "1234";
  }
  if(which === "dr"){
    $("#role").value = "doctor";
    $("#username").value = "dr";
    $("#password").value = "1234";
  }
  if(which === "parent"){
    $("#role").value = "parent";
    $("#username").value = "parent";
    $("#password").value = "1234";
  }
  toast("تم تعبئة الحساب");
}

/* Init */
function init(){
  $("#year").textContent = new Date().getFullYear();

  // routing
  window.addEventListener("hashchange", route);
  route();

  // mobile nav
  $("#burgerBtn").addEventListener("click", ()=>{
    const nav = $("#mobileNav");
    nav.style.display = (nav.style.display === "block") ? "none" : "block";
  });

  // seed
  $("#seedBtn").addEventListener("click", seedData);

  // CTA
  $("#ctaBtn").addEventListener("click", ()=> location.hash="#demo");
  $("#jumpDemoBtn").addEventListener("click", ()=> location.hash="#demo");

  // quick login (hero)
  $("#quickLoginAdmin").addEventListener("click", ()=>{
    if(!loadData()) seedData();
    setUser({ role:"school", username:"admin", name: DEMO_USERS.admin.name });
    toast("تم الدخول (مدرسة) ✅");
    location.hash="#demo";
  });

  // login form
  $("#loginForm").addEventListener("submit", handleLogin);
  $("#logoutBtn").addEventListener("click", logout);

  // chips
  $$(".chip").forEach(c=>{
    c.addEventListener("click", ()=> fillAccount(c.dataset.fill));
  });

  // actions
  $("#createRequestBtn").addEventListener("click", createRequest);
  $("#startCamBtn").addEventListener("click", startCam);
  $("#stopCamBtn").addEventListener("click", stopCam);
  $("#closeCaseBtn").addEventListener("click", closeCase);
  $("#approveBtn").addEventListener("click", ()=> approveOrDeny("approved"));
  $("#denyBtn").addEventListener("click", ()=> approveOrDeny("denied"));

  // default data if exists
  renderAll();
}

init();
(function(){
  const KEY = "ssc_state_v1";
  const ROLE_KEY = "ssc_role_v1";

  const seed = () => ({
    visits: [
      {id:"V-101", student:"محمد", grade:"سادس", time:"10:05", status:"مكتمل"},
      {id:"V-102", student:"سارة", grade:"خامس", time:"10:18", status:"قيد المتابعة"},
    ],
    tickets: [
      {id:"T-9001", student:"محمد", issue:"صداع + حرارة", severity:"متوسط", parentStatus:"بانتظار", doctorStatus:"جديد", note:""},
      {id:"T-9002", student:"سارة", issue:"ألم بطن", severity:"حرج", parentStatus:"موافق", doctorStatus:"بانتظار اتصال", note:""},
    ],
    calls: [
      {id:"C-300", ticket:"T-9002", status:"مجدولة", when:"خلال 5 دقائق"}
    ]
  });

  const load = () => {
    try{
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : seed();
    }catch(e){ return seed(); }
  };

  const save = (state) => localStorage.setItem(KEY, JSON.stringify(state));

  const getRole = () => localStorage.getItem(ROLE_KEY) || "";
  const setRole = (r) => localStorage.setItem(ROLE_KEY, r);

  const routes = {
    school: "./dashboards/school.html",
    doctor: "./dashboards/doctor.html",
    parent: "./dashboards/parent.html",
  };

  const login = (role) => {
    setRole(role);
    const path = routes[role] || "./index.html";
    window.location.href = path;
  };

  const logout = () => {
    localStorage.removeItem(ROLE_KEY);
    window.location.href = "./index.html";
  };

  const guard = (allowedRoles=[]) => {
    const role = getRole();
    if(!role || (allowedRoles.length && !allowedRoles.includes(role))){
      window.location.href = "../index.html";
    }
  };

  const api = {
    getState: () => load(),
    setState: (s) => save(s),
    getRole,
    login,
    logout,
    guard,

    addTicket: (payload) => {
      const s = load();
      const id = "T-" + Math.floor(10000 + Math.random()*89999);
      s.tickets.unshift({
        id,
        student: payload.student,
        issue: payload.issue,
        severity: payload.severity,
        parentStatus: "بانتظار",
        doctorStatus: "جديد",
        note: payload.note || ""
      });
      save(s);
      return id;
    },

    setParentStatus: (ticketId, status) => {
      const s = load();
      const t = s.tickets.find(x=>x.id===ticketId);
      if(t) t.parentStatus = status;
      save(s);
    },

    setDoctorStatus: (ticketId, status, note="") => {
      const s = load();
      const t = s.tickets.find(x=>x.id===ticketId);
      if(t){
        t.doctorStatus = status;
        if(note) t.note = note;
      }
      save(s);
    },

    scheduleCall: (ticketId, when="الآن") => {
      const s = load();
      const id = "C-" + Math.floor(100 + Math.random()*900);
      s.calls.unshift({id, ticket: ticketId, status:"جارية", when});
      const t = s.tickets.find(x=>x.id===ticketId);
      if(t) t.doctorStatus = "استشارة مرئية";
      save(s);
      return id;
    }
  };

  window.SSC = api;
})();
