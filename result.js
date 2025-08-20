(() => {

// ---------- helpers ----------
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const READ = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

const LS_FRIENDS = 'soulFriends';
const LS_ME = 'soulQuiz';

function normList(v){
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x=>String(x).trim().toLowerCase()).filter(Boolean);
  return String(v).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
}
const digits = s => (s||'').toString().replace(/\D+/g,'');

function escapeHTML(str=''){
  return String(str).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
}

function avatarFor(name, photo){
  const url = (photo||'').trim();
  if (/^https?:\/\//i.test(url) || url.startsWith('data:image')) return url;
  const ch = (name||'?').trim().charAt(0).toUpperCase() || 'S';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
       <rect width="100%" height="100%" fill="#064a4a"/>
       <text x="50%" y="58%" font-size="42" font-family="system-ui"
             text-anchor="middle" fill="#00fdd8">${ch}</text>
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
    const h = /^https?:\/\//i.test(f.instagram) ? f.instagram : `https://instagram.com/${f.instagram.replace(/^@/,'')}`;
    items.push(`<a class="icon" href="${h}" target="_blank" rel="noopener" title="Instagram"><i class="bi bi-instagram"></i></a>`);
  }
  if (f.facebook){
    const h = /^https?:\/\//i.test(f.facebook) ? f.facebook : `https://facebook.com/${f.facebook.replace(/^@/,'')}`;
    items.push(`<a class="icon" href="${h}" target="_blank" rel="noopener" title="Facebook"><i class="bi bi-facebook"></i></a>`);
  }
  if (f.email && /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(f.email)){
    items.push(`<a class="icon" href="mailto:${f.email}" title="Email"><i class="bi bi-envelope"></i></a>`);
  }
  return items.length ? `<div class="social-icons">${items.join('')}</div>` : '';
}
function fillFeedbackContext(data){
  $('#fbWeight')?.setAttribute('value', (parseFloat($('#llWeight')?.value || '1')||1).toFixed(1));
  $('#fbAvg')?.setAttribute('value', data.avg);
  $('#fbTop3')?.setAttribute('value', (data.top3||[]).join(', '));
  $('#fbH')?.setAttribute('value', (data.topH||[]).join(', '));
  $('#fbV')?.setAttribute('value', (data.topV||[]).join(', '));
  $('#fbTs')?.setAttribute('value', new Date().toISOString());

  function fillFeedbackContext({avg, top3, topH, topV}){
  const w = parseFloat(document.querySelector('#llWeight')?.value || '1') || 1;
  document.querySelector('#fbWeight')?.setAttribute('value', w.toFixed(1));
  document.querySelector('#fbAvg')?.setAttribute('value', avg ?? 0);
  document.querySelector('#fbTop3')?.setAttribute('value', (top3||[]).join(', '));
  document.querySelector('#fbH')?.setAttribute('value', (topH||[]).join(', '));
  document.querySelector('#fbV')?.setAttribute('value', (topV||[]).join(', '));

  function setupFeedbackOnce(){
  if (setupFeedbackOnce._done) return;
  setupFeedbackOnce._done = true;

  const stars = Array.from(document.querySelectorAll('#fbStars label'));
  const radios = Array.from(document.querySelectorAll('#fbStars input[type="radio"]'));
  const highlight = v => stars.forEach((lab,i)=>lab.classList.toggle('active', i < v));
  stars.forEach((lab,i)=> lab.addEventListener('click', ()=>{ radios[i].checked = true; highlight(i+1); }));
  // default 5*
  if (!radios.some(r=>r.checked)) { radios[4].checked = true; highlight(5); }

  const txt = document.querySelector('#fbText');
  const cnt = document.querySelector('#fbCount');
  const upd = ()=>{ if(cnt&&txt) cnt.textContent = String(txt.value.length); };
  txt?.addEventListener('input', upd); upd();

  const form = document.querySelector('#feedbackForm');
  const btn  = document.querySelector('#fbSend');
  const status = document.querySelector('#fbStatus');

  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const rating = (document.querySelector('input[name="rating"]:checked')||{}).value || '';
    if (!rating){ alert('Please select a rating.'); return; }

    const params = {
      user_email: (document.querySelector('#fbEmail')?.value || '').trim(),
      page: 'result.html',
      rating,
      feedback: (txt?.value || '').trim(),
      weightLL: document.querySelector('#fbWeight')?.value || '',
      avg: document.querySelector('#fbAvg')?.value || '',
      top3: document.querySelector('#fbTop3')?.value || '',
      sharedHobbies: document.querySelector('#fbH')?.value || '',
      sharedValues: document.querySelector('#fbV')?.value || ''
    };

    btn.disabled = true; const old = btn.textContent; btn.textContent = 'Sending…'; status.textContent = '';

    try{ emailjs.init('UYuKR_3UnPjeqJFL7'); }catch(_){} // saugu kartoti
    emailjs.send('service_3j9h9ei', 'template_99hg4ni', params)
      .then(()=>{
        status.textContent = '✓ Sent. Ačiū!'; form.reset();
        radios.forEach(r=>r.checked=false); radios[4].checked=true; highlight(5); upd();
      })
      .catch(err=>{
        console.error(err);
        status.textContent = '✘ Send failed. Try again later.';
      })
      .finally(()=>{ btn.disabled=false; btn.textContent=old; });
  });
}
function setupFeedbackOnce(){
  if (setupFeedbackOnce._done) return;
  setupFeedbackOnce._done = true;

  const stars = Array.from(document.querySelectorAll('#fbStars label'));
  const radios = Array.from(document.querySelectorAll('#fbStars input[type="radio"]'));
  const highlight = v => stars.forEach((lab,i)=>lab.classList.toggle('active', i < v));
  stars.forEach((lab,i)=> lab.addEventListener('click', ()=>{ radios[i].checked = true; highlight(i+1); }));
  // default 5*
  if (!radios.some(r=>r.checked)) { radios[4].checked = true; highlight(5); }

  const txt = document.querySelector('#fbText');
  const cnt = document.querySelector('#fbCount');
  const upd = ()=>{ if(cnt&&txt) cnt.textContent = String(txt.value.length); };
  txt?.addEventListener('input', upd); upd();

  const form = document.querySelector('#feedbackForm');
  const btn  = document.querySelector('#fbSend');
  const status = document.querySelector('#fbStatus');

  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const rating = (document.querySelector('input[name="rating"]:checked')||{}).value || '';
    if (!rating){ alert('Please select a rating.'); return; }

    const params = {
      user_email: (document.querySelector('#fbEmail')?.value || '').trim(),
      page: 'result.html',
      rating,
      feedback: (txt?.value || '').trim(),
      weightLL: document.querySelector('#fbWeight')?.value || '',
      avg: document.querySelector('#fbAvg')?.value || '',
      top3: document.querySelector('#fbTop3')?.value || '',
      sharedHobbies: document.querySelector('#fbH')?.value || '',
      sharedValues: document.querySelector('#fbV')?.value || ''
    };

    btn.disabled = true; const old = btn.textContent; btn.textContent = 'Sending…'; status.textContent = '';

    try{ emailjs.init('UYuKR_3UnPjeqJFL7'); }catch(_){} // saugu kartoti
    emailjs.send('service_3j9h9ei', 'template_99hg4ni', params)
      .then(()=>{
        status.textContent = '✓ Sent. Ačiū!'; form.reset();
        radios.forEach(r=>r.checked=false); radios[4].checked=true; highlight(5); upd();
      })
      .catch(err=>{
        console.error(err);
        status.textContent = '✘ Send failed. Try again later.';
      })
      .finally(()=>{ btn.disabled=false; btn.textContent=old; });
  });
}

  // Prefill email iš quiz, jei turim
  try {
    const me = JSON.parse(localStorage.getItem('soulQuiz')||'{}');
    if (me.email && document.querySelector('#fbEmail') && !document.querySelector('#fbEmail').value){
      document.querySelector('#fbEmail').value = me.email;
    }
  } catch {}
}

  // Prefill vardą/el. paštą jei yra quiz’e
  const m = READ(LS_ME) || {};
  if (m.name && $('#fbName') && !$('#fbName').value) $('#fbName').value = m.name;
  if (m.email && $('#fbEmail') && !$('#fbEmail').value) $('#fbEmail').value = m.email;
}


// ---------- data ----------
function me(){
  const m = READ(LS_ME) || {};
  $('#me-name')?.replaceChildren(document.createTextNode(m.name || '–'));
  $('#me-ct')?.replaceChildren(document.createTextNode(m.connectionType || '–'));
  $('#me-ll')?.replaceChildren(document.createTextNode(m.loveLanguage || '–'));
  $('#me-hobbies')?.replaceChildren(document.createTextNode(
    Array.isArray(m.hobbies) ? m.hobbies.join(', ') : (m.hobbies || '–')
  ));
  $('#me-values')?.replaceChildren(document.createTextNode(
    Array.isArray(m.values) ? m.values.join(', ') : (m.values || '–')
  ));

  return {
    name: m.name || '',
    ct: m.connectionType || '',
    ll: m.loveLanguage || '',
    hobbies: m.hobbies || [],
    values: m.values || [],
    photo: m.profilePhoto1 || ''
  };
}
function friends(){
  const list = READ(LS_FRIENDS);
  return Array.isArray(list) ? list : [];
}

// ---------- scoring (same logic as Match) ----------
function jaccard(a,b){
  const A = new Set(normList(a)), B = new Set(normList(b));
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0; A.forEach(v => { if (B.has(v)) inter++; });
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}
function llMatch(a, b){
  if (!a || !b) return 0;
  return a.trim().toLowerCase() === b.trim().toLowerCase() ? 1 : 0;
}
function ctMatch(desired, candidate){
  if (!desired || desired === 'Any') return 1;
  if (!candidate) return 0;
  if (candidate === 'Both') return 1;
  return desired.toLowerCase() === candidate.toLowerCase() ? 1 : 0;
}
function score(me, f, weightLL=1){
  const sLL = 25 * llMatch(me.ll, f.ll) * weightLL;
  const sCT = 15 * ctMatch(me.ct, f.ct);
  const sH  = 30 * jaccard(me.hobbies, f.hobbies);
  const sV  = 30 * jaccard(me.values,  f.values);
  let total = sLL + sCT + sH + sV;

  const infoPieces =
    (f.ll?1:0) + (normList(f.hobbies).length?1:0) + (normList(f.values).length?1:0);
  if (infoPieces <= 1) total *= 0.8;

  return Math.max(0, Math.min(100, Math.round(total)));
}

// ---------- results ----------
function compute(weightLL=1){
  const M = me();
  const list = friends();
  const rows = list.map(f => ({ f, s: score(M, f, weightLL) }));

  // buckets
  const rom = rows
    .filter(({f}) => f.ct === 'Romantic' || f.ct === 'Both')
    .sort((a,b)=>b.s-a.s || String(a.f.name||'').localeCompare(b.f.name||''))
    .slice(0,6);

  const fri = rows
    .filter(({f}) => f.ct === 'Friendship' || f.ct === 'Both')
    .sort((a,b)=>b.s-a.s || String(a.f.name||'').localeCompare(b.f.name||''))
    .slice(0,6);

  // insights
  const avg = rows.length ? Math.round(rows.reduce((t,r)=>t+r.s,0)/rows.length) : 0;
  const top3 = rows.slice().sort((a,b)=>b.s-a.s).slice(0,3).map(x=>x.f.name).filter(Boolean);

  // most common hobby/value intersections
  const myH = new Set(normList(M.hobbies));
  const myV = new Set(normList(M.values));
  const countsH = {};
  const countsV = {};
  rows.forEach(({f})=>{
    normList(f.hobbies).forEach(h=>{ if (myH.has(h)) countsH[h]=(countsH[h]||0)+1; });
    normList(f.values).forEach(v=>{ if (myV.has(v)) countsV[v]=(countsV[v]||0)+1; });
  });
  const topH = Object.entries(countsH).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
  const topV = Object.entries(countsV).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);

  return { rom, fri, avg, top3, topH, topV, me:M };
}

function messageLinkHTML(f){
  if (f.whatsapp && digits(f.whatsapp))
    return `<a class="btn" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">Message</a>`;
  if (f.instagram)
    return `<a class="btn" href="${/^https?:\/\//i.test(f.instagram)?f.instagram:'https://instagram.com/'+f.instagram.replace(/^@/,'')}" target="_blank" rel="noopener">Message</a>`;
  if (f.facebook)
    return `<a class="btn" href="${/^https?:\/\//i.test(f.facebook)?f.facebook:'https://facebook.com/'+f.facebook.replace(/^@/,'')}" target="_blank" rel="noopener">Message</a>`;
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
  const name = (f.name || '').trim();
  if (!name) return '';
  return `<a class="btn" href="compare.html?a=me&b=${encodeURIComponent(name)}">Compare →</a>`;
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
              ${escapeHTML(f.ct || '—')} · ${escapeHTML(f.ll || '—')}
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

// ---------- UI ----------
function render(){
  

  const w = parseFloat($('#llWeight').value || '1') || 1;
  $('#llwLabel').textContent = w.toFixed(1)+'×';

  const { rom, fri, avg, top3, topH, topV } = compute(w);

  fillFeedbackContext({avg, top3, topH, topV});
  setupFeedbackOnce();


  const romEl = $('#romantic'), friEl = $('#friendship'), emptyEl = $('#empty');

  const hasAny = rom.length || fri.length;
  emptyEl.style.display = hasAny ? 'none' : 'block';
  

  renderList(romEl, rom);
  renderList(friEl, fri);

  // insights
  $('#insights').innerHTML = `
    <div class="card" style="padding: .8rem;">
      <div class="section-title" style="margin:.1rem 0 .4rem;">Overview</div>
      <div>Average score: <span class="pill">${avg}%</span></div>
      <div>Top matches: ${top3.length ? top3.map(n=>`<span class="pill" style="margin-right:.3rem;">${escapeHTML(n)}</span>`).join('') : '—'}</div>
    </div>
    <div class="card" style="padding:.8rem;">
      <div class="section-title" style="margin:.1rem 0 .4rem;">Shared Hobbies</div>
      ${topH.length ? topH.map(n=>`<span class="pill" style="margin-right:.3rem;">${escapeHTML(n)}</span>`).join('') : '—'}
    </div>
    <div class="card" style="padding:.8rem;">
      <div class="section-title" style="margin:.1rem 0 .4rem;">Shared Values</div>
      ${topV.length ? topV.map(n=>`<span class="pill" style="margin-right:.3rem;">${escapeHTML(n)}</span>`).join('') : '—'}
    </div>
  `;
}

// controls
$('#llWeight')?.addEventListener('input', render);
$('#btnPrint')?.addEventListener('click', () => window.print());
$('#btnExport')?.addEventListener('click', () => {
  const w = parseFloat($('#llWeight').value || '1') || 1;
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

// init
render(); 

// ----- feedback submit -----
const fbForm = $('#feedbackForm');
if (fbForm && fbForm.action && fbForm.action !== 'FORM_ENDPOINT_HERE'){
  fbForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const status = $('#fbStatus');
    status.textContent = 'Sending…';

    try{
      const fd = new FormData(fbForm);
      const res = await fetch(fbForm.action, {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok){
        status.textContent = 'Ačiū! Gauta 💚';
        fbForm.reset();
        fillFeedbackContext({ // atstatom hidden po reset
          avg: $('#fbAvg')?.value || 0,
          top3: ($('#fbTop3')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
          topH: ($('#fbH')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
          topV: ($('#fbV')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
        });
      } else {
        status.textContent = 'Submit nepavyko, bandau atidaryti el. paštą…';
        window.location.href = `mailto:hello@soulink.global?subject=Soulink%20Beta%20Feedback&body=${encodeURIComponent([...fd.entries()].map(([k,v])=>`${k}: ${v}`).join('\n'))}`;
      }
    }catch(err){
      status.textContent = 'Offline? Bandau el. paštu…';
      const fd = new FormData(fbForm);
      window.location.href = `mailto:hello@soulink.global?subject=Soulink%20Beta%20Feedback&body=${encodeURIComponent([...fd.entries()].map(([k,v])=>`${k}: ${v}`).join('\n'))}`;
    }
  });
}

})();
