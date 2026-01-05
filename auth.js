import { loadDB, saveDB } from "./storage.js";

export function getSession(){
  const db = loadDB();
  return db.session;
}

export function requireRole(roles){
  const db = loadDB();
  const s = db.session;
  if(!s || !roles.includes(s.role)){
    window.location.href = "index.html";
    return null;
  }
  return s;
}

export function login(username, password){
  const db = loadDB();
  const user = db.users.find(u=>u.username===username && u.password===password);
  if(!user) return {ok:false, msg:"بيانات الدخول غير صحيحة"};

  db.session = {
    username: user.username,
    role: user.role,
    display: user.display,
    at: new Date().toISOString()
  };
  saveDB(db);
  return {ok:true, session: db.session};
}

export function logout(){
  const db = loadDB();
  db.session = null;
  saveDB(db);
  window.location.href = "index.html";
}
