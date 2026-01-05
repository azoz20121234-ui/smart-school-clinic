import { state } from "./state.js";

let interval;

export function startVitals(onUpdate){
  clearInterval(interval);
  let temp = 36.7, hr = 78, spo2 = 98;

  interval = setInterval(()=>{
    temp += (Math.random()-0.5)*0.15;
    hr   += (Math.random()-0.5)*2;
    spo2 += (Math.random()-0.5)*0.5;

    state.vitals = {
      temp: temp.toFixed(1),
      hr: Math.round(hr),
      spo2: Math.round(spo2)
    };

    onUpdate(state.vitals);
  }, 700);
}

export function stopVitals(){
  clearInterval(interval);
}
