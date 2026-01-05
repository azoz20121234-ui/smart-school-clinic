const KEY = "ssc_platform_v1";

function nowISO(){ return new Date().toISOString(); }

export function loadDB(){
  const raw = localStorage.getItem(KEY);
  if(raw){
    try{ return JSON.parse(raw); } catch(e){}
  }
  const db = {
    version: 1,
    users: [
      {username:"student", password:"1234", role:"student", display:"طالب (تجريبي)"},
      {username:"doctor",  password:"1234", role:"doctor",  display:"طبيب (تجريبي)"},
      {username:"parent",  password:"1234", role:"parent",  display:"ولي أمر (تجريبي)"},
      {username:"admin",   password:"1234", role:"admin",   display:"إدارة النظام"}
    ],
    session: null,
    cases: [],
    events: []
  };
  saveDB(db);
  return db;
}

export function saveDB(db){
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function resetDB(){
  localStorage.removeItem(KEY);
  return loadDB();
}

export function addEvent(db, title, meta={}){
  db.events.unshift({
    id: "EVT-" + Math.random().toString(16).slice(2),
    at: nowISO(),
    title,
    meta
  });
  saveDB(db);
}

export function addCase(db, caseObj){
  db.cases.unshift(caseObj);
  saveDB(db);
}

export function updateCase(db, id, patch){
  const i = db.cases.findIndex(c=>c.id===id);
  if(i>=0){
    db.cases[i] = {...db.cases[i], ...patch, updatedAt: nowISO()};
    saveDB(db);
  }
}

export function getCase(db, id){
  return db.cases.find(c=>c.id===id) || null;
}

export function getLatestCase(db){
  return db.cases[0] || null;
}
