import { state } from "./state.js";

let iv;
export function startVitals(cb){
  clearInterval(iv);
  let t=36.8,h=78,s=98;
  iv=setInterval(()=>{
    t+=(Math.random()-0.5)*0.2;
    h+=(Math.random()-0.5)*3;
    s+=(Math.random()-0.5);
    state.vitals={temp:t.toFixed(1),hr:Math.round(h),spo2:Math.round(s)};
    cb(state.vitals);
  },800);
}
export function stopVitals(){clearInterval(iv);}
