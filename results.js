// results.js — Soulink Results (robust, legacy-safe, no layout changes)
(() => {
  // ========== tiny helpers ==========
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));


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
    
  }
  // Feed the feedback form with current context and (idempotently) wire it
fillFeedbackContext({
  weight: STATE.weight,
  avg: data.avg,
  topNames: data.top3,
  sharedH: data.topH.map(([tag,count]) => ({ tag, count })),
  sharedV: data.topV.map(([tag,count]) => ({ tag, count }))
});
setupFeedbackOnce();

  

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

/* ==================== FEEDBACK (EmailJS + counter + draft) ==================== */

const FEED_DRAFT_KEY = 'soulink.feedback.draft';

// ⚠️ Tik PUBLIC key dėkime į front-end
const EMAILJS = {
  service:   'service_ifo7026',     // <-- jūsų Service ID
  template:  'template_99hg4ni',    // <-- jūsų Template ID
  publicKey: 'SV7ptjuNI88paiVbz'    // <-- jūsų Public Key
};

try { if (window.emailjs && EMAILJS.publicKey) emailjs.init(EMAILJS.publicKey); } catch {}

// Užpildo paslėptus laukus kontekstu (kviesti render() pabaigoje)
function fillFeedbackContext(ctx){
  const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.value = val ?? ''; };
  set('fbWeight', ctx.weight);
  set('fbAvg',    ctx.avg);
  set('fbTop3',   (ctx.topNames || []).join(', '));
  set('fbH',      (ctx.sharedH  || []).map(x=>`${x.tag}(${x.count})`).join(', '));
  set('fbV',      (ctx.sharedV  || []).map(x=>`${x.tag}(${x.count})`).join(', '));
  set('fbTs',     new Date().toISOString());
}

function setupFeedbackOnce(){
  if (setupFeedbackOnce._done) return;
  setupFeedbackOnce._done = true;

  const form   = document.getElementById('feedbackForm');
  if (!form) return;

  const stars  = document.getElementById('fbStars');
  const email  = document.getElementById('fbEmail');
  const text   = document.getElementById('fbText');
  const count  = document.getElementById('fbCount');
  const status = document.getElementById('fbStatus');

  // atstatom draft'ą
  try {
    const d = JSON.parse(localStorage.getItem(FEED_DRAFT_KEY) || '{}');
    if (d.email)  email.value = d.email;
    if (d.text)   text.value  = d.text;
    if (d.rating){
      const r = form.querySelector(`input[name="rating"][value="${d.rating}"]`);
      if (r) r.checked = true;
    }
  } catch {}

  const saveDraft = () => {
    const rating = form.rating?.value || '';
    localStorage.setItem(FEED_DRAFT_KEY, JSON.stringify({
      email: email.value.trim(),
      text : text.value,
      rating
    }));
  };

  const updateCounter = () => { if (count) count.textContent = String(text.value.length); };
  updateCounter();

  text.addEventListener('input', () => { updateCounter(); saveDraft(); });
  email.addEventListener('input', saveDraft);
  stars?.addEventListener('change', saveDraft);

  // default 5★, jei niekas nepasirinkta
  if (!form.rating?.value) {
    const r5 = form.querySelector('input[name="rating"][value="5"]');
    if (r5) r5.checked = true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (status){ status.textContent = 'Sending…'; status.style.color = 'var(--muted)'; }

    const payload = {
      rating : form.rating?.value || '5',
      email  : email.value.trim(),
      message: text.value.trim(),
      weight : document.getElementById('fbWeight')?.value || '',
      avg    : document.getElementById('fbAvg')?.value || '',
      top3   : document.getElementById('fbTop3')?.value || '',
      hobbies: document.getElementById('fbH')?.value || '',
      values : document.getElementById('fbV')?.value || '',
      ts     : new Date().toISOString()
    };

    try {
      if (window.emailjs && EMAILJS.publicKey && EMAILJS.service && EMAILJS.template){
        await emailjs.send(EMAILJS.service, EMAILJS.template, payload);
        if (status){ status.textContent = 'Thanks! Feedback sent 💫'; status.style.color = 'var(--accent)'; }
        localStorage.removeItem(FEED_DRAFT_KEY);
        text.value = ''; updateCounter();
        const r5 = form.querySelector('input[name="rating"][value="5"]'); if (r5) r5.checked = true;
      } else {
        console.log('[Feedback payload] (EmailJS not configured):', payload);
        if (status){ status.textContent = 'Saved locally (EmailJS not configured).'; status.style.color = 'var(--accent)'; }
      }
    } catch (err) {
      console.error(err);
      if (status){ status.textContent = 'Failed to send. Please try again.'; status.style.color = '#ff9a9a'; }
    }
  });
}

// boot (if you already have this block, keep only one)
document.addEventListener('DOMContentLoaded', () => {
  const w = document.getElementById('llWeight');
  const l = document.getElementById('llwLabel');
  if (w && l) l.textContent = `${(+w.value || 1).toFixed(1)}×`;

  setupFeedbackOnce();   // safe idempotent
  render();
});

// close the IIFE that starts at the top of the file
})();
