
export function toast(msg){
  let el = document.getElementById("toast");
  if(!el){
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=> el.classList.remove("show"), 2600);
}

export function fmtTime(iso){
  try{
    return new Date(iso).toLocaleTimeString("ar-SA");
  } catch { return "--"; }
}

export function pillClass(level){
  if(level==="أحمر") return "pill red";
  if(level==="برتقالي") return "pill orange";
  if(level==="أصفر") return "pill yellow";
  return "pill green";
}

export function timelineClass(level){
  if(level==="أحمر") return "red";
  if(level==="برتقالي") return "orange";
  if(level==="أصفر") return "yellow";
  return "";
}
