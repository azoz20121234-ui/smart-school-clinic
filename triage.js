export function triageCase(v,c=""){
  let level="أخضر";
  if(v.spo2<93||/إغماء|ضيق/.test(c)) level="أحمر";
  else if(v.temp>38.5) level="برتقالي";
  return {level,note:`الفرز الأولي: ${level}`};
}
