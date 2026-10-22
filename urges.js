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

  const LABELS={"hr":["Dnevnik želje za cigaretom","Što je potaknulo želju?","Okidač","Jačina želje (1–5)","Spremi unos","Stres","Kava","Nakon jela","Dosada","Ostalo","U zadnjih 7 dana","Prosječna jačina","Najčešći okidač","Još nema unosa.","Zadnja zabilježena želja","Obriši zadnji unos","Zabilježeno. Pokušaj prvo s kratkom pauzom disanja.","Unos obrisan.","Ovaj dnevnik ostaje na uređaju i u tvojoj JSON sigurnosnoj kopiji.","Zabilježi želju"],"en":["Craving diary","What triggered the urge?","Trigger","Intensity (1–5)","Save entry","Stress","Coffee","After a meal","Boredom","Other","Last 7 days","Average intensity","Most common trigger","No entries yet.","Most recent urge","Delete last entry","Recorded. Try a breathing pause before deciding what to do.","Entry deleted.","The diary stays on your device and in your JSON backup.","Log an urge"],"de":["Verlangen-Tagebuch","Was hat das Verlangen ausgelöst?","Auslöser","Stärke (1–5)","Speichern","Stress","Kaffee","Nach dem Essen","Langeweile","Andere","Letzte 7 Tage","Durchschnitt","Häufigster Auslöser","Noch keine Einträge.","Letzter Eintrag","Letzten löschen","Gespeichert. Versuche eine Atempause.","Eintrag gelöscht.","Daten bleiben auf dem Gerät und im JSON-Backup.","Verlangen notieren"],"es":["Diario de antojos","¿Qué provocó las ganas?","Motivo","Intensidad (1–5)","Guardar","Estrés","Café","Después de comer","Aburrimiento","Otro","Últimos 7 días","Media","Más frecuente","Sin registros.","Último registro","Eliminar último","Guardado. Prueba una pausa para respirar.","Registro eliminado.","Datos locales y copia JSON.","Registrar antojo"],"it":["Diario del desiderio","Che cosa ha provocato il desiderio?","Motivo","Intensità (1–5)","Salva","Stress","Caffè","Dopo un pasto","Noia","Altro","Ultimi 7 giorni","Media","Motivo frequente","Nessun dato.","Ultima registrazione","Elimina ultima","Salvato. Prova una pausa di respirazione.","Registrazione eliminata.","Dati locali e backup JSON.","Registra desiderio"],"fr":["Journal des envies","Qu'est-ce qui a déclenché l'envie ?","Déclencheur","Intensité (1–5)","Enregistrer","Stress","Café","Après un repas","Ennui","Autre","7 derniers jours","Moyenne","Plus fréquent","Aucune entrée.","Dernière envie","Supprimer la dernière","Enregistré. Essayez une pause respiratoire.","Entrée supprimée.","Données locales et sauvegarde JSON.","Noter une envie"],"pt":["Diário da vontade","O que causou a vontade?","Motivo","Intensidade (1–5)","Guardar","Stress","Café","Depois de comer","Tédio","Outro","Últimos 7 dias","Média","Mais comum","Sem registos.","Último registo","Apagar último","Guardado. Faça uma pausa para respirar.","Registo apagado.","Dados locais e cópia JSON.","Registar vontade"],"pl":["Dziennik chęci zapalenia","Co wywołało chęć?","Powód","Siła (1–5)","Zapisz","Stres","Kawa","Po posiłku","Nuda","Inne","Ostatnie 7 dni","Średnia","Najczęstszy powód","Brak wpisów.","Ostatni wpis","Usuń ostatni","Zapisano. Spróbuj przerwy na oddech.","Usunięto wpis.","Dane lokalne oraz kopia JSON.","Zapisz chęć"]};
  function languageLabels(language){return LABELS[language]||LABELS.en;}
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function renderPanel(entries,language){
    const l=languageLabels(language);
    const list=sanitize(entries,365);
    const summary=summarize(list,7);
    const names=Object.fromEntries(TRIGGERS.map((key,i)=>[key,l[5+i]]));
    const recent=list.length?list[list.length-1]:null;
    const average=summary.averageIntensity===null?'—':
      new Intl.NumberFormat(LABELS[language]?language:'en',{maximumFractionDigits:1}).format(summary.averageIntensity);
    return '<section class="card" id="bf-urge-panel" style="margin-top:18px"><h2 class="feature-title">🧭 '+esc(l[0])+'</h2>'+
      '<p class="muted">'+esc(l[1])+'</p>'+
      '<form id="urge-form" class="input-row"><div class="input-wrap"><label for="urge-trigger">'+esc(l[2])+'</label>'+
      '<select id="urge-trigger" required style="width:100%;padding:12px;border-radius:12px;background:var(--surface2);color:var(--text);border:1px solid var(--line)">'+TRIGGERS.map((key,i)=>'<option value="'+key+'">'+esc(l[5+i])+'</option>').join('')+'</select></div>'+
      '<div class="input-wrap"><label for="urge-intensity">'+esc(l[3])+'</label><select id="urge-intensity" required style="width:100%;padding:12px;border-radius:12px;background:var(--surface2);color:var(--text);border:1px solid var(--line)">'+
      [1,2,3,4,5].map(n=>'<option value="'+n+'" '+(n===3?'selected':'')+'>'+n+' / 5</option>').join('')+'</select></div>'+
      '<div class="full"><button type="submit" class="btn small">'+esc(l[4])+'</button></div></form>'+
      '<p class="kicker">'+esc(l[10])+': <strong>'+summary.count+'</strong> · '+esc(l[11])+': <strong>'+average+'</strong> · '+esc(l[12])+': <strong>'+(summary.topTrigger?esc(names[summary.topTrigger]):'—')+'</strong></p>'+
      (recent?'<p class="fineprint">'+esc(l[14])+': '+esc(recent.day)+' · '+esc(names[recent.trigger])+' · '+recent.intensity+'/5</p><button type="button" class="btn small soft" data-action="urge-delete">'+esc(l[15])+'</button>':'<p class="fineprint">'+esc(l[13])+'</p>')+
      '<p class="fineprint">'+esc(l[18])+'</p></section>';
  }
  const api=Object.freeze({TRIGGERS,sanitize,todayKey,summarize,languageLabels,renderPanel});
  if(typeof module==='object' && module.exports)module.exports=api;
  root.BF_Urges=api;
})(typeof window!=='undefined'?window:globalThis);
