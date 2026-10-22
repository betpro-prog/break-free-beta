const test = require('node:test');
const assert = require('node:assert/strict');
const stats = require('../analytics.js');

const now = new Date(2026,9,21,12,0,0);
const k = d => stats.dateKey(new Date(2026,9,d,12,0,0));

test('empty report does not invent zero-cigarette days or savings', () => {
  const r=stats.summarize({},20,6,30,now);
  assert.equal(r.loggedDays,0);assert.equal(r.unloggedDays,30);
  assert.equal(r.averageCigarettes,null);assert.equal(r.estimatedSavings,0);
  assert.equal(r.entries.at(-1).date,k(21));
});
test('logged zero is different from missing record', () => {
  const r=stats.summarize({[k(21)]:{cigs:0}},20,6,7,now);
  assert.equal(r.loggedDays,1); assert.equal(r.averageCigarettes,0);
  assert.equal(r.estimatedSavings,6); assert.equal(r.belowBaselineDays,1);
});
test('savings depend on baseline and are never negative', () => {
  const r=stats.summarize({[k(20)]:{cigs:25},[k(21)]:{cigs:10}},20,6,7,now);
  assert.equal(r.estimatedSavings,3); assert.equal(r.belowBaselineDays,1);
  assert.equal(r.averageCigarettes,17.5);
});
test('invalid records are excluded, including booleans and absurd values', () => {
  const days={[k(18)]:{cigs:true},[k(19)]:{cigs:101},[k(20)]:{cigs:-2},[k(21)]:{cigs:4}};
  const r=stats.summarize(days,20,6,7,now);
  assert.equal(r.loggedDays,1); assert.equal(r.averageCigarettes,4);
});
test('incomplete baseline and pack price produce no invented savings', () => {
  const days={[k(21)]:{cigs:5}};
  assert.equal(stats.summarize(days,null,6,30,now).estimatedSavings,null);
  assert.equal(stats.summarize(days,20,null,30,now).estimatedSavings,null);
});
test('30 and 90 day ranges exclude dates outside their windows', () => {
  const days={[k(21)]:{cigs:5},'2026-07-01':{cigs:10}};
  assert.equal(stats.summarize(days,20,6,30,now).loggedDays,1);
  assert.equal(stats.summarize(days,20,6,90,now).loggedDays,1);
  assert.throws(()=>stats.summarize(days,20,6,120,now),RangeError);
});
test('weekly averages ignore missing days, preserving chronological ordering', () => {
  const weeks=stats.weeklyAverages({[k(14)]:{cigs:10},[k(21)]:{cigs:0}},2,now);
  assert.equal(weeks.length,2);
  assert.equal(weeks[0].averageCigarettes,10);
  assert.equal(weeks[1].averageCigarettes,0);
  assert.equal(weeks[0].loggedDays,1);
});
test('calendar day arithmetic survives DST crossing', () => {
  const winter=new Date(2026,9,26,12,0,0);
  const result=stats.summarize({'2026-10-25':{cigs:3}},10,5,7,winter);
  assert.equal(result.loggedDays,1);
  assert.equal(result.entries.at(-1).date,'2026-10-26');
});

test('CSV export keeps unlogged days blank and quotes no personal data', () => {
  const csv=stats.toCsv({[k(21)]:{cigs:0}},7,now);
  assert.ok(csv.startsWith('\uFEFFdate,cigarettes\r\n'));
  assert.ok(csv.includes('2026-10-20,\r\n'));
  assert.ok(csv.includes('2026-10-21,0\r\n'));
  assert.equal(csv.trim().split('\n').length,8);
});
