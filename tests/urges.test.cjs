const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const U=require('../urges.js');

const date='2026-10-22';
const now=new Date(2026,9,22,12,0,0);

test('keeps validated cravings local and drops malformed entries',()=>{
  const entries=[{day:date,trigger:'coffee',intensity:2},
    {day:date,trigger:'cigarette',intensity:4},
    {day:date,trigger:'stress',intensity:0},
    {day:date,trigger:'other',intensity:7},
    {day:date,trigger:'meal',intensity:5}];
  assert.deepEqual(U.sanitize(entries),[entries[0],entries[4]]);
  assert.deepEqual(U.sanitize(null),[]);
});
test('caps local diary to 365 entries',()=>{
  const entries=Array.from({length:400},(_,i)=>({day:date,trigger:'other',intensity:3}));
  assert.equal(U.sanitize(entries,365).length,365);
  assert.equal(U.sanitize(entries).length,365);
});
test('7-day summary counts logs, not missing days',()=>{
  const entries=[
    {day:'2026-10-20',trigger:'coffee',intensity:2},
    {day:'2026-10-22',trigger:'stress',intensity:4},
    {day:'2026-10-01',trigger:'meal',intensity:5},
    {day:'2026-10-23',trigger:'boredom',intensity:4}];
  const r=U.summarize(entries,7,now);
  assert.equal(r.count,2);
  assert.equal(r.averageIntensity,3);
  assert.equal(r.topTrigger,'stress');
  assert.equal(r.counts.stress,1);
  assert.equal(r.counts.coffee,1);
  assert.equal(r.counts.meal,0);
});
test('empty craving history does not invent health progress',()=>{
  const r=U.summarize([],30,now);
  assert.equal(r.count,0);assert.equal(r.averageIntensity,null);assert.equal(r.topTrigger,null);
});
test('all eight language panels have labels and do not display user-supplied HTML',()=>{
  for(const lang of ['hr','en','de','es','it','fr','pt','pl']){
    assert.equal(U.languageLabels(lang).length,20);
    const html=U.renderPanel([{day:date,trigger:'coffee',intensity:2}],lang);
    assert.match(html,/id="urge-form"/);
    assert.match(html,/id="urge-trigger"/);
    assert.match(html,/id="urge-intensity"/);
    assert.match(html,/data-action="urge-delete"/);
  }
  assert.equal(U.languageLabels('xx')[0],U.languageLabels('en')[0]);
});
test('browser source and Android bundle both preserve diary backups',()=>{
  for(const file of ['index.html','android/app/src/main/assets/index.html']){
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/<script src="\.\/urges\.js"><\/script>/);
    assert.match(html,/function saveUrge\(form\)/);
    assert.match(html,/id==='urge-form'/);
    assert.match(html,/urges:window\.BF_Urges\?window\.BF_Urges\.sanitize\(parsed\.urges,365\)/);
    assert.match(html,/data\.urges=window\.BF_Urges\?window\.BF_Urges\.sanitize\(data\.urges,365\)/);
    // Extract inline scripts without executing browser-only code.
    for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
      if(m[1].trim()) assert.doesNotThrow(()=>new vm.Script(m[1],{filename:file}));
    }
  }
});
