/* BREAK FREE analytics: browser/Node, no network or personal-data upload. */
(function (root) {
  'use strict';
  const MAX_CIGS = 100;
  function dateKey(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2,'0') + '-' +
      String(date.getDate()).padStart(2,'0');
  }
  function dateAt(reference, offset) {
    const d = new Date(reference.getTime());
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return dateKey(d);
  }
  function readCount(days, key) {
    if (!days || typeof days !== 'object' || !Object.prototype.hasOwnProperty.call(days,key)) return null;
    const record = days[key];
    const n = record && record.cigs;
    return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= MAX_CIGS ? n : null;
  }
  function summarize(days, baseline, packPrice, length, reference) {
    if (![7,30,90].includes(length)) throw new RangeError('Unsupported report range');
    const now = reference instanceof Date && !Number.isNaN(reference.valueOf()) ?
      reference : new Date();
    const baselineValid = typeof baseline === 'number' && Number.isFinite(baseline) && baseline > 0 && baseline <= MAX_CIGS;
    const priceValid = typeof packPrice === 'number' && Number.isFinite(packPrice) && packPrice > 0 && packPrice <= 100;
    let loggedDays = 0, total = 0, goalDays = 0, savings = 0;
    const entries = [];
    for (let offset = -(length-1); offset <= 0; offset++) {
      const date = dateAt(now, offset);
      const cigarettes = readCount(days, date);
      entries.push({ date, cigarettes });
      if (cigarettes === null) continue;
      loggedDays++;
      total += cigarettes;
      if (baselineValid && cigarettes < baseline) goalDays++;
      if (baselineValid && priceValid) savings += Math.max(0, baseline-cigarettes)*packPrice/20;
    }
    return {
      period: length,
      loggedDays,
      unloggedDays: length - loggedDays,
      totalCigarettes: total,
      averageCigarettes: loggedDays ? total/loggedDays : null,
      belowBaselineDays: baselineValid ? goalDays : null,
      estimatedSavings: baselineValid && priceValid ? Math.round(savings*100)/100 : null,
      entries
    };
  }
  function weeklyAverages(days, count, reference) {
    if (!Number.isInteger(count) || count < 1 || count > 13) throw new RangeError('Invalid week count');
    const now = reference instanceof Date && !Number.isNaN(reference.valueOf()) ?
      reference : new Date();
    const results = [];
    // Exactly 7 days per bucket, with the last bucket ending today.
    for (let week=0; week<count; week++) {
      const firstOffset = -((count-week)*7-1);
      let n = 0, total = 0;
      for (let d=0; d<7; d++) {
        const cigarettes = readCount(days,dateAt(now,firstOffset+d));
        if (cigarettes !== null) {n++; total+=cigarettes;}
      }
      results.push({
        label: dateAt(now,firstOffset),
        loggedDays: n,
        averageCigarettes: n ? total/n : null
      });
    }
    return results;
  }
  function toCsv(days, length, reference) {
    const r = summarize(days, null, null, length, reference);
    const rows = ['date,cigarettes'];
    for (const entry of r.entries) {
      rows.push(entry.date + ',' + (entry.cigarettes === null ? '' : entry.cigarettes));
    }
    return '\uFEFF' + rows.join('\r\n') + '\r\n';
  }
  const api = Object.freeze({summarize, weeklyAverages, dateKey, toCsv});
  if (typeof module === 'object' && module.exports) module.exports=api;
  root.BF_Analytics = api;
})(typeof window !== 'undefined' ? window : globalThis);
