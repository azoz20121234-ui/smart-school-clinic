/* Smart School Clinic MVP - Static (GitHub Pages)
   - Role based access (RBAC)
   - Mock workflow + audit log
   - Video consult simulation (getUserMedia + BroadcastChannel for 2 tabs)
*/

const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

/* ------------------ Storage Helpers ------------------ */
const LS_KEYS = {
  STATE: "ssc_state_v1",
  CREDS: "ssc_creds_v1",
  SESSION: "ssc_session_v1",
};

const now = () => new Date().toLocaleString("ar-SA");

function loadJSON(key, fallback){
  try{
    const v = localStorage.getItem(key);
    if(!v) return fallback;
    return JSON.parse(v);
  }catch{
    return fallback;
  }
}
function saveJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

/* ------------------ Default Data ------------------ */
const DEFAULT_CREDS = {
  admin:  { user:"admin",  pass:"1234" },
  school: { user:"school", pass:"1234" },
  doctor: { user:"doctor", pass:"1234" },
  parent: { user:"parent", pass:"1234" },
};

const DEFAULT_STATE = {
  seq: 1001,
  calls: 0,
  alerts: [],
  audit: [],
  cases: [
    {
      id: 1000,
      student: "سارة",
      grade: "خامس (أ)",
      reason: "ألم بطن + غثيان",
      priority: "متوسط",
      status: "بانتظار الطبيب",
      consent: "pending",
      createdAt: now(),
      vitals: mockVitals(),
      notes: "",
      doctorDecision: "",
      plan: "مراقبة 10 دقائق + قياس حرارة + تقييم جفاف",
      assignedDoctor: "doctor",
      parent: "parent",
    }
  ]
};

const RBAC = {
  features: {
    create_case:   { label: "إنشاء حالة",        school:true, doctor:false, parent:false, admin:true },
    view_cases:    { label: "عرض الحالات",       school:true, doctor:true,  parent:true,  admin:true },
    accept_case:   { label: "قبول/رفض حالة",     school:false,doctor:true,  parent:false, admin:true },
    notify_parent: { label: "إشعار ولي الأمر",   school:true, doctor:true,  parent:false, admin:true },
    start_call:    { label: "بدء استشارة مرئية", school:true, doctor:true,  parent:true,  admin:true },
    close_case:    { label: "إغلاق الحالة",      school:true, doctor:true,  parent:false, admin:true },
    export_data:   { label: "تصدير البيانات",    school:true, doctor:true,  parent:true,  admin:true },
    edit_creds:    { label: "تعديل الحسابات",    school:false,doctor:false, parent:false, admin:true },
  }
};

/* ------------------ Global State ------------------ */
let state = loadJSON(LS_KEYS.STATE, null) || structuredClone(DEFAULT_STATE);
let creds = loadJSON(LS_KEYS.CREDS, null) || structuredClone(DEFAULT_CREDS);
let session = loadJSON(LS_KEYS.SESSION, null) || { role:null, user:null };

function persist(){
  saveJSON(LS_KEYS.STATE, state);
  saveJSON(LS_KEYS.CREDS, creds);
  saveJSON(LS_KEYS.SESSION, session);
}

/* ------------------ UI Routing ------------------ */
function setRoute(route){
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.route === route));
  $$(".route").forEach(s => s.classList.add("hidden"));
  $("#route-" + route).classList.remove("hidden");
  // context refresh
  refreshAll();
}

function bindNav(){
  $$(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=> setRoute(btn.dataset.route));
  });
  $$("[data-nav]").forEach(btn=>{
    btn.addEventListener("click", ()=> setRoute(btn.dataset.nav));
  });
}

/* ------------------ Audit & Alerts ------------------ */
function addAudit(title, msg){
  state.audit.unshift({ t: title, m: msg, at: now(), by: session.user || "system" });
  persist();
}
function addAlert(msg, level="info"){
  state.alerts.unshift({ m: msg, level, at: now() });
  persist();
}

function renderLogs(){
  const auditBox = $("#auditLog");
  const alertsBox = $("#alertsLog");
  if(auditBox){
    auditBox.innerHTML = state.audit.slice(0,40).map(x => `
      <div class="item">
        <div class="t">${escapeHTML(x.t)} <span class="muted">— ${escapeHTML(x.at)}</span></div>
        <div class="m">${escapeHTML(x.m)} <span class="muted">(${escapeHTML(x.by)})</span></div>
      </div>
    `).join("") || `<div class="muted">لا يوجد أحداث بعد.</div>`;
  }
  if(alertsBox){
    alertsBox.innerHTML = state.alerts.slice(0,30).map(x => `
      <div class="item">
        <div class="t">${badgeForLevel(x.level)} <span class="muted">${escapeHTML(x.at)}</span></div>
        <div class="m">${escapeHTML(x.m)}</div>
      </div>
    `).join("") || `<div class="muted">لا يوجد تنبيهات.</div>`;
  }
}

function badgeForLevel(level){
  if(level==="ok") return `<span class="badge ok">✅</span>`;
  if(level==="warn") return `<span class="badge warn">⚠️</span>`;
  if(level==="bad") return `<span class="badge bad">⛔</span>`;
  return `<span class="badge">ℹ️</span>`;
}

/* ------------------ KPI ------------------ */
function renderKPIs(){
  $("#kpiCases").textContent = state.cases.length;
  $("#kpiPending").textContent = state.cases.filter(c=>c.status==="بانتظار الطبيب").length;
  $("#kpiCalls").textContent = state.calls;
  $("#kpiAlerts").textContent = state.alerts.length;
}

/* ------------------ Timeline ------------------ */
function renderTimeline(){
  const box = $("#timeline");
  if(!box) return;
  const steps = [
    {n:1, h:"دخول الطالب/بلاغ", p:"تسجيل حالة الطالب من المدرسة أو بوابة ذكية."},
    {n:2, h:"فحص أولي", p:"قياسات (محاكاة) + تحديد الأولوية + توثيق."},
    {n:3, h:"إشعار ولي الأمر", p:"طلب موافقة وإرسال ملخص الحالة."},
    {n:4, h:"مراجعة الطبيب", p:"قبول/رفض + توصية + تحديد هل يلزم استشارة مرئية."},
    {n:5, h:"استشارة مرئية", p:"تشغيل كاميرا/مايك + ملاحظات + تقرير."},
    {n:6, h:"إغلاق الحالة", p:"توثيق النتيجة وتحديث سجل المدرسة وولي الأمر."},
  ];
  box.innerHTML = steps.map(s=>`
    <div class="step">
      <div class="n">${s.n}</div>
      <div class="c">
        <div class="h">${s.h}</div>
        <div class="p">${s.p}</div>
      </div>
    </div>
  `).join("");
}

/* ------------------ RBAC ------------------ */
function can(feature){
  const role = session.role;
  if(!role) return false;
  const f = RBAC.features[feature];
  return !!f?.[role];
}

function renderRBAC(){
  const tbody = $("#rbacTable");
  if(!tbody) return;

  tbody.innerHTML = Object.entries(RBAC.features).map(([key, f]) => {
    const yes = (v)=> v ? "✅" : "—";
    return `
      <tr>
        <td><b>${f.label}</b> <span class="muted mono">(${key})</span></td>
        <td>${yes(f.school)}</td>
        <td>${yes(f.doctor)}</td>
        <td>${yes(f.parent)}</td>
        <td>${yes(f.admin)}</td>
      </tr>
    `;
  }).join("");
}

/* ------------------ Cases ------------------ */
let selectedCaseId = null;

function renderCasesTable(){
  const tbody = $("#casesTable tbody");
  if(!tbody) return;

  const role = session.role;
  const filtered = state.cases.filter(c => {
    if(!role) return true;
    if(role === "doctor") return c.assignedDoctor === session.user || session.user==="doctor";
    if(role === "parent") return c.parent === session.user || session.user==="parent";
    return true;
  });

  tbody.innerHTML = filtered.map(c=>{
    const st = statusBadge(c.status);
    const pr = priorityBadge(c.priority);
    return `
      <tr data-id="${c.id}">
        <td class="mono">${c.id}</td>
        <td><b>${escapeHTML(c.student)}</b></td>
        <td>${escapeHTML(c.grade)}</td>
        <td>${escapeHTML(c.reason)}</td>
        <td>${st}</td>
        <td>${pr}</td>
        <td>
          <div class="actions">
            <button class="btn ghost small" data-act="view">عرض</button>
            <button class="btn small" data-act="call">اتصال</button>
            <button class="btn danger small" data-act="close">إغلاق</button>
          </div>
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="7" class="muted">لا توجد حالات للدور الحالي.</td></tr>`;

  // row click handlers
  $$("#casesTable tbody tr").forEach(tr=>{
    tr.addEventListener("click", (e)=>{
      const btn = e.target.closest("button");
      const id = Number(tr.dataset.id);
      if(btn){
        const act = btn.dataset.act;
        if(act==="view"){ selectCase(id); }
        if(act==="call"){ selectCase(id); setRoute("video"); }
        if(act==="close"){ selectCase(id); closeCase(); }
        return;
      }
      selectCase(id);
    });
  });
}

function statusBadge(status){
  if(status==="مفتوحة") return `<span class="badge">مفتوحة</span>`;
  if(status==="بانتظار الطبيب") return `<span class="badge warn">بانتظار الطبيب</span>`;
  if(status==="مقبولة") return `<span class="badge ok">مقبولة</span>`;
  if(status==="مرفوضة") return `<span class="badge bad">مرفوضة</span>`;
  if(status==="مغلقة") return `<span class="badge">مغلقة</span>`;
  return `<span class="badge">${escapeHTML(status)}</span>`;
}

function priorityBadge(p){
  if(p==="عاجل") return `<span class="badge bad">عاجل</span>`;
  if(p==="متوسط") return `<span class="badge warn">متوسط</span>`;
  return `<span class="badge ok">عادي</span>`;
}

function getCase(id){
  return state.cases.find(c=>c.id===id);
}

function selectCase(id){
  selectedCaseId = id;
  const c = getCase(id);
  if(!c) return;
  renderCaseDetails(c);
  addAudit("عرض حالة", `تم فتح تفاصيل الحالة رقم ${c.id}.`);
  renderLogs();
}

function renderCaseDetails(c){
  $("#caseDetails").innerHTML = `
    <div class="grid2">
      <div>
        <div class="muted">الطالب</div>
        <div class="card-title">${escapeHTML(c.student)}</div>
        <div class="muted">الصف: ${escapeHTML(c.grade)} — رقم الحالة: <span class="mono">${c.id}</span></div>
        <div class="divider"></div>
        <div class="muted">السبب</div>
        <div><b>${escapeHTML(c.reason)}</b></div>
        <div class="muted">إنشاء: ${escapeHTML(c.createdAt)}</div>
      </div>
      <div>
        <div class="muted">الحالة</div>
        <div>${statusBadge(c.status)} ${priorityBadge(c.priority)}</div>
        <div class="muted">موافقة ولي الأمر: <b>${consentLabel(c.consent)}</b></div>
        <div class="divider"></div>
        <div class="muted">خطة/إجراء</div>
        <div>${escapeHTML(c.plan || "—")}</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="muted">ملاحظات الطبيب</div>
    <div>${escapeHTML(c.notes || "—")}</div>
  `;
  $("#planBox").textContent = c.plan || "—";
  renderVitals(c.vitals);
  refreshActionButtons();
}

function consentLabel(v){
  if(v==="approved") return "موافق";
  if(v==="rejected") return "مرفوض";
  return "بانتظار";
}

function renderVitals(v){
  const box = $("#vitals");
  if(!box) return;
  const items = [
    {t:"نبض القلب", val:v.hr, unit:"bpm"},
    {t:"درجة الحرارة", val:v.temp, unit:"°C"},
    {t:"ضغط الدم", val:`${v.bpS}/${v.bpD}`, unit:"mmHg"},
    {t:"تشبع الأكسجين", val:v.spo2, unit:"%"},
  ];
  box.innerHTML = items.map(i=>`
    <div class="vital">
      <div class="v-title">${i.t}</div>
      <div class="v-val">${i.val} <span class="v-unit">${i.unit}</span></div>
    </div>
  `).join("");
}

function mockVitals(){
  const hr = rand(72, 118);
  const temp = (Math.random() < 0.30) ? (rand(378, 392)/10) : (rand(365, 377)/10);
  const bpS = rand(98, 132);
  const bpD = rand(60, 86);
  const spo2 = rand(95, 100);
  return { hr, temp, bpS, bpD, spo2 };
}

/* ------------------ Actions with Permissions ------------------ */
function guard(feature){
  if(can(feature)) return true;
  toast(`صلاحيتك لا تسمح: ${RBAC.features[feature]?.label || feature}`, "bad");
  addAudit("محاولة غير مصرح بها", `تم منع إجراء (${feature}) للدور ${session.role || "غير معروف"}.`);
  renderLogs();
  return false;
}

function notifyParent(){
  if(!guard("notify_parent")) return;
  const c = getCase(selectedCaseId);
  if(!c) return;
  addAlert(`تم إشعار ولي الأمر بخصوص الحالة #${c.id} (${c.student}).`, "warn");
  addAudit("إشعار ولي الأمر", `إرسال إشعار موافقة على الاستشارة للحالة #${c.id}.`);
  renderLogs();
  renderKPIs();
}

function acceptCase(){
  if(!guard("accept_case")) return;
  const c = getCase(selectedCaseId);
  if(!c) return;
  c.status = "مقبولة";
  c.doctorDecision = "accepted";
  c.plan = "استشارة مرئية + تقييم سريري مختصر + توصيات منزلية + متابعة 24 ساعة";
  persist();
  addAlert(`الطبيب قبل الحالة #${c.id}.`, "ok");
  addAudit("قبول حالة", `تم قبول الحالة #${c.id} وتحديث خطة الإجراء.`);
  renderCaseDetails(c);
  renderCasesTable();
  renderLogs();
  renderKPIs();
}

function rejectCase(){
  if(!guard("accept_case")) return;
  const c = getCase(selectedCaseId);
  if(!c) return;
  c.status = "مرفوضة";
  c.doctorDecision = "rejected";
  c.plan = "لا تتطلب استشارة — يوصى بمتابعة ممرضة المدرسة وتقييم لاحق";
  persist();
  addAlert(`الطبيب رفض الحالة #${c.id}.`, "bad");
  addAudit("رفض حالة", `تم رفض الحالة #${c.id}.`);
  renderCaseDetails(c);
  renderCasesTable();
  renderLogs();
  renderKPIs();
}

function closeCase(){
  if(!guard("close_case")) return;
  const c = getCase(selectedCaseId);
  if(!c) return;
  c.status = "مغلقة";
  persist();
  addAlert(`تم إغلاق الحالة #${c.id}.`, "ok");
  addAudit("إغلاق حالة", `إغلاق الحالة #${c.id}.`);
  renderCaseDetails(c);
  renderCasesTable();
  renderLogs();
  renderKPIs();
}

function startCallFromCase(){
  if(!guard("start_call")) return;
  if(!selectedCaseId){
    toast("اختر حالة أولاً.", "warn");
    return;
  }
  setRoute("video");
  pushCallLog(`تم فتح صفحة الاستشارة للحالة #${selectedCaseId}.`);
}

/* ------------------ Case Create Modal ------------------ */
function openModal(){ $("#caseModal").classList.remove("hidden"); }
function closeModal(){ $("#caseModal").classList.add("hidden"); $("#caseMsg").style.display="none"; }

function createCaseFromForm(){
  if(!guard("create_case")) return;
  const student = $("#cStudent").value.trim();
  const grade   = $("#cGrade").value.trim();
  const reason  = $("#cReason").value.trim();
  const priority= $("#cPriority").value;
  const consent = $("#cConsent").value;
  const note    = $("#cNote").value.trim();

  if(!student || !grade || !reason){
    showCaseMsg("الرجاء تعبئة الحقول المطلوبة.");
    return;
  }

  const id = state.seq++;
  const c = {
    id,
    student,
    grade,
    reason,
    priority,
    status: "بانتظار الطبيب",
    consent,
    createdAt: now(),
    vitals: mockVitals(),
    notes: note,
    doctorDecision: "",
    plan: "قياس مؤشرات + تقييم أولي + إشعار ولي الأمر + تحويل للطبيب",
    assignedDoctor: "doctor",
    parent: "parent",
  };
  state.cases.unshift(c);
  persist();

  addAudit("إنشاء حالة", `تم إنشاء الحالة #${id} للطالب ${student}.`);
  addAlert(`حالة جديدة #${id} بانتظار الطبيب.`, "warn");
  closeModal();
  renderCasesTable();
  renderKPIs();
  renderLogs();
  selectCase(id);
  toast("تم إنشاء الحالة بنجاح.", "ok");
}

function showCaseMsg(m){
  const box = $("#caseMsg");
  box.style.display="block";
  box.textContent = m;
}

/* ------------------ Login ------------------ */
function setSession(role, user){
  session = { role, user };
  persist();
  refreshSessionChip();
  refreshAll();
}

function refreshSessionChip(){
  const chip = $("#sessionChip");
  if(session?.role){
    chip.textContent = `مسجل: ${session.role} (${session.user})`;
    chip.style.color = "rgba(210,255,239,.88)";
    chip.style.borderColor = "rgba(32,201,151,.30)";
  }else{
    chip.textContent = "غير مسجل";
    chip.style.color = "rgba(255,255,255,.62)";
    chip.style.borderColor = "rgba(255,255,255,.08)";
  }
}

function login(role, user, pass){
  const expected = creds?.[role];
  if(!expected) return false;
  return expected.user === user && expected.pass === pass;
}

function handleLogin(e){
  e.preventDefault();
  const role = $("#roleSelect").value;
  const user = $("#username").value.trim();
  const pass = $("#password").value.trim();

  const ok = login(role, user, pass);
  const msg = $("#loginMsg");
  msg.style.display = "block";

  if(ok){
    msg.className = "notice ok";
    msg.textContent = "تم تسجيل الدخول بنجاح.";
    addAudit("تسجيل دخول", `الدخول كـ ${role} (${user}).`);
    setSession(role, user);
    setRoute("dash");
  }else{
    msg.className = "notice bad";
    msg.textContent = "بيانات الدخول غير صحيحة.";
    addAudit("فشل دخول", `محاولة دخول فاشلة كـ ${role} (${user}).`);
    renderLogs();
  }
}

function logout(){
  addAudit("تسجيل خروج", `خروج المستخدم ${session.user || ""}.`);
  session = { role:null, user:null };
  persist();
  refreshSessionChip();
  refreshAll();
  toast("تم تسجيل الخروج.", "ok");
}

/* ------------------ Credentials Settings ------------------ */
function renderCreds(){
  $("#credAdmin").value  = `${creds.admin.user}/${creds.admin.pass}`;
  $("#credSchool").value = `${creds.school.user}/${creds.school.pass}`;
  $("#credDoctor").value = `${creds.doctor.user}/${creds.doctor.pass}`;
  $("#credParent").value = `${creds.parent.user}/${creds.parent.pass}`;
}

function saveCreds(){
  if(!guard("edit_creds")) return;
  const parse = (v) => {
    const [u,p] = v.split("/");
    return { user:(u||"").trim(), pass:(p||"").trim() };
  };
  creds.admin  = parse($("#credAdmin").value);
  creds.school = parse($("#credSchool").value);
  creds.doctor = parse($("#credDoctor").value);
  creds.parent = parse($("#credParent").value);
  persist();
  addAudit("تعديل حسابات", "تم تعديل حسابات الدخول التجريبية.");
  toast("تم الحفظ.", "ok");
  renderLogs();
}

function restoreCreds(){
  if(!guard("edit_creds")) return;
  creds = structuredClone(DEFAULT_CREDS);
  persist();
  renderCreds();
  addAudit("استرجاع الحسابات", "تم استرجاع الحسابات الافتراضية.");
  toast("تم الاسترجاع.", "ok");
  renderLogs();
}

/* ------------------ Export ------------------ */
function exportData(){
  if(!guard("export_data")) return;
  const data = {
    exportedAt: now(),
    session,
    state
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ssc-mvp-export.json";
  a.click();
  URL.revokeObjectURL(url);

  addAudit("تصدير بيانات", "تم تصدير بيانات الـMVP.");
  toast("تم تصدير JSON.", "ok");
  renderLogs();
}

/* ------------------ Demo / Auto Workflow ------------------ */
function demoCaseFill(){
  $("#cStudent").value = "محمد";
  $("#cGrade").value = "سادس (ب)";
  $("#cReason").value = "حرارة + سعال";
  $("#cPriority").value = "عاجل";
  $("#cConsent").value = "pending";
  $("#cNote").value = "تم قياس الحرارة عند دخول الطالب، ويحتاج تقييم طبي سريع.";
}

function createDemoCase(){
  openModal();
  demoCaseFill();
}

function quickDemo(){
  // Creates a case + notifies + accepts + prepares call (without forcing camera)
  const id = state.seq++;
  const c = {
    id,
    student: "محمد",
    grade: "سادس (ب)",
    reason: "حرارة مرتفعة + سعال",
    priority: "عاجل",
    status: "بانتظار الطبيب",
    consent: "pending",
    createdAt: now(),
    vitals: { hr: 112, temp: 39.1, bpS: 110, bpD: 70, spo2: 96 },
    notes: "",
    doctorDecision: "",
    plan: "إشعار ولي الأمر + تحويل للطبيب + استشارة مرئية",
    assignedDoctor: "doctor",
    parent: "parent",
  };
  state.cases.unshift(c);
  addAudit("ديمو سريع", `تم إنشاء حالة ديمو #${id}.`);
  addAlert(`حالة عاجلة #${id} بانتظار الطبيب.`, "warn");
  persist();

  selectCase(id);
  renderCasesTable();
  renderLogs();
  renderKPIs();

  toast("تم تجهيز ديمو الحالة. الآن: ادخل كـ doctor واقبلها ثم افتح الاستشارة.", "ok");
  setRoute("workflow");
}

function simulateChain(){
  if(!state.cases.length){
    toast("لا توجد حالات.", "warn"); return;
  }
  const c = state.cases[0];
  selectedCaseId = c.id;
  addAudit("سلسلة تلقائية", `بدء سلسلة إجراءات للحالة #${c.id}.`);
  addAlert("تم تسجيل فحص أولي وتحديد أولوية.", "info");
  c.status = "بانتظار الطبيب";
  persist();
  renderCasesTable(); renderLogs(); renderKPIs();
  setTimeout(()=>{
    addAlert(`تم إشعار ولي الأمر للحالة #${c.id}.`, "warn");
    addAudit("إشعار ولي الأمر", `طلب موافقة للاستشارة للحالة #${c.id}.`);
    renderLogs(); renderKPIs();
  }, 500);
  setTimeout(()=>{
    c.consent = "approved";
    addAlert(`ولي الأمر وافق للحالة #${c.id}.`, "ok");
    addAudit("موافقة ولي الأمر", `تمت الموافقة على الاستشارة للحالة #${c.id}.`);
    persist(); renderLogs(); renderKPIs();
    if(selectedCaseId===c.id) renderCaseDetails(c);
  }, 900);
  setTimeout(()=>{
    c.status = "مقبولة";
    c.plan = "استشارة مرئية 5 دقائق + توصية منزلية + متابعة";
    addAlert(`الطبيب قبل الحالة #${c.id}.`, "ok");
    addAudit("قبول طبيب", `تم قبول الحالة #${c.id} وتجهيز الاستشارة المرئية.`);
    persist(); renderCasesTable(); renderLogs(); renderKPIs();
    if(selectedCaseId===c.id) renderCaseDetails(c);
  }, 1400);
}

/* ------------------ Vitals refresh ------------------ */
function refreshVitals(){
  const c = getCase(selectedCaseId);
  if(!c){ toast("اختر حالة.", "warn"); return; }
  c.vitals = mockVitals();
  persist();
  renderVitals(c.vitals);
  addAudit("تحديث قياسات", `تم تحديث قياسات الحالة #${c.id}.`);
  renderLogs();
}

/* ------------------ Video Consult (Simulation) ------------------ */
let localStream = null;
let micEnabled = true;
let callChannel = null;
let callRole = null; // "doctor" | "parent" | "school" | "admin"
let callActive = false;

function initCallChannel(){
  if(callChannel) return;
  callChannel = new BroadcastChannel("ssc_call_channel_v1");
  callChannel.onmessage = (ev)=>{
    const msg = ev.data;
    if(!msg) return;

    if(msg.type==="invite"){
      $("#callStatus").className = "notice warn";
      $("#callStatus").textContent = `وصول دعوة اتصال من (${msg.fromRole}). اضغط تشغيل الكاميرا ثم قبول الدعوة بإرسال رد.`;
      pushCallLog(`📨 دعوة اتصال واردة من ${msg.fromRole}.`);
      // auto-respond if we already have camera
      if(localStream){
        sendCallMsg({ type:"answer", fromRole: callRole });
      }
    }

    if(msg.type==="answer"){
      $("#callStatus").className = "notice ok";
      $("#callStatus").textContent = `تم الاتصال (محاكاة) مع (${msg.fromRole}).`;
      callActive = true;
      pushCallLog(`✅ تم الرد من ${msg.fromRole}. الاتصال فعّال (محاكاة).`);
      // In a real app: attach remote stream via WebRTC
      // Here: show mirrored stream as remote if none
      if(localStream && !$("#remoteVideo").srcObject){
        $("#remoteVideo").srcObject = localStream;
      }
      state.calls++;
      persist();
      renderKPIs();
    }

    if(msg.type==="hangup"){
      $("#callStatus").className = "notice";
      $("#callStatus").textContent = "تم إنهاء الاتصال.";
      callActive = false;
      pushCallLog(`⛔ تم إنهاء الاتصال بواسطة ${msg.fromRole}.`);
      $("#remoteVideo").srcObject = null;
    }

    if(msg.type==="notes"){
      pushCallLog(`📝 تم تحديث ملاحظات: ${msg.preview}`);
    }
  };
}

function sendCallMsg(obj){
  initCallChannel();
  callChannel.postMessage(obj);
}

async function startCamera(){
  try{
    localStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    $("#localVideo").srcObject = localStream;
    $("#remoteVideo").srcObject = $("#remoteVideo").srcObject || localStream; // fallback simulation
    $("#callStatus").className = "notice ok";
    $("#callStatus").textContent = "الكاميرا تعمل. جاهز للاستشارة.";
    pushCallLog("🎥 تم تشغيل الكاميرا/المايك.");
    // if we previously got invite, respond
    sendCallMsg({ type:"answer", fromRole: callRole });
  }catch(err){
    $("#callStatus").className = "notice bad";
    $("#callStatus").textContent = "فشل تشغيل الكاميرا. تأكد من إذن المتصفح.";
    pushCallLog("⛔ فشل تشغيل الكاميرا.");
  }
}

function toggleMic(){
  if(!localStream){ toast("شغل الكاميرا أولاً.", "warn"); return; }
  micEnabled = !micEnabled;
  localStream.getAudioTracks().forEach(t => t.enabled = micEnabled);
  toast(micEnabled ? "المايك شغال." : "المايك مكتوم.", micEnabled ? "ok" : "warn");
}

function hangup(){
  if(localStream){
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  $("#localVideo").srcObject = null;
  $("#remoteVideo").srcObject = null;
  $("#callStatus").className = "notice";
  $("#callStatus").textContent = "غير متصل";
  callActive = false;
  sendCallMsg({ type:"hangup", fromRole: callRole });
  pushCallLog("📴 تم إنهاء الاستشارة.");
}

function inviteCall(){
  initCallChannel();
  sendCallMsg({ type:"invite", fromRole: callRole });
  $("#callStatus").className = "notice warn";
  $("#callStatus").textContent = "تم إرسال دعوة اتصال… افتح تبويب ثاني لتجربة الرد.";
  pushCallLog("📨 تم إرسال دعوة اتصال.");
}

function openSecondTab(){
  // Open same site in a new tab and user can login with another role
  window.open(window.location.href, "_blank");
  pushCallLog("🧩 تم فتح تبويب ثاني — سجّل بدور آخر لاختبار الدعوة.");
}

function pushCallLog(text){
  const box = $("#callLog");
  if(!box) return;
  const item = document.createElement("div");
  item.className = "item";
  item.innerHTML = `<div class="t">${escapeHTML(text)}</div><div class="m">${escapeHTML(new Date().toLocaleTimeString("ar-SA"))}</div>`;
  box.prepend(item);
}

function saveNotesToCase(){
  if(!selectedCaseId){
    toast("اختر حالة من لوحات التحكم أولاً.", "warn"); return;
  }
  const c = getCase(selectedCaseId);
  if(!c){ toast("الحالة غير موجودة.", "bad"); return; }

  const notes = $("#doctorNotes").value.trim();
  c.notes = notes;
  persist();

  addAudit("حفظ ملاحظات", `تم حفظ ملاحظات الطبيب للحالة #${c.id}.`);
  addAlert(`تم تحديث ملاحظات الحالة #${c.id}.`, "info");
  renderLogs();
  renderCaseDetails(c);

  sendCallMsg({ type:"notes", fromRole: callRole, preview: notes.slice(0,28) + (notes.length>28 ? "..." : "") });
  toast("تم حفظ الملاحظات.", "ok");
}

function quickRx(){
  const template =
`التقييم: أعراض عدوى تنفسية علوية (محاكاة).
الخطة:
- خافض حرارة حسب العمر/الوزن + سوائل.
- مراقبة الحرارة 24 ساعة.
- مراجعة فورية عند: ضيق نفس / خمول شديد / تشنج / حرارة مستمرة > 39.
متابعة: اتصال خلال 24 ساعة.`;
  $("#doctorNotes").value = template;
  toast("تم توليد توصية جاهزة (عدّلها حسب العرض).", "ok");
}

/* ------------------ Buttons State ------------------ */
function refreshActionButtons(){
  // enable/disable based on RBAC
  const map = [
    ["#btnOpenCaseModal","create_case"],
    ["#btnExport","export_data"],
    ["#btnAccept","accept_case"],
    ["#btnReject","accept_case"],
    ["#btnNotifyParent","notify_parent"],
    ["#btnStartCall","start_call"],
    ["#btnCloseCase","close_case"],
  ];
  map.forEach(([sel, feat])=>{
    const el = $(sel);
    if(!el) return;
    el.disabled = !can(feat);
    el.style.opacity = el.disabled ? .45 : 1;
    el.style.cursor = el.disabled ? "not-allowed" : "pointer";
  });

  // hint
  const hint = $("#dashHint");
  if(hint){
    if(!session.role){
      hint.className = "notice warn";
      hint.textContent = "سجّل دخولك لتفعيل لوحة الدور وتطبيق الصلاحيات.";
    }else{
      hint.className = "notice ok";
      hint.textContent = `الدور الحالي: ${session.role} — تم تطبيق الصلاحيات على الأزرار والإجراءات.`;
    }
  }
}

/* ------------------ Utilities ------------------ */
function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

function escapeHTML(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function toast(text, type="info"){
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add("show"), 10);
  setTimeout(()=> t.classList.remove("show"), 2400);
  setTimeout(()=> t.remove(), 3000);
}

/* inject toast styles quickly */
(function injectToast(){
  const css = `
  .toast{
    position:fixed; bottom:16px; right:16px;
    background: rgba(12,18,32,.92);
    border:1px solid rgba(255,255,255,.10);
    color: rgba(255,255,255,.92);
    padding:10px 12px;
    border-radius: 14px;
    transform: translateY(12px);
    opacity:0;
    transition: .25s ease;
    box-shadow: 0 18px 60px rgba(0,0,0,.45);
    z-index: 200;
    max-width: 360px;
    font-weight:800;
  }
  .toast.show{opacity:1; transform: translateY(0)}
  .toast.ok{border-color: rgba(32,201,151,.35)}
  .toast.warn{border-color: rgba(255,209,102,.35)}
  .toast.bad{border-color: rgba(255,92,122,.35)}
  `;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
})();

/* ------------------ Contact Page ------------------ */
function renderContact(){
  const url = window.location.href;
  $("#siteUrl").textContent = url;
  $("#pitchTxt").value =
`السلام عليكم،
هذا عرض MVP للعيادة المدرسية الذكية: يوضح سير العمل من تسجيل الحالة إلى استشارة مرئية (محاكاة) مع تطبيق صلاحيات (مدرسة/طبيب/ولي أمر/أدمن) وسجل تدقيق للأحداث.
الرابط: ${url}`;
}

function copyText(text){
  navigator.clipboard?.writeText(text).then(()=>{
    toast("تم النسخ.", "ok");
  }).catch(()=>{
    toast("لم يتم النسخ تلقائياً. انسخ يدوياً.", "warn");
  });
}

/* ------------------ Refresh All ------------------ */
function refreshAll(){
  renderKPIs();
  renderTimeline();
  renderLogs();
  renderRBAC();
  renderCasesTable();
  refreshActionButtons();
  renderCreds();
  renderContact();
  $("#year").textContent = new Date().getFullYear();
  // call role
  callRole = session.role || "guest";
}

/* ------------------ Bind UI Events ------------------ */
function bindUI(){
  // Home quick demo
  $("#btnQuickDemo")?.addEventListener("click", quickDemo);

  // Workflow
  $("#btnCreateCase")?.addEventListener("click", createDemoCase);
  $("#btnSimulateTriage")?.addEventListener("click", simulateChain);

  // Modal
  $("#btnOpenCaseModal")?.addEventListener("click", ()=> openModal());
  $("#btnCloseModal")?.addEventListener("click", closeModal);
  $("#caseModal")?.addEventListener("click", (e)=>{
    if(e.target.id==="caseModal") closeModal();
  });
  $("#caseForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    createCaseFromForm();
  });
  $("#btnDemoCase")?.addEventListener("click", demoCaseFill);

  // Dash actions
  $("#btnAccept")?.addEventListener("click", acceptCase);
  $("#btnReject")?.addEventListener("click", rejectCase);
  $("#btnNotifyParent")?.addEventListener("click", notifyParent);
  $("#btnStartCall")?.addEventListener("click", startCallFromCase);
  $("#btnCloseCase")?.addEventListener("click", closeCase);
  $("#btnRefreshVitals")?.addEventListener("click", refreshVitals);
  $("#btnExport")?.addEventListener("click", exportData);

  // Login
  $("#loginForm")?.addEventListener("submit", handleLogin);
  $("#btnLogout")?.addEventListener("click", logout);

  // Fill chips
  $$(".chip-btn").forEach(b=>{
    b.addEventListener("click", ()=>{
      const role = b.dataset.fill;
      $("#roleSelect").value = role;
      $("#username").value = creds[role].user;
      $("#password").value = creds[role].pass;
      setRoute("login");
    });
  });

  // Settings
  $("#btnSaveCreds")?.addEventListener("click", saveCreds);
  $("#btnRestoreCreds")?.addEventListener("click", restoreCreds);

  // Video
  $("#btnCam")?.addEventListener("click", startCamera);
  $("#btnMic")?.addEventListener("click", toggleMic);
  $("#btnHang")?.addEventListener("click", hangup);
  $("#btnCallInvite")?.addEventListener("click", inviteCall);
  $("#btnOpenSecondTab")?.addEventListener("click", openSecondTab);
  $("#btnSaveNotes")?.addEventListener("click", saveNotesToCase);
  $("#btnQuickRx")?.addEventListener("click", quickRx);

  // Contact
  $("#btnCopyUrl")?.addEventListener("click", ()=> copyText(window.location.href));
  $("#btnCopyPitch")?.addEventListener("click", ()=> copyText($("#pitchTxt").value));

  // Reset
  $("#btnReset")?.addEventListener("click", ()=>{
    if(confirm("إعادة ضبط بيانات العرض؟")){
      state = structuredClone(DEFAULT_STATE);
      creds = structuredClone(DEFAULT_CREDS);
      session = { role:null, user:null };
      persist();
      refreshSessionChip();
      toast("تمت إعادة الضبط.", "ok");
      addAudit("إعادة ضبط", "تمت إعادة ضبط بيانات العرض.");
      refreshAll();
      setRoute("home");
    }
  });
}

/* ------------------ Init ------------------ */
function init(){
  bindNav();
  bindUI();
  initCallChannel();
  refreshSessionChip();
  refreshAll();

  // default route
  setRoute("home");

  // setRoute helper buttons already exist
  window.addEventListener("hashchange", ()=>{
    const r = (location.hash || "").replace("#","").trim();
    if(r) setRoute(r);
  });

  addAudit("تشغيل النظام", "تم تشغيل MVP (Static).");
  persist();
  renderLogs();
}
/* ========= Smart School Clinic MVP (Static) =========
   Auth + Roles + Demo Data using localStorage
===================================================== */

const DB_KEY = "ssc_db_v1";
const SESSION_KEY = "ssc_session_v1";

function nowISO(){ return new Date().toISOString(); }

function seedIfNeeded(){
  const existing = localStorage.getItem(DB_KEY);
  if (existing) return;

  const db = {
    users: [
      { id:"u_school", name:"إدارة المدرسة", email:"school@demo.com", password:"1234", role:"school" },
      { id:"u_doctor", name:"د. سراج (تجريبي)", email:"doctor@demo.com", password:"1234", role:"doctor" },
      { id:"u_parent", name:"ولي أمر — أحمد", email:"parent@demo.com", password:"1234", role:"parent", studentId:"s1" },
    ],
    students: [
      { id:"s1", name:"أحمد محمد", grade:"الصف الرابع", school:"مدرسة المستقبل", parentName:"أبو أحمد", parentUserId:"u_parent" },
      { id:"s2", name:"نورة علي", grade:"الصف السادس", school:"مدرسة المستقبل", parentName:"أم نورة" },
    ],
    tickets: [
      {
        id:"t1", createdAt: nowISO(), studentId:"s1",
        createdBy:"u_school",
        symptoms:"ارتفاع حرارة + صداع",
        triage:"متوسط",
        status:"بانتظار الطبيب",
        assignedDoctorId:"u_doctor",
        parentConsent:"pending",
        notes:[ {at: nowISO(), by:"u_school", text:"تم قياس الحرارة 38.9 وإعطاء سوائل."} ]
      }
    ],
    calls: [
      { id:"c1", ticketId:"t1", startedAt:null, endedAt:null, status:"not_started", doctorId:"u_doctor", parentUserId:"u_parent" }
    ]
  };

  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function loadDB(){
  seedIfNeeded();
  return JSON.parse(localStorage.getItem(DB_KEY));
}

function saveDB(db){
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function setSession(user){
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    at: nowISO()
  }));
}

function getSession(){
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

function findUserByEmail(db, email){
  return db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
}

function $(sel){ return document.querySelector(sel); }

function setMsg(el, text, kind="ok"){
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + (kind === "ok" ? "ok" : kind === "warn" ? "warn" : "bad");
}

function go(path){
  window.location.href = path;
}

/* ======== Page Logic (index.html) ======== */
(function initHome(){
  if (!document.getElementById("loginForm")) return;

  seedIfNeeded();

  // Quick login buttons
  document.querySelectorAll("[data-login]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const role = btn.getAttribute("data-login");
      const creds = {
        school: {email:"school@demo.com", password:"1234"},
        doctor: {email:"doctor@demo.com", password:"1234"},
        parent: {email:"parent@demo.com", password:"1234"},
      }[role];
      $("input[name=email]").value = creds.email;
      $("input[name=password]").value = creds.password;
    });
  });

  $("#loginForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const db = loadDB();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    const user = findUserByEmail(db, email);
    if (!user || user.password !== password){
      return setMsg($("#loginMsg"), "بيانات الدخول غير صحيحة.", "bad");
    }
    setSession(user);
    setMsg($("#loginMsg"), "تم الدخول بنجاح. تحويل للوحة التحكم…", "ok");
    setTimeout(()=> go("./dashboards/"), 650);
  });

  $("#signupForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const db = loadDB();
    const name = e.target.name.value.trim();
    const role = e.target.role.value;
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (findUserByEmail(db, email)){
      return setMsg($("#signupMsg"), "هذا البريد موجود مسبقًا.", "bad");
    }

    const id = "u_" + Math.random().toString(16).slice(2,10);
    const newUser = { id, name, email, password, role };

    // If parent, bind to first student for demo (or create new)
    if (role === "parent"){
      // create student demo
      const sid = "s_" + Math.random().toString(16).slice(2,8);
      db.students.push({
        id: sid, name: "طالب جديد", grade:"—", school:"مدرسة المستقبل",
        parentName: name, parentUserId: id
      });
      newUser.studentId = sid;
    }

    db.users.push(newUser);
    saveDB(db);
    setMsg($("#signupMsg"), "تم إنشاء الحساب. تقدر تسجل دخول الآن.", "ok");
    e.target.reset();
  });

})();
init();
