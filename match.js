(() => {
/* =========================
   Soulink · Match Lab
   ========================= */
const $ = s => document.querySelector(s);
const READ = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

/* --------- snapshot (me) ---------- */
function me(){
  const m = READ('soulQuiz') || {};
  return {
    name: m.name || '',
    ct: m.connectionType || '',
    ll: m.loveLanguage || (Array.isArray(m.loveLanguages) ? m.loveLanguages[0] : ''),
    hobbies: m.hobbies || [],
    values:  m.values  || [],
  };
}
function friends(){
  const list = READ('soulFriends');
  return Array.isArray(list) ? list : [];
}

/* --------- utils ---------- */
function normList(v){
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x=>String(x).trim().toLowerCase()).filter(Boolean);
  return String(v).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
}
const digits = s => (s||'').toString().replace(/\D+/g,'');
function escapeHTML(str=''){
  return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function hobbyIco(lbl=''){ const s=lbl.toLowerCase();
  if(s.includes('music'))return'🎵'; if(s.includes('read'))return'📚'; if(s.includes('medit'))return'🧘';
  if(s.includes('travel'))return'✈️'; if(s.includes('cook'))return'🍳'; if(s.includes('bake'))return'🧁';
  if(s.includes('art'))return'🎨'; if(s.includes('photo'))return'📷'; if(s.includes('gym'))return'🏋️';
  if(s.includes('run'))return'🏃'; if(s.includes('hike'))return'🥾'; if(s.includes('garden'))return'🌿';
  if(s.includes('movie'))return'🎬'; if(s.includes('game'))return'🎮'; return '✨';
}
function valueIco(lbl=''){ const s=lbl.toLowerCase();
  if(s.includes('honest'))return'💎'; if(s.includes('kind'))return'❤️'; if(s.includes('growth'))return'🌱';
  if(s.includes('freedom'))return'🌞'; if(s.includes('family'))return'👨‍👩‍👧'; if(s.includes('humor'))return'😂';
  if(s.includes('respect'))return'🤝'; if(s.includes('spirit'))return'🕊️'; if(s.includes('curios'))return'🔭';
  return '✨';
}
function avatarFor(name, photo){
  const url=(photo||'').trim();
  if(/^https?:\/\//i.test(url)||url.startsWith('data:image')) return url;
  const ch=(name||'?').trim().charAt(0).toUpperCase()||'S';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="100%" height="100%" fill="#064a4a"/><text x="50%" y="58%" font-size="42" font-family="system-ui"
    text-anchor="middle" fill="#00fdd8">${ch}</text></svg>`;
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}

/* --------- scoring ---------- */
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
/* score (0..100)
   25 * LL_match * weightLL
 + 15 * CT_match
 + 30 * Jaccard(hobbies)
 + 30 * Jaccard(values)
*/
function score(me, f, weightLL=1){
  const sLL = 25 * llMatch(me.ll, f.ll) * weightLL;
  const sCT = 15 * ctMatch(me.ct, f.ct);
  const sH  = 30 * jaccard(me.hobbies, f.hobbies);
  const sV  = 30 * jaccard(me.values,  f.values);
  let total = sLL + sCT + sH + sV;
  const infoPieces = (f.ll?1:0) + (normList(f.hobbies).length?1:0) + (normList(f.values).length?1:0);
  if (infoPieces <= 1) total *= 0.8;
  return Math.max(0, Math.min(100, Math.round(total)));
}

/* --------- ring progress ---------- */
function ring(pct){
  const C = 2*Math.PI*32; // r=32 (svg viewBox 76)
  const off = C * (1 - Math.max(0, Math.min(1, pct/100)));
  return `
    <div class="mlab-ring" title="Compatibility">
      <svg viewBox="0 0 76 76" aria-hidden="true">
        <circle class="track" cx="38" cy="38" r="32"></circle>
        <circle class="prog"  cx="38" cy="38" r="32" stroke-dasharray="${C}" stroke-dashoffset="${C}"></circle>
      </svg>
      <div class="num">${pct}<small>%</small></div>
    </div>
  `;
}
function animateRings(scope=document){
  const els = Array.from(scope.querySelectorAll('.mlab-ring .prog'));
  els.forEach(el=>{
    const C = parseFloat(el.getAttribute('stroke-dasharray'))||201.06;
    // target from sibling num
    const pct = Number(el.closest('.mlab-ring').querySelector('.num').textContent.replace(/[^0-9.]/g,''))||0;
    const target = C * (1 - Math.max(0, Math.min(1, pct/100)));
    // kick animation
    requestAnimationFrame(()=>{ el.style.strokeDashoffset = target; });
  });
}
// --- nav active (safe to keep even if exists elsewhere)
(() => {
  const page = document.body.dataset.page;
  document.querySelectorAll('.topnav a[data-nav]').forEach(a => {
    if (a.dataset.nav === page) a.setAttribute('data-active', '1');
  });
})();


/* --------- UI helpers ---------- */
const resultsEl = document.querySelector('#matchGrid') || document.querySelector('#results');
const emptyEl   = document.querySelector('#mlabEmpty') || document.querySelector('#empty')
|| (()=>{ const p=document.createElement('p'); p.style.display='none'; resultsEl?.after?.(p); return p; })();

function listChips(title, list, iconFn){
  if(!list || !list.length) return '';
  const chips = list.slice(0,8).map(v=>`<span class="chip"><span class="ico">${iconFn(v)}</span><span>${escapeHTML(v)}</span></span>`).join('');
  return `<div style="margin-top:.3rem"><b>${title}:</b> ${chips}</div>`;
}
function socialIconsHTML(f){
  const items=[];
  if (f.whatsapp && digits(f.whatsapp)) items.push(`<a class="btn ghost" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`);
  if (f.instagram){
    const u = /^https?:\/\//i.test(f.instagram) ? f.instagram : `https://instagram.com/${String(f.instagram).replace(/^@/,'')}`;
    items.push(`<a class="btn ghost" href="${u}" target="_blank" rel="noopener">Instagram</a>`);
  }
  if (f.facebook){
    const u = /^https?:\/\//i.test(f.facebook) ? f.facebook : `https://facebook.com/${String(f.facebook).replace(/^@/,'')}`;
    items.push(`<a class="btn ghost" href="${u}" target="_blank" rel="noopener">Facebook</a>`);
  }
  if (f.email && /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(f.email)){
    items.push(`<a class="btn ghost" href="mailto:${f.email}">Email</a>`);
  }
  return items.join(' ');
}

/* --------- render ---------- */
function render(){
  const m = me();
  $('#me-ct').textContent = m.ct || '–';
  $('#me-ll').textContent = m.ll || '–';
  $('#me-hobbies').textContent = (m.hobbies||[]).join(', ') || '–';
  $('#me-values').textContent  = (m.values ||[]).join(', ') || '–';

  const list = friends();
  if (!list.length){
    resultsEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  // collect filters (desktop or mobile drawer values)
  const q  = ($('#f-search')?.value || $('#m-search')?.value || '').trim().toLowerCase();
  const ct = ($('#f-ct')?.value || $('#m-ct')?.value || '') || '';
  const min= parseInt(($('#f-min')?.value || $('#m-min')?.value || '0'), 10) || 0;
  const w  = parseFloat(($('#f-llw')?.value || $('#m-llw')?.value || '1')) || 1;

  let rows = list.map(f => ({ f, s: score(m, f, w) }));

  if (q){
    rows = rows.filter(({f})=>{
      const hay = [
        f.name, f.ct, f.ll, f.contact, f.notes, f.whatsapp, f.instagram, f.facebook, f.email,
        ...(Array.isArray(f.hobbies)?f.hobbies:[String(f.hobbies||'')]),
        ...(Array.isArray(f.values)?f.values:[String(f.values||'')]),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  rows = rows.filter(({f,s}) => (!ct || f.ct?.toLowerCase()===ct.toLowerCase() || ct==='Both' || f.ct==='Both') && s>=min);
  rows.sort((a,b)=> b.s - a.s || String(a.f.name||'').localeCompare(String(b.f.name||'')));

  resultsEl.innerHTML = '';
  if (!rows.length){ emptyEl.style.display = 'block'; return; }
  emptyEl.style.display = 'none';

  rows.forEach(({f,s})=>{
    const hobbies = normList(f.hobbies);
    const values  = normList(f.values);
    const cls = s>=75 ? 'good' : s>=55 ? 'ok' : 'low';

    const card = document.createElement('div');
    card.className = 'match-card glow-card';
    card.innerHTML = `
      <div class="head">
        <div class="meta">
          <img class="avatar" src="${avatarFor(f.name, f.photo)}" alt="">
          <div style="min-width:0">
            <div class="name">${escapeHTML(f.name||'—')}</div>
            <div class="hint">${escapeHTML(f.ct||'—')} · ${escapeHTML(f.ll||'—')}</div>
          </div>
        </div>
        ${ring(s)}
      </div>

      <div class="row" style="margin:.45rem 0 .25rem;gap:.5rem">
        ${socialIconsHTML(f)}
      </div>

      ${listChips('Hobbies', hobbies, hobbyIco)}
      ${listChips('Values', values, valueIco)}

      ${f.contact ? `<div style="margin-top:.4rem"><b>Contact:</b> ${escapeHTML(f.contact)}</div>` : ''}
      ${f.notes ? `<div style="margin-top:.2rem"><i>${escapeHTML(f.notes)}</i></div>` : ''}
    `;
    // score color
    const num = card.querySelector('.mlab-ring .num');
    num.classList.add(cls);

    resultsEl.appendChild(card);
  });

  animateRings(resultsEl);
}

/* --------- filters wiring ---------- */
function syncDesktopFromMobile(){
  if ($('#m-search')) $('#f-search').value = $('#m-search').value;
  if ($('#m-ct'))     $('#f-ct').value     = $('#m-ct').value;
  if ($('#m-min'))    $('#f-min').value    = $('#m-min').value;
  if ($('#m-llw'))    $('#f-llw').value    = $('#m-llw').value;
  $('#llw-label').textContent = (parseFloat($('#f-llw').value)||1).toFixed(1)+'×';
}
function syncMobileFromDesktop(){
  if ($('#m-search')) $('#m-search').value = $('#f-search').value;
  if ($('#m-ct'))     $('#m-ct').value     = $('#f-ct').value;
  if ($('#m-min'))    $('#m-min').value    = $('#f-min').value;
  if ($('#m-llw'))    $('#m-llw').value    = $('#f-llw').value;
  $('#m-llw-label').textContent = (parseFloat($('#m-llw').value)||1).toFixed(1)+'×';
}
['#f-search','#f-ct','#f-min','#f-llw'].forEach(sel=>{
  $(sel)?.addEventListener('input', ()=>{
    if (sel==='#f-llw') $('#llw-label').textContent=(parseFloat($('#f-llw').value)||1).toFixed(1)+'×';
    render();
    syncMobileFromDesktop();
  });
});
$('#btn-reset')?.addEventListener('click', ()=>{
  $('#f-search').value=''; $('#f-ct').value=''; $('#f-min').value='0'; $('#f-llw').value='1'; $('#llw-label').textContent='1.0×';
  syncMobileFromDesktop();
  render();
});

/* --------- mobile filter drawer ---------- */
const fd = $('#filtersDrawer');
$('#btn-open-filters')?.addEventListener('click',()=>{ fd.classList.add('open'); document.body.classList.add('no-scroll'); syncMobileFromDesktop(); });
$('#filtersBackdrop')?.addEventListener('click',()=>{ fd.classList.remove('open'); document.body.classList.remove('no-scroll'); });
$('#m-close')?.addEventListener('click',()=>{ fd.classList.remove('open'); document.body.classList.remove('no-scroll'); });
$('#m-llw')?.addEventListener('input',()=> $('#m-llw-label').textContent=(parseFloat($('#m-llw').value)||1).toFixed(1)+'×' );
$('#m-apply')?.addEventListener('click',()=>{
  syncDesktopFromMobile();
  fd.classList.remove('open'); document.body.classList.remove('no-scroll');
  render();
});

/* --------- nav drawer + stars ---------- */
(function navbarDrawer(){
  const navbar=document.querySelector('.navbar');
  const onScroll=()=>{ if(window.scrollY>6) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled'); };
  onScroll(); addEventListener('scroll', onScroll, {passive:true});
  const drawer=$('#drawer');
  $('#openDrawer')?.addEventListener('click',()=>{ drawer.classList.add('open'); document.body.classList.add('no-scroll'); });
  $('#closeDrawer')?.addEventListener('click',()=>{ drawer.classList.remove('open'); document.body.classList.remove('no-scroll'); });
  $('#drawerBackdrop')?.addEventListener('click',()=>{ drawer.classList.remove('open'); document.body.classList.remove('no-scroll'); });
  $('#logoutLink')?.addEventListener('click', e=>{e.preventDefault();localStorage.clear();location.href='index.html';});
  $('#logoutLinkMobile')?.addEventListener('click', e=>{e.preventDefault();localStorage.clear();location.href='index.html';});
})();

/* --------- background stars (light) ---------- */
(function stars(){
  const cvs=$('#mlabStars'); if(!cvs) return;
  const ctx=cvs.getContext('2d');
  const DPR=window.devicePixelRatio||1; const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function size(){ cvs.width=innerWidth*DPR; cvs.height=innerHeight*DPR; }
  size(); addEventListener('resize', size);
  const N = innerWidth<560 ? 24 : 42;
  const stars = Array.from({length:N}, ()=>({ x:Math.random()*cvs.width, y:Math.random()*cvs.height, r:(Math.random()*1.2+0.6)*DPR, a:Math.random()*Math.PI*2 }));
  function tick(){
    ctx.clearRect(0,0,cvs.width,cvs.height);
    for(const s of stars){
      s.a += 0.02 + Math.random()*0.015;
      const f=(Math.sin(s.a)+1)/2;
      ctx.beginPath(); ctx.fillStyle=`rgba(0,253,216,${0.12+0.28*f})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    }
    if(!reduce) requestAnimationFrame(tick);
  }
  tick();
})();

/* --------- init ---------- */
render();


})(); 
