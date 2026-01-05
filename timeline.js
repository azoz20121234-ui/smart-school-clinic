import { state } from "./state.js";
export function addEvent(title){
  state.timeline.unshift({time:new Date().toLocaleTimeString("ar-SA"),title});
}
