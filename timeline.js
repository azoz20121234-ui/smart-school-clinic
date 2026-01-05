import { state } from "./state.js";

export function addEvent(title, meta={}){
  state.timeline.unshift({
    time: new Date().toLocaleTimeString("ar-SA"),
    title,
    meta
  });
}
