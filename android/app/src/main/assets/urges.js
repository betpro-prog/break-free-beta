/* BREAK FREE craving check-ins. Local-only, no remote transport. */
(function(root){
  'use strict';
  const TRIGGERS=Object.freeze(['stress','coffee','meal','boredom','other']);
  const isDay=s=>typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
    && !Number.isNaN(new Date(s+'T12:00:00').valueOf());
  function sanitize(entries,limit=365) {
    if(!Array.isArray(entries))return [];
    const result=[];
    for(const item of entries.slice(-Math.max(1,Math.min(1000,limit)))){
      if(item && isDay(item.day) && TRIGGERS.includes(item.trigger) &&
          Number.isInteger(item.intensity) && item.intensity>=1 && item.intensity<=5){
        result.push({day:item.day,trigger:item.trigger,intensity:item.intensity});
      }
    }
    return result;
  }
  function todayKey(now=new Date()){
    return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  }
  function sinceDays(now,days){
    const d=new Date(now.getTime());d.setHours(12,0,0,0);d.setDate(d.getDate()-(days-1));return todayKey(d);
  }
  function summarize(entries,length=7,reference=new Date()){
    if(![7,30,90].includes(length))throw new RangeError('Invalid period');
    const end=todayKey(reference);
    const start=sinceDays(reference,length);
    const filtered=sanitize(entries,1000).filter(x=>x.day>=start && x.day<=end);
    const counts=Object.fromEntries(TRIGGERS.map(x=>[x,0]));
    let sum=0;
    for(const e of filtered){counts[e.trigger]++;sum+=e.intensity;}
    const top=TRIGGERS.reduce((acc,x)=>counts[x]>counts[acc]?x:acc,'stress');
    return {count:filtered.length,averageIntensity:filtered.length?sum/filtered.length:null,
      topTrigger:filtered.length?top:null,counts};
  }
  const api=Object.freeze({TRIGGERS,sanitize,todayKey,summarize});
  if(typeof module==='object' && module.exports)module.exports=api;
  root.BF_Urges=api;
})(typeof window!=='undefined'?window:globalThis);
