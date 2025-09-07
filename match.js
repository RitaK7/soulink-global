/* Soulink · Match page polish — keeps your data & rendering logic intact */
(() => {
  // tiny helpers
  const $ = s => document.querySelector(s);
  const READ = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const LS_ME = 'soulQuiz';
  const LS_FRIENDS = 'friends';
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const normList = v => Array.isArray(v) ? v.filter(Boolean)
                      : (typeof v === 'string' ? v.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean) : []);

  // icons
  const hobbyIco = t => {
    const s=(t||'').toLowerCase();
    if(s.includes('music'))return'🎵'; if(s.includes('read'))return'📚';
    if(s.includes('medit'))return'🧘'; if(s.includes('travel'))return'✈️';
    if(s.includes('cook'))return'🍳'; if(s.includes('art'))return'🎨';
    if(s.includes('dance'))return'💃'; if(s.includes('garden'))return'🌿';
    return '✨';
  };
  const valueIco = t => {
    const s=(t||'').toLowerCase();
    if(s.includes('honest'))return'💎'; if(s.includes('kind'))return'❤️';
    if(s.includes('loyal'))return'🛡️'; if(s.includes('freedom'))return'🌞';
    if(s.includes('growth')||s.includes('adventure'))return'🌱';
    return '⭐';
  };

  // jaccard
  function jaccard(a,b){
    const A=new Set(normList(a).map(x=>x.toLowerCase()));
    const B=new Set(normList(b).map(x=>x.toLowerCase()));
    if(!A.size && !B.size) return 0;
    let inter=0; A.forEach(x=>{ if(B.has(x)) inter++; });
    return inter/(A.size+B.size-inter);
  }

  // data
  function me(){
    const m = READ(LS_ME) || {};
    return {
      name: m.name || '',
      ct:   m.connectionType || m.ct || '',
      ll:   (Array.isArray(m.loveLanguages)? m.loveLanguages[0] : (m.loveLanguage||'')),
      hobbies: m.hobbies || [],
      values:  m.values || [],
    };
  }
  function friends(){
    const list = READ(LS_FRIENDS);
    return Array.isArray(list) ? list : [];
  }

  // scoring
  function llMatch(a,b){ if(!a||!b) return 0; return a.trim().toLowerCase()===b.trim().toLowerCase()?1:0; }
  function ctMatch(desired,candidate){
    if(!desired||desired==='Any') return 1;
    if(!candidate) return 0;
    if(candidate==='Both' || desired==='Both') return 1;
    return desired.toLowerCase()===candidate.toLowerCase()?1:0;
  }
  /* 25*LL*W + 15*CT + 30*Jaccard(hobbies) + 30*Jaccard(values) */
  function score(me,f,w=1){
    const sLL=25*llMatch(me.ll,f.ll)*w;
    const sCT=15*ctMatch(me.ct,f.ct);
    const sH =30*jaccard(me.hobbies,f.hobbies);
    const sV =30*jaccard(me.values,f.values);
    let total=sLL+sCT+sH+sV;

    // soften if candidate lacks info
    const info=(f.ll?1:0)+(normList(f.hobbies).length?1:0)+(normList(f.values).length?1:0);
    if(info<=1) total*=0.8;

    return Math.max(0,Math.min(100,Math.round(total)));
  }

  // ring badge (SVG)
  function ringSVG(pct=0){
    const CIRC=2*Math.PI*32;
    const off =CIRC*(1-Math.max(0,Math.min(1,pct/100)));
    return `
      <div class="score-ring" title="Compatibility">
        <svg viewBox="0 0 76 76" aria-hidden="true">
          <circle class="ring-track" cx="38" cy="38" r="32"></circle>
          <circle class="ring-prog"  cx="38" cy="38" r="32" stroke-dasharray="${CIRC}" stroke-dashoffset="${off}"></circle>
        </svg>
        <div class="score-num">${pct}<small>%</small></div>
      </div>`;
  }

  // small helpers for the body of cards
  const digits = s => String(s||'').replace(/\D/g,'');
  function avatarFor(name, photo){
    if(photo) return photo;
    const t = (name||'?').trim().charAt(0).toUpperCase() || '?';
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
         <rect width='100%' height='100%' rx='40' fill='#0a6a6f'/>
         <text x='50%' y='54%' text-anchor='middle' font-size='36' fill='#bff' font-family='sans-serif'>${t}</text>
       </svg>`);
    return 'data:image/svg+xml;utf8,'+svg;
  }

  function listChips(title, list, iconFn){
    const arr = normList(list);
    if(!arr.length) return '';
    const chips = arr.slice(0,12).map(v=>`<span class="chip"><span class="ico">${iconFn(v)}</span><span>${escapeHTML(v)}</span></span>`).join('');
    return `<div class="row" style="margin-top:.25rem"><b>${title}:</b> ${chips}</div>`;
  }

  function messageLinkHTML(f){
    if(f.whatsapp && digits(f.whatsapp)) return `<a class="btn" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">Message</a>`;
    if(f.instagram){
      const u=/^https?:\/\//i.test(f.instagram)?f.instagram:`https://instagram.com/${f.instagram.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if(f.facebook){
      const u=/^https?:\/\//i.test(f.facebook)?f.facebook:`https://facebook.com/${f.facebook}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if(f.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return `<a class="btn" href="mailto:${f.email}">Message</a>`;
    return `<a class="btn" href="friends.html">Message</a>`;
  }
  const compareLinkHTML = f => `<a class="btn" href="friends.html">Compare →</a>`;
  const socialIconsHTML = f => ''; // (kept empty per your last design)

  // main render (keeps your semantics/IDs)
  const resultsEl = $('#results') || $('.cards');
  const emptyEl   = $('#empty');

  function render(){
    const m = me();
    $('#me-ct')     && ($('#me-ct').textContent = m.ct || '–');
    $('#me-ll')     && ($('#me-ll').textContent = m.ll || '–');
    $('#me-hobbies')&& ($('#me-hobbies').textContent = normList(m.hobbies).join(', ') || '–');
    $('#me-values') && ($('#me-values').textContent  = normList(m.values).join(', ')  || '–');

    const list=friends();
    if(!list.length){ if(resultsEl) resultsEl.innerHTML=''; if(emptyEl) emptyEl.style.display='block'; return; }

    const q         = ($('#f-search')?.value||'').trim().toLowerCase();
    const desiredCT = $('#f-ct')?.value || '';
    const minScore  = parseInt($('#f-min')?.value||'0',10) || 0;
    const weightLL  = parseFloat($('#f-llw')?.value||'1') || 1;

    let rows = list.map(f=>({f,s:score(m,f,weightLL)}));

    if(q){
      rows = rows.filter(({f})=>{
        const hay=[
          f.name,f.ct,f.ll,f.contact,f.notes,f.whatsapp,f.instagram,f.facebook,f.email,
          ...(Array.isArray(f.hobbies)?f.hobbies:[String(f.hobbies||'')]),
          ...(Array.isArray(f.values)?f.values:[String(f.values||'')]),
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    rows = rows.filter(({f,s}) => ctMatch(desiredCT||'Any',f.ct) && s>=minScore);
    rows.sort((a,b)=> b.s - a.s || String(a.f.name||'').localeCompare(String(b.f.name||'')));

    if(!resultsEl) return;
    resultsEl.innerHTML='';
    if(!rows.length){ emptyEl && (emptyEl.style.display='block'); return; }
    emptyEl && (emptyEl.style.display='none');

    rows.forEach(({f,s})=>{
      const hobbies = normList(f.hobbies);
      const values  = normList(f.values);
      const cls = s>=75?'good':s>=55?'ok':'low';

      const card=document.createElement('div');
      card.className='match-card';
      card.innerHTML=`
      // expose connection for filtering (friendship | romantic | both)
      card.dataset.connection = (String(f.ct || 'both').toLowerCase().includes('romantic')
      ? 'romantic'
     : String(f.ct || 'both').toLowerCase().includes('friend') ? 'friendship' : 'both');

        <div class="head">
          <div class="meta">
            <img class="avatar" src="${avatarFor(f.name,f.photo)}" alt="">
            <div style="min-width:0;">
              <div class="name">${escapeHTML(f.name||'—')}</div>
              <div class="hint">${escapeHTML(f.ct||'—')} · ${escapeHTML(f.ll||'—')}</div>
            </div>
          </div>
          ${ringSVG(s)}
        </div>

        ${socialIconsHTML(f)}

        ${listChips('Hobbies', hobbies, hobbyIco)}
        ${listChips('Values',  values,  valueIco)}

        ${f.contact ? `<div style="margin-top:.4rem"><b>Contact:</b> ${escapeHTML(f.contact)}</div>` : ''}
        ${f.notes    ? `<div style="margin-top:.2rem"><i>${escapeHTML(f.notes)}</i></div>` : ''}

        <div class="row" style="margin-top:.6rem">
          <a class="btn" href="friends.html">Edit in Friends</a>
          ${messageLinkHTML(f)}
          ${compareLinkHTML(f)}
        </div>
      `;
      card.querySelector('.score-num')?.classList.add(cls);
      resultsEl.appendChild(card);
    });

    // after rendering, nuke any stray dot rows (see below)
    hideStrayDots();
  }
(function enableTagCollapses(){
  // ieškome kelių galimų selektorių – nekeisdami tavo ID/klasių
  const candidates = document.querySelectorAll(
    '[data-collapsible-tags], .match-card .tags, .card.match .tags, .candidate-card .tags'
  );
  candidates.forEach(box => {
    // jei jau turi data-atributą – paliekam; kitaip dedam tik jei aiškiai peraukšta
    if (!box.hasAttribute('data-collapsible-tags')) {
      const tooTall = box.scrollHeight > box.clientHeight + 8 || box.scrollHeight > 88;
      if (!tooTall) return; // nieko nedarom
      box.setAttribute('data-collapsible-tags','');
    }

    // jeigu užtenka vietos – nereikia jungiklio
    if (box.scrollHeight <= (parseInt(getComputedStyle(box).getPropertyValue('--clamp')) || 72) + 4) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tags-toggle';
    const update = () => {
      const expanded = box.classList.toggle('expanded', box.classList.contains('expanded'));
      btn.textContent = box.classList.contains('expanded') ? 'Show less' : 'Show more';
    };
    // pirmas state
    btn.textContent = 'Show more';
    btn.addEventListener('click', () => {
      box.classList.toggle('expanded');
      btn.textContent = box.classList.contains('expanded') ? 'Show less' : 'Show more';
    });
    box.after(btn);
  });
})();

// Pastaba: jei tavo žymių konteineriai turi kitą klasę, tiesiog pridėk jiems
// data-collapsible-tags atributą HTML pusėje – nieko kito keisti nereikės.
  // ===== remove black corner dots (robust, scoped to match cards) =====
  function looksLikeDot(el){
    const txtEmpty=!el.textContent.trim();
    const cs=getComputedStyle(el);
    const r=el.getBoundingClientRect(), w=r.width, h=r.height;
    const small=w>6&&w<=20&&h>6&&h<=20;
    const roundish=(parseFloat(cs.borderRadius||'0')>=Math.min(w,h)*0.45)||(cs.borderRadius&&cs.borderRadius.endsWith('%'));
    return txtEmpty&&small&&roundish;
  }
  function hideStrayDots(){
    const root = resultsEl || document.body;
    if(!root) return;
    root.querySelectorAll('.match-card').forEach(card=>{
    card.querySelectorAll(':scope *').forEach(node=>{
      const kids = [...node.children];
      if(kids.length>=3 && kids.length<=8 && kids.every(looksLikeDot)){
        node.style.display='none';
      }
    });
  });
}


  // wire filters (live labels if you use them)
  (function liveLabels(){
    const r=document.getElementById('f-min'), lab=document.getElementById('minLabel');
    if(r&&lab){ const upd=()=>lab.textContent=r.value+'%'; upd(); r.addEventListener('input',upd); }
    const w=document.getElementById('f-llw'), wlab=document.getElementById('llw-label');
    if(w&&wlab){ const upd=()=>wlab.textContent=(+w.value).toFixed(1)+'×'; upd(); w.addEventListener('input',upd); }
  })();

  // initial + react to DOM changes
  document.addEventListener('DOMContentLoaded', render);
  const moTarget = resultsEl || document.body;
  new MutationObserver(hideStrayDots).observe(moTarget,{childList:true,subtree:true});
})();
// --- Soulink: connection filter toggle (non-breaking) ---
// --- Soulink: connection filter toggle (non-breaking) ---
(function connectToggle(){
  const btnFriend = document.querySelector('[data-conn="friend"]');
  const btnRom    = document.querySelector('[data-conn="romance"]');
  const snapshotConn = document.querySelector('#snapshot-connection');

  const pref = JSON.parse(localStorage.getItem('soulPref') || '{}');
  let connectionType = (pref.connectionType || 'both').toLowerCase(); // 'both' | 'friendship' | 'romantic'

  function persist(type){
    connectionType = type;
    pref.connectionType = type;
    localStorage.setItem('soulPref', JSON.stringify(pref));
  }

  function paint(){
    btnFriend?.classList.toggle('is-active', connectionType === 'friendship');
    btnRom?.classList.toggle('is-active',    connectionType === 'romantic');
    if (snapshotConn) snapshotConn.textContent = connectionType;
  }
  // leisk renderyje pasiimti būseną, jei prireiks
  window.getConnectionType = () => connectionType;

  function refresh(){

    if (typeof window.renderMatches === 'function')      window.renderMatches();
    else if (typeof window.render === 'function')        window.render();
    else                                                 window.dispatchEvent(new CustomEvent('soulink:refresh'));
  }


  function setConnection(type){
    persist(type);
    paint();
    refresh();
  }


  btnFriend?.addEventListener('click', () => {
    setConnection(connectionType === 'friendship' ? 'both' : 'friendship');
  });
  btnRom?.addEventListener('click', () => {
    setConnection(connectionType === 'romantic' ? 'both' : 'romantic');
  });

  // init
  setConnection(connectionType);
})();


/* =========================================================
   Soulink · Match — non-breaking UI helpers
   (keeps your existing data/filter logic intact)
   ========================================================= */
(function(){
  const qs = (s, r=document)=>r.querySelector(s);
  const qsa = (s, r=document)=>Array.from(r.querySelectorAll(s));

  // 1) Remove stray dots (if any were injected by old markup)
  function nukeDots(scope=document){
    qsa('.corner-dot,.dot,.mini-dots,.dots,.chem-dots', scope).forEach(n=>n.style.display='none');
    qsa('ul,li', scope).forEach(n=> n.style.listStyle='none');
  }

  // 2) Teal active nav (in case header markup differs)
  (function setActiveNav(){
    qsa('.navbar .nav-links a, .topnav a').forEach(a=>{
      const href=(a.getAttribute('href')||'').toLowerCase();
      if(href.endsWith('match.html')) a.setAttribute('aria-current','page');
    });
  })();

  // 3) Score rings — convert any [data-score] badge into a glowing ring (idempotent)
  function injectRing(el){
    if(!el || el.__ringified) return;
    const raw = el.getAttribute('data-score') || el.textContent || '0';
    const val = Math.max(0, Math.min(100, parseInt(raw,10)||0));
    el.innerHTML = ''; el.classList.add('score-ring');
    const size = 64, r = 26, c = 2*Math.PI*r, off = c*(1 - val/100);
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 64 64');
    const track = document.createElementNS(svg.namespaceURI,'circle');
    track.setAttribute('class','ring-track'); track.setAttribute('cx','32'); track.setAttribute('cy','32'); track.setAttribute('r',String(r));
    const prog = document.createElementNS(svg.namespaceURI,'circle');
    prog.setAttribute('class','ring-prog'); prog.setAttribute('cx','32'); prog.setAttribute('cy','32'); prog.setAttribute('r',String(r));
    prog.style.transform='rotate(-90deg)'; prog.style.transformOrigin='32px 32px';
    prog.style.strokeDasharray = String(c); prog.style.strokeDashoffset = String(off);
    svg.appendChild(track); svg.appendChild(prog);
    const num = document.createElement('div');
    num.className = 'score-num ' + (val>=20 ? (val>=40 ? 'good':'ok') : 'low');
    num.textContent = val + '%';
    el.appendChild(svg); el.appendChild(num);
    el.__ringified = true;
  }
  function ringifyAll(scope=document){
    qsa('.match-card [data-score], .match-card .score', scope).forEach(injectRing);
  }

  // 4) Observe the results container so we enhance after your renderer updates
  const results = qs('#results');
  if(results){
    const obs = new MutationObserver(()=>{ nukeDots(results); ringifyAll(results); });
    obs.observe(results, {childList:true, subtree:true});
  }
  // Run once in case content is already there
  nukeDots(document); ringifyAll(document);

  // 5) Optional: filters drawer toggle if you use the unique IDs
  (function drawer(){
    const t=qs('#filtersToggle'), p=qs('#filtersPanel'), c=qs('#filtersCloseBtn')||qs('#closeFilters');
    if(!t || !p) return;
    const toggle=()=>{ const open=!p.classList.contains('open'); p.classList.toggle('open'); t.setAttribute('aria-expanded', String(open)); };
    t.addEventListener('click', toggle); c && c.addEventListener('click', toggle);
  })();

  // 6) Live labels (keep in sync even if your code sets values programmatically)
  (function liveLabels(){
    const min=qs('#f-min'), minL=qs('#minlabel');
    const w=qs('#f-llw'), wL=qs('#llw-label');
    const updMin = ()=>{ if(min&&minL) minL.textContent=(min.value||'0')+'%'; };
    const updW   = ()=>{ if(w&&wL)   wL.textContent=(Number(w.value||1)).toFixed(1)+'×'; };
    updMin(); updW();
    min && min.addEventListener('input', updMin);
    w   && w.addEventListener('input',   updW);
  })();
})();
/* =========================================================
   Soulink · Match — Snapshot renderer (scoped & safe)
   Fills Connection, Love Language (primary), Hobbies, Values
   from localStorage.soulQuiz with graceful fallbacks.
   ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function readQuiz() {
    try {
      return JSON.parse(localStorage.getItem('soulQuiz')) || {};
    } catch {
      return {};
    }
  }

  function toList(v) {
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    if (typeof v === 'string')
      return v.split(/[\n,|]/).map(s => s.trim()).filter(Boolean);
    return [];
  }

  function renderSnapshot() {
    const q = readQuiz();

    // Elements
    const connEl = $('#snap-conn');
    const llEl   = $('#snap-ll');
    const hobWrap = $('#snap-hobbies');
    const valWrap = $('#snap-values');
    const hobText = $('#snap-hobbies-text');
    const valText = $('#snap-values-text');

    // Data
    const connection =
      q.connectionType || q.connection || q.connectWith || q.connect || null;

    const loves = toList(q.loveLanguages || q.loveLanguage);
    const primaryLL = loves[0] || null;

    const hobbies = toList(q.hobbies);
    const values  = toList(q.values);

    // Labels (always present with dash fallback)
    if (connEl) connEl.textContent = connection || '–';
    if (llEl)   llEl.textContent   = primaryLL  || '–';

    // Chips
    if (hobWrap) {
      hobWrap.innerHTML = '';
      if (hobbies.length) {
        hobbies.forEach(h => {
          const s = document.createElement('span');
          s.className = 'chip';
          s.textContent = h;
          hobWrap.appendChild(s);
        });
      }
    }
    if (valWrap) {
      valWrap.innerHTML = '';
      if (values.length) {
        values.forEach(v => {
          const s = document.createElement('span');
          s.className = 'chip';
          s.textContent = v;
          valWrap.appendChild(s);
        });
      }
    }

    // Descriptive text lines (visible summary)
    const listText = arr =>
      arr && arr.length ? arr.map(x => String(x).toLowerCase()).join(', ') : '–';
    if (hobText) hobText.textContent = listText(hobbies);
    if (valText) valText.textContent = listText(values);
  }

  // Run once on load
  document.addEventListener('DOMContentLoaded', renderSnapshot);

  // Optional: re-render if something else updates localStorage then fires an event
  window.addEventListener('soulink:updateSnapshot', renderSnapshot);

  // If your page already renders cards asynchronously, ensure snapshot renders anyway:
  setTimeout(renderSnapshot, 0);
})();
/* ==== MATCH ENHANCEMENTS (incremental & scoped) ==== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // 0) Nav aktyvus (fallback, jei neturi bendro „data-active“ skripto)
  try{
    document.body.setAttribute('data-page','match');
    const active = $('.navbar .nav-links a[href*="match"]');
    active && active.setAttribute('data-active','1');
  }catch{}

  // Helpers
  function readQuiz(){ try{return JSON.parse(localStorage.getItem('soulQuiz')||'{}')}catch{return{}} }
  function list(v){ if(Array.isArray(v)) return v; if(typeof v==='string') return v.split(/[\n,]/).map(s=>s.trim()).filter(Boolean); return []; }

  // 1) Snapshot — atstatyk aprašus kapsulėms (nekeičiant markup’o)
  function renderSnapshot(){
    const q = readQuiz();
    // Surask Snapshot sekciją — paliekam lankstų paieškos būdą
    const snap = $('#yourSnapshot') || $('.snapshot') || $('#snapshot');
    if(!snap) return;

    // Pasiruošiam/ieškom vietų tekstui (jei jų nėra — sukuriam "etiketė: reikšmė" kapsules)
    const ensureLine = (key, label) => {
      let row = snap.querySelector(`[data-snap="${key}"]`);
      if(!row){
        row = document.createElement('div');
        row.className = 'chip';
        row.setAttribute('data-snap', key);
        snap.appendChild(row);
      }
      row.innerHTML = `<strong style="opacity:.9">${label}:</strong> <span class="snap-val"></span>`;
      return row.querySelector('.snap-val');
    };

    const vConn = ensureLine('connection','Connection');
    const vLove = ensureLine('love','Love Language');
    const vHobs = ensureLine('hobbies','Hobbies');
    const vVals = ensureLine('values','Values');

    const connection = q.connectionType || '–';
    const loves = list(q.loveLanguages || q.loveLanguage);
    const primary = loves[0] || '–';
    const hobbies = list(q.hobbies).slice(0,4);
    const values  = list(q.values).slice(0,8);

    vConn.textContent = connection || '–';
    vLove.textContent = primary || '–';
    vHobs.textContent = hobbies.length ? hobbies.join(', ') : '–';
    vVals.textContent = values.length ? values.join(', ') : '–';
  }

  // 2) Segment toggle (Friendship / Romantic) su localStorage persiste
  const SEG_KEY = 'soulMatchSegment';
  const segWrap = $('#segmentToggle');
  function getSeg(){ const s = localStorage.getItem(SEG_KEY); return (s==='romantic')?'romantic':'friend'; }
  function setSeg(v){ localStorage.setItem(SEG_KEY, v); }

  function paintSeg(){
    if(!segWrap) return;
    const cur = getSeg();
    $$('.seg-btn', segWrap).forEach(btn=>{
      const on = btn.dataset.seg === cur;
      btn.setAttribute('aria-selected', on ? 'true':'false');
    });
    applySegmentFilter(cur);
    tweakCardCTAs(cur);
  }

  segWrap && segWrap.addEventListener('click', (e)=>{
    const b = e.target.closest('.seg-btn'); if(!b) return;
    setSeg(b.dataset.seg === 'romantic' ? 'romantic' : 'friend');
    paintSeg();
  });

  // 3) Filtras kortelėms (be tavo duomenų/generavimo logikos keitimo)
  function detectConnectionForCard(card){
    // Pirmenybė data-* atributams (jei turi)
    const ds = card.dataset || {};
    const dsc = (ds.connection || ds.conn || '').toLowerCase();
    if(dsc) return dsc; // 'friendship' | 'romantic' | 'both'

    // Fallback – pagal tekstą viduje
    const t = card.textContent.toLowerCase();
    if(t.includes('romantic')) return 'romantic';
    if(t.includes('friend'))   return 'friendship';
    if(t.includes('both'))     return 'both';
    // Jei neįmanoma atskirti — rodom visur
    return 'both';
  }
  function applySegmentFilter(seg){
    const wantRom = (seg==='romantic');
    $$('.cards .card').forEach(card=>{
      const conn = detectConnectionForCard(card);
      const show = (conn==='both') || (wantRom ? conn==='romantic' : conn==='friendship');
      card.style.display = show ? '' : 'none';
    });
  }

  // 4) CTA pervardijimas Romantikos režime (NEkeičiant struktūros; prisikabinam po renderio)
  function encodeB64(obj){
    try{ return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
    catch{ return ''; }
  }
  function cardToPayload(card){
    // Jeigu turi data-person – paimam; jei ne, minimalus rinkinys iš DOM
    try{
      if(card.dataset.person){
        return JSON.parse(card.dataset.person);
      }
    }catch{}
    const name = ( $('.card-title', card)?.textContent || $('.name', card)?.textContent || '' ).trim();
    const hobbies = $$('.chip.hobby, .chip[data-kind="hobby"]', card).map(c=>c.textContent.trim());
    const values  = $$('.chip.value, .chip[data-kind="value"]', card).map(c=>c.textContent.trim());
    const connection = detectConnectionForCard(card);
    return { name, hobbies, values, connection };
  }
  function tweakCardCTAs(seg){
    const isRom = (seg==='romantic');
    $$('.cards .card').forEach(card=>{
      // „pagrindinis“ veiksmas – imkim pirmą .btn.primary arba panašų
      const primaryBtn = $('.btn.primary, .btn-primary', card);
      if(!primaryBtn) return;

      if(isRom){
        primaryBtn.textContent = 'Save as Match';
        primaryBtn.onclick = (ev)=>{
          ev.preventDefault();
          const data = cardToPayload(card);
          const b64 = encodeB64(data);
          location.href = `friends.html#add?type=romantic&data=${b64}`;
        };
      } else {
        // paliekam tavo „Edit in Friends“ elgseną – nuimam mūsų onclick
        primaryBtn.onclick = null;
        // jei reikia, grąžinam etiketę
        if(!/edit/i.test(primaryBtn.textContent)) primaryBtn.textContent = 'Edit in Friends';
      }
    });
  }

  // 5) Connection badge ant kortelės (jei nėra) – neardom struktūros
  function ensureConnBadges(){
    $$('.cards .card').forEach(card=>{
      if($('.conn-badge', card)) return;
      const c = detectConnectionForCard(card);
      const label = (c==='romantic') ? '💖 Romantic' : (c==='friendship' ? '🫶 Friendship' : '✨ Both');
      const pill = document.createElement('div');
      pill.className = 'conn-badge chip';
      pill.style.marginBottom = '6px';
      pill.textContent = label;
      // įdedam į kortelės viršų — jei turi header, dedam ten; jei ne, į pradžią
      const header = $('.card-header', card) || card.firstElementChild;
      (header || card).insertAdjacentElement('afterbegin', pill);
    });
  }

  // 6) Pirmas inicijavimas po tavo esamo renderio
  function initMatchEnhancements(){
    renderSnapshot();
    ensureConnBadges();
    paintSeg();
  }

  // Jeigu tavo kodas jau sugeneravo DOM – startuojam; jei turi savo onReady – kviesk initMatchEnhancements() po renderio
  if(document.readyState !== 'loading') initMatchEnhancements();
  else document.addEventListener('DOMContentLoaded', initMatchEnhancements);

  // (pasirinktinai) kai perrendra korteles, pranešk:
  // document.dispatchEvent(new CustomEvent('match:cards-updated'));
  document.addEventListener('match:cards-updated', initMatchEnhancements);
})();

/* ================================
   Soulink – Match: connection filter
   Persists to localStorage('soulMatchConnFilter')
   Filters .match-card by [data-connection]
   ================================ */
(function matchConnectionFilter(){
  const btnFriend   = document.getElementById('btnFriend');
  const btnRomantic = document.getElementById('btnRomantic');
  const snapshot    = document.getElementById('snapshot');

  // restore saved state
  let state = { friend: false, romantic: false };
  try {
    const saved = JSON.parse(localStorage.getItem('soulMatchConnFilter') || '{}');
    if (typeof saved.friend === 'boolean')   state.friend   = saved.friend;
    if (typeof saved.romantic === 'boolean') state.romantic = saved.romantic;
  } catch {}

  function save() {
    localStorage.setItem('soulMatchConnFilter', JSON.stringify(state));
  }

  function paintButtons() {
    btnFriend  && btnFriend.classList.toggle('is-active',   !!state.friend);
    btnRomantic&& btnRomantic.classList.toggle('is-active', !!state.romantic);
  }

  function paintSnapshot() {
    if (!snapshot) return;
    snapshot.classList.remove('friend-mode','romantic-mode');
    if (state.friend && !state.romantic)   snapshot.classList.add('friend-mode');
    if (state.romantic && !state.friend)   snapshot.classList.add('romantic-mode');
    // (both off OR both on -> no special class)
  }

  function show(card, showIt){
    card.style.display = showIt ? '' : 'none';
  }

  function applyFilter(){
    const cards = document.querySelectorAll('.match-card');
    // logic:
    // both off -> show all
    // only friend on -> show friendship & both
    // only romantic on -> show romantic & both
    // both on -> show all
    const friendOn   = !!state.friend;
    const romanticOn = !!state.romantic;

    cards.forEach(card => {
      const conn = (card.getAttribute('data-connection') || 'both').toLowerCase();
      let ok = true;
      if (friendOn && !romanticOn) {
        ok = (conn === 'friendship' || conn === 'both');
      } else if (romanticOn && !friendOn) {
        ok = (conn === 'romantic' || conn === 'both');
      } else if (!friendOn && !romanticOn) {
        ok = true; // show all
      } else {
        ok = true; // both on -> show all
      }
      show(card, ok);/* =========================================
   Soulink – Match: Friendship/Romantic filter
   Uses .seg-btn[data-seg="friend|romantic"]
   Saves to localStorage('soulMatchConnFilter')
   Filters .match-card by data-connection
   ========================================= */
(function matchConnectionFilter(){
  const btnFriend   = document.querySelector('.seg-btn[data-seg="friend"]');
  const btnRomantic = document.querySelector('.seg-btn[data-seg="romantic"]');
  const snapshot    = document.getElementById('yourSnapshot');

  // restore last choice
  let state = { friend:false, romantic:false };
  try {
    const saved = JSON.parse(localStorage.getItem('soulMatchConnFilter') || '{}');
    if (typeof saved.friend === 'boolean')   state.friend   = saved.friend;
    if (typeof saved.romantic === 'boolean') state.romantic = saved.romantic;
  } catch {}

  const save = () =>
    localStorage.setItem('soulMatchConnFilter', JSON.stringify(state));

  function paintButtons(){
    if (btnFriend){
      btnFriend.classList.toggle('is-active', state.friend);
      btnFriend.setAttribute('aria-selected', String(state.friend));
    }
    if (btnRomantic){
      btnRomantic.classList.toggle('is-active', state.romantic);
      btnRomantic.setAttribute('aria-selected', String(state.romantic));
    }
  }

  function paintSnapshot(){
    if (!snapshot) return;
    snapshot.classList.remove('friend-mode','romantic-mode');
    if (state.friend && !state.romantic)  snapshot.classList.add('friend-mode');
    if (state.romantic && !state.friend)  snapshot.classList.add('romantic-mode');
    // both off or both on -> no extra class
  }

  function matchOk(conn){
    conn = (conn || 'both').toLowerCase();
    if (state.friend && !state.romantic)   return conn === 'friendship' || conn === 'both';
    if (state.romantic && !state.friend)   return conn === 'romantic'  || conn === 'both';
    return true; // both off or both on -> show all
  }

  function apply(){
    document.querySelectorAll('.match-card').forEach(card => {
      const conn = card.dataset.connection || 'both';
      card.style.display = matchOk(conn) ? '' : 'none';
    });
    paintButtons();
    paintSnapshot();
    save();
  }

  btnFriend   && btnFriend.addEventListener('click',   () => { state.friend   = !state.friend;   apply(); });
  btnRomantic && btnRomantic.addEventListener('click', () => { state.romantic = !state.romantic; apply(); });

  // ensure filter reapplies after any re-render
  if (typeof render === 'function'){
    const __render = render;
    render = function(...args){ const out = __render.apply(this,args); try{ apply(); }catch{} return out; };
  }

  // initial pass
  apply();
})();

    });

    paintButtons();
    paintSnapshot();
    save();
  }

  btnFriend  && btnFriend.addEventListener('click',  () => { state.friend   = !state.friend;   applyFilter(); });
  btnRomantic&& btnRomantic.addEventListener('click',() => { state.romantic = !state.romantic; applyFilter(); });

  // initial paint
  applyFilter();
})();

