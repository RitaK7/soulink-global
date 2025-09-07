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
      // expose connection for filtering (friendship | romantic | both)
      card.dataset.connection = (String(f.ct || 'both').toLowerCase().includes('romantic')
      ? 'romantic'
      : String(f.ct || 'both').toLowerCase().includes('friend') ? 'friendship' : 'both');

      card.innerHTML=`
    
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
/* =========================================
   Soulink — Match: connection filter (CLEAN)
   Filters .match-card by [data-connection]
   Persists to localStorage('soulMatchConnFilter')
   ========================================= */
(function matchConnectionFilter(){
  // Buttons (supports multiple selector styles used across pages)
  const btnFriend =
    document.getElementById('btnFriend') ||
    document.querySelector('[data-conn="friend"]') ||
    document.querySelector('.seg-btn[data-seg="friend"]');

  const btnRomantic =
    document.getElementById('btnRomantic') ||
    document.querySelector('[data-conn="romance"]') ||
    document.querySelector('.seg-btn[data-seg="romantic"]');

  // Snapshot panel for subtle emphasis
  const snapshot =
    document.getElementById('yourSnapshot') ||
    document.getElementById('snapshot');

  // Restore last choice
  let state = { friend:false, romantic:false };
  try {
    const saved = JSON.parse(localStorage.getItem('soulMatchConnFilter') || '{}');
    if (typeof saved.friend === 'boolean')   state.friend   = saved.friend;
    if (typeof saved.romantic === 'boolean') state.romantic = saved.romantic;
  } catch {}

  const save = () =>
    localStorage.setItem('soulMatchConnFilter', JSON.stringify(state));

  function paintButtons(){
    btnFriend  && (btnFriend.classList.toggle('is-active', state.friend),
                   btnFriend.setAttribute('aria-selected', String(state.friend)));
    btnRomantic&& (btnRomantic.classList.toggle('is-active', state.romantic),
                   btnRomantic.setAttribute('aria-selected', String(state.romantic)));
  }

  function paintSnapshot(){
    if (!snapshot) return;
    snapshot.classList.remove('friend-mode','romantic-mode');
    if (state.friend && !state.romantic)  snapshot.classList.add('friend-mode');
    if (state.romantic && !state.friend)  snapshot.classList.add('romantic-mode');
    // both off or both on -> no extra class
  }

  // If a card has no dataset, try to infer from text
  function inferConn(card){
    const t = (card.textContent || '').toLowerCase();
    if (t.includes('romantic')) return 'romantic';
    if (t.includes('friend'))   return 'friendship';
    return 'both';
  }

  function matchOk(conn){
    conn = (conn || 'both').toLowerCase();
    if (state.friend && !state.romantic) return conn === 'friendship' || conn === 'both';
    if (state.romantic && !state.friend) return conn === 'romantic'  || conn === 'both';
    return true; // both off OR both on -> show all
  }

  function apply(){
    document.querySelectorAll('.match-card').forEach(card => {
      const conn = (card.dataset.connection || card.getAttribute('data-connection') || inferConn(card));
      card.style.display = matchOk(conn) ? '' : 'none';
    });
    paintButtons();
    paintSnapshot();
    save();
  }

  // Toggle handlers
  btnFriend   && btnFriend.addEventListener('click',   () => { state.friend   = !state.friend;   apply(); });
  btnRomantic && btnRomantic.addEventListener('click', () => { state.romantic = !state.romantic; apply(); });

  // Re-apply after your own render functions
  if (typeof window.render === 'function'){
    const _r = window.render;
    window.render = function(...args){ const out = _r.apply(this,args); try{apply();}catch{} return out; };
  }
  if (typeof window.renderMatches === 'function'){
    const _rm = window.renderMatches;
    window.renderMatches = function(...args){ const out = _rm.apply(this,args); try{apply();}catch{} return out; };
  }

  // Initial pass
  apply();
})();
/* =========================================
   Soulink · MATCH — tiny logic layer (no DOM rebuilds)
   - Snapshot chips fill from localStorage.soulQuiz
   - Friendship/Romantic mode with persistence
   - Search + Min score + LL weight filters work together
   - Cards are only shown/hidden via .is-hidden
   - "Edit in Friends" hand-off via localStorage.friendDraft
   ========================================= */
(function(){
  // ---------- utilities ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b)=>Math.max(a, Math.min(b, v));
  const esc = (s='') => String(s).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

  // ---------- 1) Profile → Snapshot ----------
  function loadProfileFromLS(){
    try{
      const q = JSON.parse(localStorage.getItem('soulQuiz')||'{}') || {};
      const connection = (q.connectionType || q.connection || '').toString().toLowerCase() || 'both';
      const lovePrimary = Array.isArray(q.loveLanguages) ? (q.loveLanguages[0]||'')
                        : (q.loveLanguagePrimary || q.loveLanguage || '');
      const toArr = (v, max)=>(
        Array.isArray(v) ? v
        : typeof v === 'string' ? v.split(/[\n,|]/) : []
      ).map(x=>x.trim()).filter(Boolean).slice(0, max);
      const hobbies = toArr(q.hobbies, 6);
      const values  = toArr(q.values, 10);
      return { connection, loveLanguage: lovePrimary, hobbies, values };
    }catch{ return { connection:'both', loveLanguage:'', hobbies:[], values:[] }; }
  }

  function renderSnapshot(profile){
    // find or softly assign anchors (no structure changes)
    const snap = $('#yourSnapshot') || $('#snapshot') || $('.snapshot');
    if(!snap) return;

    const elConn = $('#snap-connection') || snap.querySelector('#snap-connection') || snap.querySelector('[data-snap="connection"]');
    const elLove = $('#snap-love')       || snap.querySelector('#snap-love')       || snap.querySelector('[data-snap="love"]');
    const elHobs = $('#snap-hobbies')    || snap.querySelector('#snap-hobbies')    || snap.querySelector('[data-snap="hobbies"]');
    const elVals = $('#snap-values')     || snap.querySelector('#snap-values')     || snap.querySelector('[data-snap="values"]');

    if (elConn) elConn.textContent = profile.connection || '–';
    if (elLove) elLove.textContent = profile.loveLanguage || '–';

    const chipify = arr => arr.map(t=>`<span class="chip">${esc(t)}</span>`).join('');
    if (elHobs) elHobs.innerHTML = profile.hobbies.slice(0,6).length ? chipify(profile.hobbies.slice(0,6)) : '';
    if (elVals) elVals.innerHTML = profile.values.slice(0,10).length ? chipify(profile.values.slice(0,10)) : '';
  }

  // ---------- 2) Cards metadata (no rebuild) ----------
  function inferConnFromText(card){
    const t = (card.textContent||'').toLowerCase();
    if (t.includes('romantic')) return 'romantic';
    if (t.includes('friend'))   return 'friendship';
    return 'both';
  }
  function ensureCardMeta(){
    $$('.match-card').forEach((card, i) => {
      if (!card.dataset.id)          card.dataset.id = card.getAttribute('data-id') || String(i);
      if (!card.dataset.connection)  card.dataset.connection = card.getAttribute('data-connection') || inferConnFromText(card);
      // score baseline: prefer [data-score] inside, fallback to badge text
      if (!card.dataset.score) {
        const s = card.querySelector('[data-score], .score, .score-num');
        const n = s ? parseInt(String(s.getAttribute('data-score') || s.textContent).replace(/[^\d]/g,''),10) : NaN;
        if (!isNaN(n)) card.dataset.score = String(clamp(n,0,100));
      }
      // candidate LL if visible in text
      if (!card.dataset.ll) {
        const llLine = card.querySelector('[data-ll], .ll, .love, .love-language');
        let ll = llLine ? llLine.getAttribute('data-ll') || llLine.textContent : '';
        if (!ll) {
          const m = (card.textContent||'').match(/Love\s*Language:\s*([^\n,]+)/i);
          ll = m ? m[1].trim() : '';
        }
        if (ll) card.dataset.ll = ll;
      }
    });
  }

  // ---------- 3) State & mode ----------
  const state = {
    mode: (localStorage.getItem('matchMode') || 'friendship'), // default any – choose one; filter rules below include 'both'
    search: '',
    minScore: 0,
    weight: 1.0,
  };
  function setMode(mode){
    state.mode = (mode === 'romantic') ? 'romantic' : 'friendship';
    localStorage.setItem('matchMode', state.mode);
    // visual toggle (IDs are optional; we also support your existing chips)
    const bF = $('#modeFriendship') || $('[data-conn="friend"]') || $('.seg-btn[data-seg="friend"]');
    const bR = $('#modeRomantic')   || $('[data-conn="romance"]') || $('.seg-btn[data-seg="romantic"]');
    bF && bF.classList.toggle('is-active', state.mode==='friendship');
    bR && bR.classList.toggle('is-active', state.mode==='romantic');
    // subtle snapshot emphasis
    const snapshot = $('#yourSnapshot') || $('#snapshot');
    if (snapshot){
      snapshot.classList.remove('friend-mode','romantic-mode');
      snapshot.classList.add(state.mode==='friendship' ? 'friend-mode' : 'romantic-mode');
    }
    // sync dropdown if exists (#f-connection)
    const connSel = $('#f-connection');
    if (connSel){
      // keep user choice if it's not Any; only set when value is empty/Any
      if (!connSel.value || /any/i.test(connSel.value)) {
        connSel.value = state.mode; // value must exist in options; if not, ignore
      }
    }
    updateView();
  }

  // ---------- 4) Candidates & filters ----------
  function loadCandidates(){
    // prefer DOM-derived metadata; no format changes
    return $$('.match-card').map(card => ({
      id: card.dataset.id,
      el: card,
      connection: (card.dataset.connection || 'both').toLowerCase(),
      score: parseInt(card.dataset.score || '0', 10) || 0,
      ll: card.dataset.ll || '', // candidate primary LL if detectable
      searchText: (card.textContent || '').toLowerCase()
    }));
  }

  function filterByMode(list, mode){
    return list.filter(c => {
      if (mode === 'friendship') return c.connection === 'friendship' || c.connection === 'both';
      if (mode === 'romantic')   return c.connection === 'romantic'   || c.connection === 'both';
      return true;
    });
  }

  let profile = loadProfileFromLS();
  let candidates = [];

  function scoreWithWeight(c){
    const base = c.score || 0;
    const llMatch = (profile.loveLanguage && c.ll)
      ? (c.ll.toLowerCase() === profile.loveLanguage.toLowerCase() ? 10 : 0)
      : 0;
    return clamp(Math.round(base + state.weight * llMatch), 0, 100);
  }

  function applyFilters(list){
    // 1) connection dropdown (if user picked specific value, overrides mode)
    const connSel = $('#f-connection');
    const userConn = connSel && connSel.value && !/any/i.test(connSel.value) ? connSel.value.toLowerCase() : null;

    let cur = list.slice(0);
    if (userConn) {
      cur = cur.filter(c => (c.connection === userConn || c.connection === 'both'));
    } else {
      cur = filterByMode(cur, state.mode);
    }

    // 2) search
    if (state.search) {
      const q = state.search.toLowerCase().trim();
      cur = cur.filter(c => c.searchText.includes(q));
    }

    // 3) min score with LL weight
    cur = cur.filter(c => scoreWithWeight(c) >= (state.minScore||0));

    return cur;
  }

  function renderCards(visibleList){
    const showSet = new Set(visibleList.map(x => x.id));
    $$('.match-card').forEach(card => {
      const id = card.dataset.id || '';
      card.classList.toggle('is-hidden', !showSet.has(id));
    });
  }

  function updateView(){
    ensureCardMeta();
    candidates = loadCandidates(); // refresh dom snapshot
    const filtered = applyFilters(candidates);
    renderCards(filtered);
  }

  // ---------- 5) Wiring ----------
  function wireFilters(){
    // mode chips
    const btnFriend = $('#modeFriendship') || $('[data-conn="friend"]') || $('.seg-btn[data-seg="friend"]');
    const btnRom    = $('#modeRomantic')   || $('[data-conn="romance"]') || $('.seg-btn[data-seg="romantic"]');
    btnFriend && btnFriend.addEventListener('click', () => setMode('friendship'));
    btnRom    && btnRom.addEventListener('click',    () => setMode('romantic'));

    // search
    const search = $('#f-search') || ($('#filters input[type="search"]') || $('#filters input[placeholder*="Search" i]'));
    search && search.addEventListener('input', e => { state.search = e.target.value || ''; updateView(); });

    // min score
    const min = $('#f-min') || $('#filters input[type="range"][name*="min" i]') || $('#filters input[type="range"][id*="min" i]');
    min && min.addEventListener('input', e => { state.minScore = parseInt(e.target.value||'0',10)||0; updateView(); });

    // LL weight
    const llw = $('#f-llw') || $('#filters input[type="range"][name*="ll" i]') || $('#filters input[type="range"][id*="ll" i]');
    llw && llw.addEventListener('input', e => { state.weight = parseFloat(e.target.value||'1'); updateView(); });

    // reset (keep mode)
    const resetBtn = $('#btnReset') ||
      Array.from(($$('#filters button, #filtersPanel button'))).find(b=>/reset/i.test(b.textContent||''));
    resetBtn && resetBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      state.search = '';
      state.minScore = 0;
      state.weight = 1;
      if (search) search.value = '';
      if (min)    min.value    = '0';
      if (llw)    llw.value    = '1';
      const connSel = $('#f-connection'); if (connSel) connSel.value = 'Any';
      updateView(); // keep current mode
    });

    // "Edit in Friends" hand-off
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('button, a');
      if (!btn) return;
      if (!/edit in friends/i.test(btn.textContent||'')) return;
      const card = btn.closest('.match-card');
      if (!card) return;

      const payload = {
        id: card.dataset.id || '',
        name: (card.querySelector('.name, .card-title')?.textContent||'').trim(),
        connection: card.dataset.connection || inferConnFromText(card),
        loveLanguage: card.dataset.ll || '',
        score: parseInt(card.dataset.score||'0',10)||0,
        notes: ''
      };
      try { localStorage.setItem('friendDraft', JSON.stringify(payload)); } catch {}
      location.href = 'friends.html#draft=1';
    });
  }

  // ---------- 6) Boot ----------
  document.addEventListener('DOMContentLoaded', () => {
    // mark page for local CSS
    document.body.classList.add('match-page');

    // nav active (visual parity with other pages)
    $$('.navbar a').forEach(a=>{
      if (/match\.html$/i.test(a.getAttribute('href')||'')) {
        a.classList.add('active'); a.setAttribute('aria-current','page');
      }
    });

    const profile = loadProfileFromLS();
    renderSnapshot(profile);
    ensureCardMeta();
    wireFilters();

    // restore mode
    const savedMode = (localStorage.getItem('matchMode')||'').toLowerCase();
    setMode(savedMode==='romantic' ? 'romantic' : 'friendship'); // also calls updateView()
  });
})();
/* =========================================
   Soulink · Match — incremental logic (no DOM rebuilds)
   - Snapshot fallsbacks
   - Friendship/Romantic multi-toggle
   - Search + Min score + LL weight together
   - Cards only show/hide via .is-hidden
   - Score badge placement + mobile actions stack
   ========================================= */
(function(){
  // --- helpers ---
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const clamp = (v,a,b)=>Math.max(a, Math.min(b, v));
  const txt = n => (n?.textContent||'').trim();
  const norm = s => (s||'').toString().trim().toLowerCase();

  // page namespace (CSS)
  document.body.classList.add('match-page');

  // ---- Snapshot: profile -> chips/labels (no structure change) ----
  function loadProfileFromLS(){
    try{
      const q = JSON.parse(localStorage.getItem('soulQuiz')||'{}') || {};
      const connection = norm(q.connectionType || q.connection) || 'both';
      const loveLanguage = Array.isArray(q.loveLanguages) ? q.loveLanguages[0]||''
                         : (q.loveLanguagePrimary || q.loveLanguage || '');
      const toArr = v => (Array.isArray(v) ? v
                       : typeof v==='string' ? v.split(/[\n,|]/) : [])
                       .map(x=>x.trim()).filter(Boolean);
      return {
        connection, loveLanguage,
        hobbies: toArr(q.hobbies).slice(0,6),
        values:  toArr(q.values).slice(0,10)
      };
    }catch{ return {connection:'both', loveLanguage:'', hobbies:[], values:[]}; }
  }

  function renderSnapshot(p){
    const snap = $('#yourSnapshot') || $('#snapshot') || $('.snapshot');
    if(!snap) return;

    const elConn = $('#snap-connection') || snap.querySelector('#snap-connection');
    const elLove = $('#snap-love')       || snap.querySelector('#snap-love');
    const elHobs = $('#snap-hobbies')    || snap.querySelector('#snap-hobbies');
    const elVals = $('#snap-values')     || snap.querySelector('#snap-values');

    // Connection
    if (elConn){
      elConn.textContent = p.connection || '';
      if (!p.connection || p.connection === 'both'){
        elConn.textContent = 'Not selected';
        elConn.classList.add('muted');
      } else elConn.classList.remove('muted');
    }

    // Love Language
    if (elLove){
      elLove.textContent = p.loveLanguage || 'Not selected';
      elLove.classList.toggle('muted', !p.loveLanguage);
    }

    // chips helper
    const chipify = arr => arr.map(t=>`<span class="chip">${t}</span>`).join('');

    // Hobbies
    if (elHobs){
      if (p.hobbies.length){
        elHobs.innerHTML = chipify(p.hobbies);
        elHobs.classList.add('chips','clamp-3');
        elHobs.classList.remove('muted');
      } else {
        elHobs.textContent = 'No items yet';
        elHobs.classList.add('muted');
      }
    }

    // Values
    if (elVals){
      if (p.values.length){
        elVals.innerHTML = chipify(p.values);
        elVals.classList.add('chips','clamp-3');
        elVals.classList.remove('muted');
      } else {
        elVals.textContent = 'No items yet';
        elVals.classList.add('muted');
      }
    }
  }

  // ---- Cards metadata (no DOM rebuild) ----
  function inferConnFromText(card){
    const t = norm(card.textContent);
    if (t.includes('romantic')) return 'romantic';
    if (t.includes('friend'))   return 'friendship';
    return 'both';
  }
  function ensureCards(){
    // mark cards + minimal metadata
    const candidates =
      $$('.match-card').length ? $$('.match-card') :
      $$('#matchGrid .card, .cards .card, .cards-grid .card');

    candidates.forEach((card, i)=>{
      card.classList.add('match-card');

      // score badge element -> unify class (no move)
      const scoreEl = card.querySelector('.score-badge, .score-num, .score');
      if (scoreEl) scoreEl.classList.add('score-badge');

      // a) id
      if (!card.dataset.id) card.dataset.id = card.getAttribute('data-id') || String(i);

      // b) connection
      if (!card.dataset.connection) {
        // try global array if exists (matchData / candidates)
        let fromData = null;
        try{
          const arr = (window.matchData || window.candidates || []);
          if (Array.isArray(arr) && arr[i]) {
            const raw = arr[i].connection || arr[i].ct || arr[i].connectionType;
            fromData = norm(raw);
          }
        }catch{}
        card.dataset.connection = fromData || inferConnFromText(card);
      }

      // c) score baseline
      if (!card.dataset.score){
        const s = card.querySelector('[data-score], .score, .score-num');
        const n = s ? parseInt((s.getAttribute('data-score')||s.textContent).replace(/[^\d]/g,''),10) : NaN;
        if (!isNaN(n)) card.dataset.score = String(clamp(n,0,100));
      }

      // d) LL (optional, for weight)
      if (!card.dataset.ll){
        const ll = card.querySelector('[data-ll], .love-language, .ll');
        if (ll){
          card.dataset.ll = ll.getAttribute('data-ll') || txt(ll);
        }
      }

      // e) actions stackable (for mobile)
      const actions = card.querySelector('.card-actions, .actions, .btn-row');
      if (actions && /message/i.test(actions.textContent) && /compare/i.test(actions.textContent)){
        actions.classList.add('actions-stackable');
      }
    });
  }

  // ---- State + filters ----
  const toggles = {
    friend:  null,
    romantic:null
  };
  // find toggle buttons (we don't rename them)
  toggles.friend   = $('#modeFriendship') || $('[data-conn="friend"]') || $('.seg-btn[data-seg="friend"]') ||
                     Array.from($$('button, .btn, a')).find(b=>/friendship/i.test(txt(b)));
  toggles.romantic = $('#modeRomantic')   || $('[data-conn="romance"]') || $('.seg-btn[data-seg="romantic"]') ||
                     Array.from($$('button, .btn, a')).find(b=>/romantic/i.test(txt(b)));

  // multi-toggle state
  let state = { friend:true, romantic:true, search:'', minScore:0, weight:1 };
  try{
    const saved = JSON.parse(localStorage.getItem('soulMatchConnFilter')||'{}');
    if (typeof saved.friend==='boolean')   state.friend = saved.friend;
    if (typeof saved.romantic==='boolean') state.romantic = saved.romantic;
  }catch{}

  function persistToggles(){
    localStorage.setItem('soulMatchConnFilter', JSON.stringify({friend:state.friend, romantic:state.romantic}));
  }

  function paintToggles(){
    if (toggles.friend)   toggles.friend.classList.toggle('is-active',   state.friend);
    if (toggles.romantic) toggles.romantic.classList.toggle('is-active', state.romantic);

    const snap = $('#yourSnapshot') || $('#snapshot');
    if (snap){
      snap.classList.remove('friend-mode','romantic-mode');
      if (state.friend && !state.romantic)   snap.classList.add('friend-mode');
      if (state.romantic && !state.friend)   snap.classList.add('romantic-mode');
    }
  }

  function matchOk(conn){
    conn = norm(conn||'both');
    const F = !!state.friend, R = !!state.romantic;
    if (!F && !R) return true;     // abu off -> visos
    if (F && R)   return true;     // abu on  -> visos
    if (F)        return (conn==='friendship' || conn==='both');
    if (R)        return (conn==='romantic'  || conn==='both');
    return true;
  }

  function scoreWithWeight(card){
    const base = parseInt(card.dataset.score||'0',10)||0;
    const me   = loadProfileFromLS();
    const ll   = norm(card.dataset.ll||'');
    const llMe = norm(me.loveLanguage||'');
    const bonus = (ll && llMe && ll===llMe) ? 10 : 0; // paprastas LL bonusas
    return clamp(Math.round(base + state.weight*bonus), 0, 100);
  }

  function applyFilters(){
    ensureCards();

    // search
    const q = norm(state.search);
    // connection dropdown override
    const sel = $('#f-connection');
    const userConn = sel && sel.value && !/any/i.test(sel.value) ? norm(sel.value) : null;

    $$('.match-card').forEach(card=>{
      const conn = userConn || card.dataset.connection || 'both';
      let show = matchOk(conn);

      if (show && q){
        show = norm(card.textContent).includes(q);
      }
      if (show && state.minScore>0){
        show = scoreWithWeight(card) >= state.minScore;
      }
      card.classList.toggle('is-hidden', !show);
    });

    paintToggles();
    persistToggles();
  }

  // events
  function wire(){
    if (toggles.friend)   toggles.friend.addEventListener('click', ()=>{ state.friend = !state.friend; applyFilters(); });
    if (toggles.romantic) toggles.romantic.addEventListener('click', ()=>{ state.romantic = !state.romantic; applyFilters(); });

    const search = $('#f-search') || ($('#filters input[type="search"]') || $('#filters input[placeholder*="Search" i]'));
    search && search.addEventListener('input', e=>{ state.search = e.target.value||''; applyFilters(); });

    const min = $('#f-min') || $('#filters input[type="range"][name*="min" i]') || $('#filters input[type="range"][id*="min" i]');
    min && min.addEventListener('input', e=>{ state.minScore = parseInt(e.target.value||'0',10)||0; applyFilters(); });

    const llw = $('#f-llw') || $('#filters input[type="range"][name*="ll" i]') || $('#filters input[type="range"][id*="ll" i]');
    llw && llw.addEventListener('input', e=>{ state.weight = parseFloat(e.target.value||'1'); applyFilters(); });

    const resetBtn = $('#btnReset') || Array.from(($$('#filters button, #filtersPanel button'))).find(b=>/reset/i.test(txt(b)));
    resetBtn && resetBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      state.search=''; state.minScore=0; state.weight=1;
      if (search) search.value='';
      if (min) min.value='0';
      if (llw) llw.value='1';
      const sel = $('#f-connection'); if (sel) sel.value='Any';
      applyFilters(); // neišjungiant režimo
    });

    // Edit in Friends hand-off
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('button,a');
      if (!btn || !/edit in friends/i.test(txt(btn))) return;
      const card = btn.closest('.match-card'); if(!card) return;

      const payload = {
        id: card.dataset.id || '',
        name: txt(card.querySelector('.name, .card-title')) || '',
        connection: card.dataset.connection || inferConnFromText(card),
        loveLanguage: card.dataset.ll || '',
        score: parseInt(card.dataset.score||'0',10)||0
      };
      try{ localStorage.setItem('friendDraft', JSON.stringify(payload)); }catch{}
      location.href = 'friends.html#draft=1';
    });

    // nav active parity (glow)
    $$('.navbar a').forEach(a=>{
      const isHere = /match\.html$/i.test(a.getAttribute('href')||'');
      a.classList.toggle('active', isHere);
      if (isHere) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
  }

  // boot
  document.addEventListener('DOMContentLoaded', ()=>{
    renderSnapshot(loadProfileFromLS());
    ensureCards();
    wire();
    applyFilters();
  });
})();
/* =========================================
   Soulink · Match — connection toggle + snapshot fallbacks
   - neprastato DOM; tik prideda klases/data-* ir rodo/slėpia korteles
   ========================================= */
(() => {
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const norm = s => (s||'').toString().trim().toLowerCase();

  // page namespace CSS
  document.body.classList.add('match-page');

  // ---- 1) Toggle buttons (IDs jei yra; kitaip ieškom pagal tekstą) ----
  const btnFriend = $('#toggleFriendship') ||
    $$('button, .btn, [role="button"]').find(b => norm(b.textContent)==='friendship');
  const btnRom    = $('#toggleRomantic')  ||
    $$('button, .btn, [role="button"]').find(b => norm(b.textContent)==='romantic');

  if (!btnFriend || !btnRom) return; // saugiklis, nepakeičiant puslapio

  // ---- 2) Paruošk korteles: .match-card + data-connection ----
  function guessFromText(card){
    // Pirmenybė tiksliam "Connection: ..." tekstui
    const m = (card.textContent||'').match(/connection\s*:\s*(friendship|romantic|both)/i);
    if (m) return m[1].toLowerCase();
    // Kapsulės/žetonai
    const chip = $(
      '.chip, [data-conn], .connection, .conn, .badge', card
    );
    if (chip){
      const t = norm(chip.getAttribute('data-conn') || chip.textContent);
      if (/(^|[^a-z])romantic([^a-z]|$)/.test(t))   return 'romantic';
      if (/(^|[^a-z])friend(ship)?([^a-z]|$)/.test(t)) return 'friendship';
      if (/(^|[^a-z])both([^a-z]|$)/.test(t))       return 'both';
    }
    return 'both'; // fallback – kad mygtukai "veiktų" ir be duomenų
  }

  function ensureCards(){
    // jei jau turim .match-card – nenaikinam, tik naudojam
    let cards = $$('.match-card');
    if (!cards.length){
      // atsarginiai selektoriai; tik prirašom klasę, nekeičiam struktūros
      const raw = $$('#matchGrid .card, .cards .card, .cards-grid .card, .grid > .card');
      raw.forEach(el => el.classList.add('match-card'));
      cards = $$('.match-card');
    }
    cards.forEach((card, i) => {
      if (!card.dataset.connection){
        card.dataset.connection = guessFromText(card);
      } else {
        card.dataset.connection = norm(card.dataset.connection);
      }
      if (!card.dataset.id){
        card.dataset.id = card.getAttribute('data-id') || String(i);
      }
      // score ženkliukui suteikiam bendrą klasę (padėčiai CSS'e), bet nenešiojam
      const s = card.querySelector('.score-badge, .score, .score-num');
      if (s) s.classList.add('score-badge');
    });
    return cards;
  }
  const cards = ensureCards();

  // ---- 3) Būsena + persistencija ----
  const STORAGE = 'matchConnectionFilter'; // 'friendship' | 'romantic' | 'both-on' | 'both-off'

  const setPressed = (btn, on) => {
    btn.classList.toggle('is-active', !!on);
    btn.setAttribute('aria-pressed', on ? 'true':'false');
  };
  const getPressed = btn => btn.classList.contains('is-active');

  // atkurk
  (function restore(){
    const v = localStorage.getItem(STORAGE);
    if (v === 'friendship')      { setPressed(btnFriend,true);  setPressed(btnRom,false); }
    else if (v === 'romantic')   { setPressed(btnFriend,false); setPressed(btnRom,true);  }
    else if (v === 'both-on')    { setPressed(btnFriend,true);  setPressed(btnRom,true);  }
    else if (v === 'both-off')   { setPressed(btnFriend,false); setPressed(btnRom,false); }
  })();

  function persist(){
    const f = getPressed(btnFriend), r = getPressed(btnRom);
    let val = 'both-off';
    if (f &&  r) val = 'both-on';
    if (f && !r) val = 'friendship';
    if (!f && r) val = 'romantic';
    localStorage.setItem(STORAGE, val);
  }

  // ---- 4) Filtravimas (rodyk/slėpk, nekeičiam DOM) ----
  function applyConnectionFilter(){
    const friendOn = getPressed(btnFriend);
    const romOn    = getPressed(btnRom);

    ensureCards().forEach(card => {
      const type = card.dataset.connection || 'both';
      let show = true;

      if (!friendOn && !romOn) {
        show = true;                       // abu off -> visos
      } else if (friendOn && !romOn) {
        show = (type==='friendship' || type==='both');
      } else if (!friendOn && romOn) {
        show = (type==='romantic'  || type==='both');
      } else {
        show = true;                       // abu on -> visos
      }
      card.style.display = show ? '' : 'none';
    });

    persist();
  }

  // ---- 5) Click handlers (multi-toggle) ----
  btnFriend.addEventListener('click', () => {
    setPressed(btnFriend, !getPressed(btnFriend));
    applyConnectionFilter();
  });
  btnRom.addEventListener('click', () => {
    setPressed(btnRom, !getPressed(btnRom));
    applyConnectionFilter();
  });

  // ---- 6) Snapshot fallback tekstai (nekeičiant struktūros) ----
  (function snapshotFallbacks(){
    const snap = $('.snapshot, #snapshot, #yourSnapshot, [data-snapshot]');
    if(!snap) return;
    const setMuted = (el, text) => {
      if (!el) return;
      const raw = (el.textContent||'').trim();
      if (!raw || raw==='–') { el.textContent = text; el.classList.add('muted'); }
    };
    setMuted(snap.querySelector('#snap-connection, .connection-value, .connection'), 'Not selected');
    setMuted(snap.querySelector('#snap-love, .love-language-value, .love-language'), 'Not selected');

    const hob = snap.querySelector('#snap-hobbies, .snapshot-hobbies, .hobbies');
    if (hob && !hob.textContent.trim()) { hob.textContent = 'No items yet'; hob.classList.add('muted'); }
    const val = snap.querySelector('#snap-values, .snapshot-values, .values');
    if (val && !val.textContent.trim()) { val.textContent = 'No items yet'; val.classList.add('muted'); }
  })();

  // ---- 7) Pirmas pritaikymas ----
  applyConnectionFilter();
})();

