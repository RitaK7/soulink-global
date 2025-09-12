// results.js — Soulink Results (robust, legacy-safe, no layout changes)
(() => {
  // ========== tiny helpers ==========
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s, r));

  function readJSON(keys, fallback) {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const k of list) {
      try {
        const v = JSON.parse(localStorage.getItem(k));
        if (v) return v;
      } catch {}
    }
    return fallback;
  }
  const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, m =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const digits = (s) => String(s||'').replace(/[^\d+]+/g, '');
  function normList(src) {
    if (!src) return [];
    if (Array.isArray(src)) return [...new Set(src.map(x => String(x).toLowerCase().trim()).filter(Boolean))];
    return [...new Set(String(src).toLowerCase()
      .split(/[,|/;]+|\s{2,}|\s(?=\S{3,})/) // commas, pipes, slashes, multi-spaces
      .map(t => t.trim())
      .filter(Boolean))];
  }

  // Love language canonical ids
  const LL_MAP = {
    'acts of service':'acts_of_service','acts':'acts_of_service','service':'acts_of_service',
    'receiving gifts':'receiving_gifts','gifts':'receiving_gifts','gift':'receiving_gifts',
    'quality time':'quality_time','time':'quality_time',
    'physical touch':'physical_touch','touch':'physical_touch',
    'words of affirmation':'words_of_affirmation','words':'words_of_affirmation','affirmation':'words_of_affirmation',
    'unknown':'unknown','': 'unknown'
  };
  function normLL(v){
    if (Array.isArray(v) && v.length) v = v[0];
    v = String(v||'').toLowerCase().trim();
    return LL_MAP[v] || LL_MAP[(v.replace(/[-_]+/g,' '))] || 'unknown';
  }
  function prettyLL(id){
    const map = {
      acts_of_service:'Acts of Service',
      receiving_gifts:'Receiving Gifts',
      quality_time:'Quality Time',
      physical_touch:'Physical Touch',
      words_of_affirmation:'Words of Affirmation',
      unknown:'Unknown'
    };
    return map[id] || 'Unknown';
  }

  // avatar: url if given, else single-initial SVG (data URI)
  function avatarFor(name, photo){
    const url = String(photo||'');
    if (/^(data:|https?:)/i.test(url)) return url;
    const ch = (String(name||' ').trim()[0] || '?').toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="12" fill="#06494f"/>
      <text x="50%" y="56%" text-anchor="middle" font-size="28" fill="#00fdd8" font-family="system-ui,Segoe UI,Arial,sans-serif">${escapeHTML(ch)}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // ========== storage (legacy-safe) ==========
  const QUIZ_RAW = readJSON(['soulink.soulQuiz','soulQuiz'], {}) || {};
  const FRIENDS_RAW = readJSON(['soulink.friends.list','soulink.friends','soulFriends'], []) || [];

  // Build "me" from quiz
  function buildMe(q) {
    const ll = normLL(q.loveLanguage || q.loveLanguages || q.primaryLoveLanguage);
    const hobbies = normList(q.hobbies);
    const values  = normList(q.values);
    const me = {
      name: String(q.name || q.fullname || '').trim() || '—',
      ct:   String(q.connection || q.connectionType || q.connect || '').toLowerCase() || 'both',
      ll,
      hobbies, values,
      photo: q.photo || q.avatar || ''
    };
    // Snapshot fill (dashes where missing)
    $('#me-name')    && ($('#me-name').textContent = me.name || '—');
    $('#me-ct')      && ($('#me-ct').textContent   = me.ct || '—');
    $('#me-ll')      && ($('#me-ll').textContent   = prettyLL(me.ll) || '—');
    $('#me-hobbies') && ($('#me-hobbies').textContent = (me.hobbies.join(', ') || '—'));
    $('#me-values')  && ($('#me-values').textContent  = (me.values.join(', ') || '—'));
    return me;
  }
  const ME = buildMe(QUIZ_RAW);

  // Normalize friend
  function normaliseFriend(f) {
    const ctRaw = (f.connection || f.ct || '').toString().toLowerCase();
    let ct = 'both';
    if (/rom/.test(ctRaw)) ct = 'romantic';
    else if (/friend/.test(ctRaw)) ct = 'friendship';
    else if (/both|any|either/.test(ctRaw)) ct = 'both';

    const ll = normLL(f.loveLanguage || f.love_language || f.ll || f.love_language_primary);

    const h = normList(f.hobbies);
    const v = normList(f.values);

    return {
      id: String(f.id || f.key || f.email || f.instagram || f.name || Math.random().toString(36).slice(2)).toLowerCase(),
      name: String(f.name || '—').trim(),
      ct, ll,
      hobbies: h, values: v,
      score: typeof f.score === 'number' ? f.score : undefined,
      photo: f.photo || f.avatar || '',
      whatsapp: f.whatsapp || f.wa || '',
      instagram: f.instagram || f.ig || '',
      facebook: f.facebook || f.fb || '',
      email: f.email || '',
      contact: f.contact || f.url || f.website || '',
      notes: f.notes || ''
    };
  }
  const FRIENDS = Array.isArray(FRIENDS_RAW) ? FRIENDS_RAW.map(normaliseFriend) : [];

  // ========== scoring ==========
  function jaccard(a, b){
    const A = new Set(a||[]), B = new Set(b||[]);
    if (!A.size && !B.size) return 0;
    let inter = 0; for (const x of A) if (B.has(x)) inter++;
    const uni = new Set([...A, ...B]).size || 1;
    return inter/uni;
  }
  function score(me, fr, weight){
    const hs = Math.round(jaccard(me.hobbies, fr.hobbies) * 100);
    const vs = Math.round(jaccard(me.values,  fr.values)  * 100);
    const ls = (me.ll && fr.ll && me.ll === fr.ll) ? 100 : 0;
    const final = Math.round((hs + vs + weight*ls) / (2 + weight));
    return { final, hs, vs, ls };
  }

  // ========== state / compute / render ==========
  const STATE = { filterH: new Set(), filterV: new Set(), weight: 1.0 };

  function passesFilters(f){
    if (STATE.filterH.size && ![...STATE.filterH].every(t => f.hobbies.includes(t))) return false;
    if (STATE.filterV.size && ![...STATE.filterV].every(t => f.values.includes(t)))  return false;
    return true;
  }

  function compute(weight){
    // enrich with scores
    const enriched = FRIENDS.map(fr => {
      const sc = score(ME, fr, weight);
      return {...fr, ...sc};
    });

    // split (include BOTH into both lists)
    const romantic   = enriched.filter(f => f.ct === 'romantic'  || f.ct === 'both')
                               .sort((a,b)=> b.final - a.final || a.name.localeCompare(b.name));
    const friendship = enriched.filter(f => f.ct === 'friendship'|| f.ct === 'both')
                               .sort((a,b)=> b.final - a.final || a.name.localeCompare(b.name));

    // insights
    const all = enriched;
    const avg = all.length ? Math.round(all.reduce((s,x)=>s+x.final,0)/all.length) : 0;
    const top3 = all.slice(0).sort((a,b)=> b.final - a.final || a.name.localeCompare(b.name)).slice(0,3).map(x=>x.name);

    // shared tokens (with ME) — top 3 by count
    const hobCounts = new Map();
    const valCounts = new Map();
    for (const f of all){
      for (const h of f.hobbies) if (ME.hobbies.includes(h)) hobCounts.set(h,(hobCounts.get(h)||0)+1);
      for (const v of f.values)  if (ME.values.includes(v))  valCounts.set(v,(valCounts.get(v)||0)+1);
    }
    const topH = [...hobCounts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3);
    const topV = [...valCounts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3);

    return { romantic, friendship, avg, top3, topH, topV };
  }

  function iconLinkHTML(fr){
    // choose best "Message" target
    if (fr.whatsapp){
      const n = digits(fr.whatsapp);
      return `<a class="icon" href="https://wa.me/${encodeURIComponent(n)}" target="_blank" rel="noopener" title="WhatsApp"><i class="bi bi-whatsapp"></i></a>`;
    }
    if (fr.instagram){
      const h = String(fr.instagram).replace(/^@/,'').trim();
      return `<a class="icon" href="https://instagram.com/${encodeURIComponent(h)}" target="_blank" rel="noopener" title="Instagram"><i class="bi bi-instagram"></i></a>`;
    }
    if (fr.facebook){
      const u = /^https?:/.test(fr.facebook) ? fr.facebook : `https://facebook.com/${fr.facebook}`;
      return `<a class="icon" href="${escapeHTML(u)}" target="_blank" rel="noopener" title="Facebook"><i class="bi bi-facebook"></i></a>`;
    }
    if (fr.email){
      return `<a class="icon" href="mailto:${escapeHTML(fr.email)}" title="Email"><i class="bi bi-envelope"></i></a>`;
    }
    if (fr.contact){
      const u = /^https?:/.test(fr.contact) ? fr.contact : `https://${fr.contact}`;
      return `<a class="icon" href="${escapeHTML(u)}" target="_blank" rel="noopener" title="Link"><i class="bi bi-link-45deg"></i></a>`;
    }
    return '';
  }

  function renderList(container, items){
    const wrap = $(container);
    if (!wrap) return;
    wrap.innerHTML = '';
    const frag = document.createDocumentFragment();

    let visibleCount = 0;
    for (const f of items){
      if (!passesFilters(f)) continue;
      visibleCount++;

      const card = document.createElement('div');
      card.className = 'friend card'; // reuse existing card styles
      card.style.transition='opacity .18s ease, transform .18s ease'; card.style.opacity='0'; card.style.transform='scale(.98)';

      const scoreClass = f.final >= 75 ? 'good' : f.final >= 55 ? 'ok':'low';
      const photo = avatarFor(f.name, f.photo);
      const hint  = `${f.ct} · ${prettyLL(f.ll)}`;

      card.innerHTML = `
        <div class="friend-head">
          <div class="friend-meta">
            <img class="avatar" src="${photo}" alt="" loading="lazy">
            <div>
              <div class="name">${escapeHTML(f.name)}</div>
              <div class="hint" style="opacity:.8">${escapeHTML(hint)}</div>
            </div>
          </div>
          <div class="score ${scoreClass}">${f.final}%</div>
        </div>
        <div class="friend-body">
          ${f.hobbies.length ? `<div class="row"><strong style="opacity:.9">Hobbies:</strong>&nbsp;<span>${escapeHTML(f.hobbies.slice(0,3).join(', '))}${f.hobbies.length>3?` &nbsp;<em class="muted">+${f.hobbies.length-3} more</em>`:''}</span></div>`:''}
          ${f.values.length  ? `<div class="row"><strong style="opacity:.9">Values:</strong>&nbsp;<span>${escapeHTML(f.values.slice(0,3).join(', '))}${f.values.length>3?` &nbsp;<em class="muted">+${f.values.length-3} more</em>`:''}</span></div>`:''}
          <div class="social-icons" style="margin:.4rem 0 .2rem">${iconLinkHTML(f)}</div>
          <div class="row" style="gap:.5rem; flex-wrap:wrap; margin-top:.3rem">
            <a class="btn" href="friends.html" aria-label="Edit ${escapeHTML(f.name)} in Friends">Edit in Friends</a>
            ${iconLinkHTML(f) ? `<span class="btn" role="link" onclick="this.previousElementSibling?.querySelector('a')?.click()" aria-label="Message ${escapeHTML(f.name)}">Message</span>`:''}
            <a class="btn" href="compare.html?b=${encodeURIComponent(f.name)}" aria-label="Compare with ${escapeHTML(f.name)}">Compare →</a>
          </div>
        </div>
      `;
      frag.appendChild(card);
      requestAnimationFrame(()=>{ card.style.opacity='1'; card.style.transform='none'; });
    }
    wrap.appendChild(frag);
    // empty state toggle
    const empty = $('#empty');
    if (empty) empty.style.display = visibleCount ? 'none' : '';
  }

  function renderInsights(data){
    const el = $('#insights');
    if (!el) return;
    const chip = (txt, kind, active=false) =>
      `<button class="chip ${active?'is-active':''}" data-kind="${kind}" data-token="${escapeHTML(txt)}">${escapeHTML(txt)}</button>`;

    const hChips = data.topH.map(([t,c]) => chip(`${t} (${c})`, 'h', STATE.filterH.has(t)));
    const vChips = data.topV.map(([t,c]) => chip(`${t} (${c})`, 'v', STATE.filterV.has(t)));

    el.innerHTML = `
      <div class="card">
        <h4 class="section-title">Overview</h4>
        <p class="muted">Average score: <strong>${data.avg}%</strong></p>
        <p class="muted">Top matches: ${data.top3.length? data.top3.map(escapeHTML).join(', ') : '—'}</p>
      </div>
      <div class="card">
        <h4 class="section-title">Shared Hobbies</h4>
        <div class="row">${hChips.join('') || '<span class="muted">—</span>'}</div>
      </div>
      <div class="card">
        <h4 class="section-title">Shared Values</h4>
        <div class="row">${vChips.join('') || '<span class="muted">—</span>'}</div>
      </div>
    `;

    // toggle chips
    el.addEventListener('click', (e)=>{
      const b = e.target.closest('.chip'); if(!b) return;
      const kind = b.dataset.kind, label = b.dataset.token;
      const raw = (label || '').replace(/\s\(\d+\)$/,'').toLowerCase(); // strip "(N)"
      if (kind==='h'){
        STATE.filterH.has(raw) ? STATE.filterH.delete(raw) : STATE.filterH.add(raw);
      } else if (kind==='v'){
        STATE.filterV.has(raw) ? STATE.filterV.delete(raw) : STATE.filterV.add(raw);
      }
      render(); // full re-render
    }, {once:false});
  }

  function exportJSON(payload){
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `soulink-results-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  }

  function render(){
    const w = Number($('#llWeight')?.value || 1) || 1;
    STATE.weight = Math.max(0, Math.min(2, w));
    $('#llwLabel') && ($('#llwLabel').textContent = `${STATE.weight.toFixed(1)}×`);

    const data = compute(STATE.weight);
    renderInsights(data);
    renderList('#romantic',   data.romantic);
    renderList('#friendship', data.friendship);

    // feed context for feedback (non-blocking)
    fillFeedbackContext({
      avg: data.avg, top3: data.top3,
      hobbies: data.topH.map(([t])=>t),
      values:  data.topV.map(([t])=>t)
    });
  }

  // ========== slider / buttons ==========
  $('#llWeight') && $('#llWeight').addEventListener('input', render);
  $('#btnExport') && $('#btnExport').addEventListener('click', ()=>{
    const data = compute(STATE.weight);
    exportJSON({
      generatedAt: new Date().toISOString(),
      weightLL: STATE.weight,
      me: ME,
      insights: { avg:data.avg, top3:data.top3, topH:data.topH, topV:data.topV },
      romantic: data.romantic.map(({name,ct,ll,hobbies,values,final})=>({name,ct,ll,hobbies,values,score:final})),
      friendship: data.friendship.map(({name,ct,ll,hobbies,values,final})=>({name,ct,ll,hobbies,values,score:final}))
    });
  });
  $('#btnPrint') && $('#btnPrint').addEventListener('click', ()=> window.print());

  // ========== Feedback (EmailJS-friendly, idempotent) ==========
  function restoreDraft(){
    try{
      const d = JSON.parse(localStorage.getItem('soulink.soulFeedbackDraft')||'{}');
      if (d.email) $('#fbEmail').value = d.email;
      if (d.text)  $('#fbText').value  = d.text;
      updateCounter();
    }catch{}
  }
  function saveDraft(){
    const d = { email: $('#fbEmail')?.value || '', text: $('#fbText')?.value || '' };
    localStorage.setItem('soulink.soulFeedbackDraft', JSON.stringify(d));
  }
  function updateCounter(){
    const t = $('#fbText')?.value || '';
    $('#fbCount') && ($('#fbCount').textContent = `${t.length}/600`);
  }
  function setupStars(){
    const box = $('#fbStars'); if(!box) return;
    // accept any children with data-v; if missing, build 5 buttons
    let stars = $$('[data-v]', box);
    if (!stars.length){
      box.innerHTML = '';
      for (let i=1;i<=5;i++){
        const b = document.createElement('button');
        b.type='button'; b.setAttribute('data-v', String(i));
        b.className='star'; b.textContent='★';
        box.appendChild(b);
      }
      stars = $$('[data-v]', box);
    }
    const set = (n)=> stars.forEach(s=> s.classList.toggle('active', Number(s.dataset.v)<=n));
    box.addEventListener('click', e=>{
      const b = e.target.closest('[data-v]'); if(!b) return;
      box.dataset.value = String(b.dataset.v);
      set(Number(b.dataset.v));
    });
    set(Number(box.dataset.value||'5')); // default 5
  }
  function fillFeedbackContext(ctx){
    // stash in hidden meta fields if present (optional)
    const t = $('#feedbackForm'); if(!t) return;
    Object.entries(ctx||{}).forEach(([k,v])=>{
      let input = t.querySelector(`[name="ctx_${k}"]`);
      if(!input){ input = document.createElement('input'); input.type='hidden'; input.name=`ctx_${k}`; t.appendChild(input); }
      input.value = Array.isArray(v) ? v.join(', ') : String(v);
    });
  }
  function setupFeedbackOnce(){
    const form = $('#feedbackForm'); if(!form) return;
    if (form.__wired) return; form.__wired = true;

    setupStars();
    restoreDraft();
    $('#fbText') && $('#fbText').addEventListener('input', ()=>{ updateCounter(); saveDraft(); });
    $('#fbEmail') && $('#fbEmail').addEventListener('input', saveDraft);

    $('#fbSend') && $('#fbSend').addEventListener('click', async (e)=>{
      e.preventDefault();
      const rating = Number($('#fbStars')?.dataset.value || 0) || 0;
      const email  = $('#fbEmail')?.value.trim() || '';
      const text   = $('#fbText')?.value.trim() || '';
      const status = $('#fbStatus'); if (status) status.textContent = 'Sending…';

      const payload = { rating, email, text, at: new Date().toISOString() };
      // prefer EmailJS if available and initialized
      try{
        if (window.emailjs && typeof window.emailjs.send === 'function') {
          // service/template/user keys should already be on page (as you noted)
          // If you expose globals EMAILJS_SERVICE / EMAILJS_TEMPLATE, use them; else send with first service.
          const svc = window.EMAILJS_SERVICE || window.emailServiceID || '';
          const tpl = window.EMAILJS_TEMPLATE || window.emailTemplateID || '';
          if (svc && tpl) {
            await window.emailjs.send(svc, tpl, payload);
          } else {
            // fallback: just log when keys are not present
            console.log('Feedback (no EmailJS keys):', payload);
          }
        } else {
          console.log('Feedback:', payload);
        }
        if (status) status.textContent = 'Thanks for your feedback! 🌟';
        // reset but keep stars at 5 by default
        $('#fbText') && ($('#fbText').value = '');
        $('#fbEmail') && ($('#fbEmail').value = '');
        $('#fbStars') && ($('#fbStars').dataset.value = '5');
        updateCounter();
        localStorage.removeItem('soulink.soulFeedbackDraft');
      }catch(err){
        console.warn(err);
        if (status) status.textContent = 'Sorry, failed to send. Please try again.';
      }
    });
  }

  // ========== boot ==========
  document.addEventListener('DOMContentLoaded', () => {
    // give a sane default to slider label
    $('#llwLabel') && ($('#llwLabel').textContent = `${(Number($('#llWeight')?.value||1)||1).toFixed(1)}×`);
    setupFeedbackOnce();
    render();
  });
})();
