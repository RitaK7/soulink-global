(() => {
  // ---- storage helpers (place at top of results.js) ----
function readJSON(keys, fallback){
  if (!Array.isArray(keys)) keys = [keys];
  for (const k of keys){
    try {
      const v = JSON.parse(localStorage.getItem(k));
      if (v) return v;
    } catch {}
  }
  return fallback;
}

// Accept both legacy and new keys
const QUIZ    = readJSON(['soulink.soulQuiz','soulQuiz'], {});
const FRIENDS = readJSON(['soulink.friends.list','soulink.friends','soulFriends'], []);

  'use strict';

  // =============== tiny helpers ===============
  const $  = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  // ===== storage helpers (support legacy keys) =====
const READ_JSON = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

const ME_KEYS      = ['soulink.soulQuiz', 'soulQuiz'];
const FRIENDS_KEYS = ['soulink.friends.list', 'soulFriends'];

function readFirst(keys){
  for (const k of keys){
    const v = READ_JSON(k);
    if (v && (Array.isArray(v) ? v.length : Object.keys(v).length)) return v;
  }
  return Array.isArray(keys) && keys.includes('soulink.friends.list') ? [] : {};
}
  function normList(v){
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x=>String(x).trim().toLowerCase()).filter(Boolean);
  return String(v).split(/[,|]/).map(s=>s.trim().toLowerCase()).filter(Boolean);
}
const digits = s => (s||'').toString().replace(/\D+/g,'');

function normaliseFriend(raw){
  const r = raw || {};
  const name = r.name || r.fullName || '';
  const ct   = (r.connection || r.ct || 'both').toLowerCase(); // friendship|romantic|both
  let ll     = (r.loveLanguage || r.ll || r.love_language || 'unknown')
                .toString().toLowerCase().replace(/\s+/g,'_');  // acts|gifts|quality_time|...

  const hobbies = normList(r.hobbies); // į lower-case sąrašą
  const values  = normList(r.values);

  return {
    name,
    ct,
    ll,
    hobbies,
    values,
    photo:     r.photo || r.avatar || r.image || '',
    whatsapp:  r.whatsapp || r.phone || '',
    instagram: r.instagramHandle || r.instagram || '',
    facebook:  r.facebook || '',
    email:     r.email || (r.contacts && r.contacts.email) || '',
    contact:   r.contact || ''
  };
}

  function avatarFor(name, photo){
    const url = (photo||'').trim();
    if (/^https?:\/\//i.test(url) || url.startsWith('data:image')) return url;
    const ch = (name||'?').trim().charAt(0).toUpperCase() || 'S';
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
         <rect width="100%" height="100%" fill="#064a4a"/>
         <text x="50%" y="58%" font-size="42" font-family="system-ui"
               text-anchor="middle" fill="#FFD166">${ch}</text>
       </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function socialIconsHTML(f){
    const items = [];
    if (f.whatsapp){
      const n = digits(f.whatsapp);
      if (n) items.push(`<a class="icon" href="https://wa.me/${n}" target="_blank" rel="noopener" title="WhatsApp"><i class="bi bi-whatsapp"></i></a>`);
    }
    if (f.instagram){
      const u = /^https?:\/\//i.test(f.instagram) ? f.instagram : `https://instagram.com/${f.instagram.replace(/^@/,'')}`;
      items.push(`<a class="icon" href="${u}" target="_blank" rel="noopener" title="Instagram"><i class="bi bi-instagram"></i></a>`);
    }
    if (f.facebook){
      const u = /^https?:\/\//i.test(f.facebook) ? f.facebook : `https://facebook.com/${f.facebook.replace(/^@/,'')}`;
      items.push(`<a class="icon" href="${u}" target="_blank" rel="noopener" title="Facebook"><i class="bi bi-facebook"></i></a>`);
    }
    if (f.email && /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(f.email)){
      items.push(`<a class="icon" href="mailto:${f.email}" title="Email"><i class="bi bi-envelope"></i></a>`);
    }
    return items.length ? `<div class="social-icons">${items.join('')}</div>` : '';
  }
  // global filters for Shared Hobbies / Values chips
const STATE = { filterH: new Set(), filterV: new Set() };

function matchesFilters(f){
  if (STATE.filterH.size){
    const hasAllH = [...STATE.filterH].every(t => f.hobbies.includes(t));
    if (!hasAllH) return false;
  }
  if (STATE.filterV.size){
    const hasAllV = [...STATE.filterV].every(t => f.values.includes(t));
    if (!hasAllV) return false;
  }
  return true;
}

  // =============== data ===============
 function me(){
  const m = readFirst(ME_KEYS) || {};
  const llArr = Array.isArray(m.loveLanguages) ? m.loveLanguages : [];
  const primary = (m.loveLanguage || llArr[0] || '–');

  // Fill Snapshot safely (dashes if missing)
  document.querySelector('#me-name')?.replaceChildren(document.createTextNode(m.name || '–'));
  document.querySelector('#me-ct')  ?.replaceChildren(document.createTextNode(m.connectionType || m.connection || '–'));
  document.querySelector('#me-ll')  ?.replaceChildren(document.createTextNode(primary || '–'));
  document.querySelector('#me-hobbies')?.replaceChildren(
    document.createTextNode(Array.isArray(m.hobbies) ? m.hobbies.join(', ') : (m.hobbies || '–'))
  );
  document.querySelector('#me-values')?.replaceChildren(
    document.createTextNode(Array.isArray(m.values) ? m.values.join(', ') : (m.values || '–'))
  );
    return {
      name: m.name || '',
      ct: m.connectionType || '',
      ll: m.loveLanguage || '',
      hobbies: m.hobbies || [],
      values: m.values || [],
      photo: m.profilePhoto1 || '',
      email: m.email || ''
    };
  }
function friends(){
  const list = readFirst(FRIENDS_KEYS);
  return Array.isArray(list) ? list : [];
}
el('#me-ll').textContent = (primaryLoveLanguage || '—');


  // =============== scoring ===============
function jaccard(a,b){
  const A = new Set(a), B = new Set(b);
  if (!A.size && !B.size) return 0;
  let inter = 0; A.forEach(v => { if (B.has(v)) inter++; });
  const union = A.size + B.size - inter;
  return union ? inter/union : 0;
}
  function llMatch(a,b){
    if (!a || !b) return 0;
    return a.trim().toLowerCase() === b.trim().toLowerCase() ? 1 : 0;
  }
  function ctMatch(desired, candidate){
    if (!desired || desired === 'Any') return 1;
    if (!candidate) return 0;
    if (candidate === 'Both') return 1;
    return desired.toLowerCase() === candidate.toLowerCase() ? 1 : 0;
  }
  function score(meObj, f, wLL=1){
  // spec: Final = (hobbies + values + w*LL) / (2 + w)
  const STATE = { filterH: new Set(), filterV: new Set() };
const matchesFilters = f => {
  if (STATE.filterH.size && ![...STATE.filterH].every(t => f.hobbies.includes(t))) return false;
  if (STATE.filterV.size && ![...STATE.filterV].every(t => f.values.includes(t)))  return false;
  return true;
};
  const sH = 100 * jaccard(normList(meObj.hobbies), f.hobbies);
  const sV = 100 * jaccard(normList(meObj.values),  f.values);
  const sL = (meObj.ll && f.ll) ? (meObj.ll === f.ll ? 100 : 0) : 0;
  const total = (sH + sV + wLL*sL) / (2 + wLL);
  return Math.round(Math.max(0, Math.min(100, total)));
}

  // =============== compute ===============
  function compute(weightLL=1){
  const M = me();
  const list = friends().map(normaliseFriend);

  const rows = list.map(f => ({ f, s: score(M, f, weightLL) }));
  // filter buckets
  const rom = rows.filter(({f}) => f.ct === 'romantic'   || f.ct === 'both')
                  .sort((a,b)=> b.s - a.s || a.f.name.localeCompare(b.f.name));
  const fri = rows.filter(({f}) => f.ct === 'friendship' || f.ct === 'both')
                  .sort((a,b)=> b.s - a.s || a.f.name.localeCompare(b.f.name));

  const avg = rows.length ? Math.round(rows.reduce((t,r)=>t+r.s,0)/rows.length) : 0;
  const top3 = rows.slice().sort((a,b)=>b.s-a.s).slice(0,3).map(x=>x.f.name).filter(Boolean);

  // shared with me
  const myH = new Set(normList(M.hobbies));
  const myV = new Set(normList(M.values));
  const countsH = {}, countsV = {};
  rows.forEach(({f})=>{
    f.hobbies.forEach(h=>{ if (myH.has(h)) countsH[h]=(countsH[h]||0)+1; });
    f.values .forEach(v=>{ if (myV.has(v)) countsV[v]=(countsV[v]||0)+1; });
  });
  const topH = Object.entries(countsH).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
  const topV = Object.entries(countsV).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);

  return { rom, fri, avg, top3, topH, topV, me: M };
}

  // =============== UI for cards & links ===============
  function messageLinkHTML(f){
    if (f.whatsapp && digits(f.whatsapp))
      return `<a class="btn" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">Message</a>`;
    if (f.instagram){
      const u = /^https?:\/\//i.test(f.instagram) ? f.instagram : `https://instagram.com/${f.instagram.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.facebook){
      const u = /^https?:\/\//i.test(f.facebook) ? f.facebook : `https://facebook.com/${f.facebook.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.email && /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(f.email))
      return `<a class="btn" href="mailto:${f.email}">Message</a>`;
    if (f.contact){
      const v = String(f.contact).trim();
      if (/^https?:\/\//i.test(v)) return `<a class="btn" href="${v}" target="_blank" rel="noopener">Message</a>`;
      if (/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v)) return `<a class="btn" href="mailto:${v}">Message</a>`;
      if (/^\+?\d[\d\s-]{6,}$/.test(v)) return `<a class="btn" href="https://wa.me/${digits(v)}" target="_blank" rel="noopener">Message</a>`;
      if (/^@?[\w.]{2,}$/i.test(v)) return `<a class="btn" href="https://instagram.com/${v.replace(/^@/,'')}" target="_blank" rel="noopener">Message</a>`;
    }
    return '';
  }
  function compareLinkHTML(f){
    const name = (f.name||'').trim();
    return name ? `<a class="btn" href="compare.html?a=me&b=${encodeURIComponent(name)}">Compare →</a>` : '';
  }

  function renderList(el, items){
    el.innerHTML = '';
    items.forEach(({f,s})=>{
      const card = document.createElement('div');
      card.className = 'match-card';
      const cls = s >= 75 ? 'good' : s >= 55 ? 'ok' : 'low';
      const hobbies = normList(f.hobbies).join(', ');
      const values  = normList(f.values).join(', ');
      card.innerHTML = `
        <div class="head">
          <div class="meta">
            <img class="avatar" src="${avatarFor(f.name, f.photo)}" alt="">
            <div style="min-width:0;">
              <div class="name">${escapeHTML(f.name||'—')}</div>
              <div class="hint" style="font-size:.9rem;">
                ${escapeHTML(f.ct||'—')} · ${escapeHTML(f.ll||'—')}
              </div>
            </div>
          </div>
          <span class="score ${cls}" title="Compatibility">${s}%</span>
        </div>

        ${socialIconsHTML(f)}

        ${hobbies ? `<div><b>Hobbies:</b> ${escapeHTML(hobbies)}</div>` : ''}
        ${values  ? `<div><b>Values:</b> ${escapeHTML(values)}</div>`   : ''}

        <div class="row" style="margin-top:.6rem;">
          <a class="btn" href="friends.html">Edit in Friends</a>
          ${messageLinkHTML(f)}
          ${compareLinkHTML(f)}
        </div>
      `;
      el.appendChild(card);
    });
  }

  // =============== EmailJS loader (NO send here) ===============
  // Public Key (iš tavo EmailJS paskyros): SV7ptjuNI88paiVbz
  const EMAILJS_PUBLIC = 'SV7ptjuNI88paiVbz';
  const EMAILJS_SERVICE = 'service_ifo7026';
  const EMAILJS_TEMPLATE = 'template_99hg4ni';

  function ensureEmailJSReady(cb){
    if (window.emailjs && typeof window.emailjs.send === 'function'){
      try{ emailjs.init(EMAILJS_PUBLIC); }catch(_){}
      cb && cb(); return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js';
    s.onload = () => { try{ emailjs.init(EMAILJS_PUBLIC); }catch(_){}
                      cb && cb(); };
    document.head.appendChild(s);
  }

  // =============== Feedback helpers ===============
  function pickFeedbackForm(){
    return document.querySelector('#feedbackForm') || null;
  }

function fillFeedbackContext({avg, top3, topH, topV}){
  const w = parseFloat($('#llWeight')?.value || '1') || 1;
  $('#fbWeight')?.setAttribute('value', w.toFixed(1));
  $('#fbAvg')?.setAttribute('value', avg ?? 0);
  $('#fbTop3')?.setAttribute('value', (top3||[]).join(', '));
  $('#fbH')?.setAttribute('value', (topH||[]).join(', '));
  $('#fbV')?.setAttribute('value', (topV||[]).join(', '));
  $('#fbTs')?.setAttribute('value', new Date().toISOString());

  // ← naudok mūsų saugų skaitytuvą
  try{
    const m = readFirst(ME_KEYS) || {};
    if (m.email && $('#fbEmail') && !$('#fbEmail').value) $('#fbEmail').value = m.email;
  }catch{}
}


  function setupFeedbackOnce(){
    if (setupFeedbackOnce._done) return;
    const form = pickFeedbackForm();
    if (!form) return;
    setupFeedbackOnce._done = true;

    const stars  = Array.from(form.querySelectorAll('#fbStars label'));
    const radios = Array.from(form.querySelectorAll('#fbStars input[type="radio"]'));
    const txt    = form.querySelector('#fbText');
    const cnt    = form.querySelector('#fbCount');
    const btn    = form.querySelector('#fbSend');
    const status = form.querySelector('#fbStatus');

    // stars UI
    const highlight = v => stars.forEach((lab,i)=>lab.classList.toggle('active', i < v));
    stars.forEach((lab,i)=> lab.addEventListener('click', ()=>{ radios[i].checked = true; highlight(i+1); }));
    if (!radios.some(r=>r.checked)) { radios[4].checked = true; highlight(5); }

    // counter
    const upd = ()=>{ if (cnt && txt) cnt.textContent = String(txt.value.length); };
    txt?.addEventListener('input', upd); upd();

    // submit
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const rating = (form.querySelector('input[name="rating"]:checked')||{}).value || '';
      if (!rating){ alert('Please select a rating.'); return; }

      const params = {
        user_email: (form.querySelector('#fbEmail')?.value || '').trim(),
        page: 'results.html',
        rating,
        feedback: (txt?.value || '').trim(),
        weightLL: $('#fbWeight')?.value || '',
        avg: $('#fbAvg')?.value || '',
        top3: $('#fbTop3')?.value || '',
        sharedHobbies: $('#fbH')?.value || '',
        sharedValues: $('#fbV')?.value || ''
      };

      if (btn){ btn.disabled = true; btn.dataset._old = btn.textContent; btn.textContent = 'Sending…'; }
      if (status) status.textContent = '';

      ensureEmailJSReady(()=>{
        emailjs
          .send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, params, EMAILJS_PUBLIC)
          .then(()=>{
            if (status) status.textContent = '✓ Sent. Thank you!';
            form.reset();
            radios.forEach(r=>r.checked=false); radios[4].checked=true; highlight(5); upd();
          })
          .catch(err=>{
            console.error('EmailJS error:', err, err?.text || '');
            if (status) status.textContent = '✘ Send failed. Try again later.';
          })
          .finally(()=>{
            if (btn){ btn.disabled = false; btn.textContent = btn.dataset._old || 'Send Feedback'; }
          });
      });
    });
  }

  // =============== render ===============
  function render(){
  const romF = rom.filter(({f}) => matchesFilters(f));
  const friF = fri.filter(({f}) => matchesFilters(f));

  emptyEl && (emptyEl.style.display = (romF.length || friF.length) ? 'none' : 'block');
  romEl && renderList(romEl, romF);
  friEl && renderList(friEl, friF);
 
    // insights
      const ins = $('#insights');
if (ins){
  ins.innerHTML = `
    <div class="card" style="padding:.8rem;">
      <div class="section-title" style="margin:.1rem 0 .4rem;">Overview</div>
      <div>Average score: <span class="pill">${avg}%</span></div>
      <div>Top matches: ${
        top3.length ? top3.map(n=>`<span class="pill" style="margin-right:.3rem;">${escapeHTML(n)}</span>`).join('') : '—'
      }</div>
    </div>
    <div class="card" style="padding:.8rem;">
      <div class="section-title" style="margin:.1rem 0 .4rem;">Shared Hobbies</div>
      ${topH.length ? topH.map(n=>`<button class="pill" data-val="${n}" type="button" style="margin-right:.3rem;">${escapeHTML(n)}</button>`).join('') : '—'}
    </div>
    <div class="card" style="padding:.8rem;">
      <div class="section-title" style="margin:.1rem 0 .4rem;">Shared Values</div>
      ${topV.length ? topV.map(n=>`<button class="pill" data-val="${n}" type="button" style="margin-right:.3rem;">${escapeHTML(n)}</button>`).join('') : '—'}
    </div>
  `;
  const wireChip = (sel, set) => {
    ins.querySelectorAll(sel).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const v = btn.dataset.val;
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) set.add(v); else set.delete(v);
        render(); // perpiešiam su filtrais
      });
    });
  };
  wireChip('.card:nth-child(2) .pill', STATE.filterH);
  wireChip('.card:nth-child(3) .pill', STATE.filterV);
}


    // feedback context + one-time setup
    fillFeedbackContext({avg, top3, topH, topV});
    setupFeedbackOnce();
  }

  // =============== events ===============
  $('#llWeight')?.addEventListener('input', render);
  render();

  $('#btnPrint')?.addEventListener('click', () => window.print());

  $('#btnExport')?.addEventListener('click', () => {
    const w = parseFloat($('#llWeight')?.value || '1') || 1;
    const data = compute(w);
    const out = {
      generatedAt: new Date().toISOString(),
      weightLL: w,
      me: data.me,
      romantic: data.rom.map(r=>({score:r.s, ...r.f})),
      friendship: data.fri.map(r=>({score:r.s, ...r.f})),
      insights: { average:data.avg, topMatches:data.top3, sharedHobbies:data.topH, sharedValues:data.topV }
    };
    const blob = new Blob([JSON.stringify(out,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'soulink-results.json'; a.click();
    URL.revokeObjectURL(url);
  });

  // =============== init ===============
  // example usage inside your init:
hydrateSnapshot(QUIZ);     // fills name/connection/love language/hobbies/values
renderAll(FRIENDS);        // whatever function populates the lists

  render();

})();
