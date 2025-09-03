(() => {
// ------------ helpers ------------
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
  return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

// Emoji maps
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

// Avatar
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

// Social icons html
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
  if (!items.length) return '';
  return `<div class="social-icons">${items.join('')}</div>`;
}

// Similarity
function jaccard(a,b){
  const A = new Set(normList(a)), B = new Set(normList(b));
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0; A.forEach(v => { if (B.has(v)) inter++; });
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

// ------------ data ------------
function me(){
  const m = READ(LS_ME) || {};
  return {
    name: m.name || '',
    ct: m.connectionType || '',
    ll: m.loveLanguage || m.loveLanguages?.[0] || '',
    hobbies: m.hobbies || [],
    values: m.values || [],
  };
}
function friends(){
  const list = READ(LS_FRIENDS);
  return Array.isArray(list) ? list : [];
}

// ------------ scoring ------------
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
/*
 Final score (0..100):
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

// ------------ UI helpers ------------
function ringSVG(pct=0){
  const CIRC = 2*Math.PI*32; // r=32, svg viewBox 0..76
  const off  = CIRC * (1 - Math.max(0, Math.min(1, pct/100)));
  return `
  <div class="score-ring" title="Compatibility">
    <svg viewBox="0 0 76 76" aria-hidden="true">
      <circle class="ring-track" cx="38" cy="38" r="32"></circle>
      <circle class="ring-prog"  cx="38" cy="38" r="32" stroke-dasharray="${CIRC}" stroke-dashoffset="${off}"></circle>
    </svg>
    <div class="score-num">${pct}<small>%</small></div>
  </div>`;
}
function listChips(title, list, iconFn){
  if(!list || !list.length) return '';
  const chips = list.slice(0,8).map(v=>`<span class="chip"><span class="ico">${iconFn(v)}</span><span>${escapeHTML(v)}</span></span>`).join('');
  return `<div style="margin-top:.3rem"><b>${title}:</b> ${chips}</div>`;
}

// ------------ rendering ------------
const resultsEl = $('#results'), emptyEl = $('#empty');

function render(){
  const m = me();
  $('#me-ct')?.replaceChildren(document.createTextNode(m.ct || '–'));
  $('#me-ll')?.replaceChildren(document.createTextNode(m.ll || '–'));
  $('#me-hobbies')?.replaceChildren(document.createTextNode(normList(m.hobbies).join(', ') || '–'));
  $('#me-values')?.replaceChildren(document.createTextNode(normList(m.values).join(', ') || '–'));

  const list = friends();
  if (!list.length){
    resultsEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  const q = ($('#f-search')?.value || '').trim().toLowerCase();
  const desiredCT = $('#f-ct')?.value || '';
  const minScore = parseInt($('#f-min')?.value || '0', 10) || 0;
  const weightLL = parseFloat($('#f-llw')?.value || '1') || 1;

  let rows = list.map(f => ({ f, s: score(m, f, weightLL) }));

  if (q){
    rows = rows.filter(({f}) => {
      const hay = [
        f.name, f.ct, f.ll, f.contact, f.notes, f.whatsapp, f.instagram, f.facebook, f.email,
        ...(Array.isArray(f.hobbies)?f.hobbies:[String(f.hobbies||'')]),
        ...(Array.isArray(f.values)?f.values:[String(f.values||'')]),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  rows = rows.filter(({f,s}) => ctMatch(desiredCT||'Any', f.ct) && s >= minScore);

  rows.sort((a,b) => b.s - a.s || String(a.f.name||'').localeCompare(String(b.f.name||'')));

  resultsEl.innerHTML = '';
  if (!rows.length){ emptyEl.style.display = 'block'; return; }
  emptyEl.style.display = 'none';

  rows.forEach(({f, s}) => {
    const hobbies = normList(f.hobbies);
    const values  = normList(f.values);
    const cls = s >= 75 ? 'good' : s >= 55 ? 'ok' : 'low';

    const card = document.createElement('div');
    card.className = 'match-card glow-card';
    card.innerHTML = `
      <div class="head">
        <div class="meta">
          <img class="avatar" src="${avatarFor(f.name, f.photo)}" alt="">
          <div style="min-width:0;">
            <div class="name">${escapeHTML(f.name||'—')}</div>
            <div class="hint">${escapeHTML(f.ct || '—')} · ${escapeHTML(f.ll || '—')}</div>
          </div>
        </div>
        ${ringSVG(s)}
      </div>

      ${socialIconsHTML(f)}

      ${listChips('Hobbies', hobbies, hobbyIco)}
      ${listChips('Values', values, valueIco)}

      ${f.contact ? `<div style="margin-top:.4rem"><b>Contact:</b> ${escapeHTML(f.contact)}</div>` : ''}
      ${f.notes ? `<div style="margin-top:.2rem"><i>${escapeHTML(f.notes)}</i></div>` : ''}

      <div class="row" style="margin-top:.6rem">
        <a class="btn" href="friends.html">Edit in Friends</a>
        ${messageLinkHTML(f)}
        ${compareLinkHTML(f)}
      </div>
    `;

    // classify score color on number
    const num = card.querySelector('.score-num');
    num.classList.add(cls);

    resultsEl.appendChild(card);
  });
}

// ====== helper buttons ======
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
  const name=(f.name||'').trim(); if(!name) return '';
  return `<a class="btn" href="compare.html?a=me&b=${encodeURIComponent(name)}">Compare →</a>`;
}

// ====== events ======
['#f-search','#f-ct','#f-min','#f-llw'].forEach(sel=>{
  $(sel)?.addEventListener('input', ()=>{
    if (sel==='#f-llw') { $('#llw-label').textContent = (parseFloat($('#f-llw').value)||1).toFixed(1)+'×'; }
    render();
  });
});
$('#btn-reset')?.addEventListener('click', ()=>{
  $('#f-search').value=''; $('#f-ct').value=''; $('#f-min').value='0'; $('#f-llw').value='1';
  $('#llw-label').textContent='1.0×'; render();
});

// ====== init ======
render();

})(); 
(() => {
  // Aktyvus link pagal data-page / data-nav
  const page = document.body.dataset.page || '';
  document.querySelectorAll('.nav-links a[data-nav]').forEach(a => {
    if (a.dataset.nav === page) a.setAttribute('aria-current','page');
  });

  // Drawer atidarymas/uždarymas
  const open = document.getElementById('openDrawer');
  const close = document.getElementById('closeDrawer');
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');

  const openD = () => { drawer?.classList.add('open'); document.body.classList.add('no-scroll'); };
  const closeD = () => { drawer?.classList.remove('open'); document.body.classList.remove('no-scroll'); };

  open?.addEventListener('click', openD);
  close?.addEventListener('click', closeD);
  backdrop?.addEventListener('click', closeD);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeD(); });

  // Logout elgsena kaip kituose puslapiuose
  document.getElementById('logoutLink')?.addEventListener('click', (e)=>{
    e.preventDefault(); localStorage.clear(); location.href='index.html';
  });
  document.getElementById('logoutLinkMobile')?.addEventListener('click', (e)=>{
    e.preventDefault(); localStorage.clear(); location.href='index.html';
  });
})();
// Add neutral mini dots to every card header for visual consistency
(function uniformDots(){
  const heads = document.querySelectorAll('.match-card .card-head');
  heads.forEach(h=>{
    if (!h.querySelector('.mini-dots')) {
      const row = document.createElement('div');
      row.className = 'mini-dots';
      row.innerHTML = '<i></i><i></i><i></i><i></i>';
      h.appendChild(row);
    }
  });
})();
// --- MATCH: remove stray mini circle rows on cards (robust) ---
(function () {
  function hideDotRows(root) {
    if (!root) return;
    const cards = root.querySelectorAll('.match-card');
    cards.forEach(card => {
      // apeinam visus galimus vidinius konteinerius
      card.querySelectorAll(':scope *').forEach(el => {
        const kids = Array.from(el.children);
        if (kids.length >= 3 && kids.length <= 6) {
          const isDotRow = kids.every(ch => {
            const rect = ch.getBoundingClientRect();
            const cs = getComputedStyle(ch);
            const noText = !ch.textContent.trim();
            const small = rect.width <= 18 && rect.height <= 18;
            const round = parseFloat(cs.borderRadius || '0') >= rect.width / 2 - 1;
            return noText && small && round;
          });
          if (isDotRow) el.style.display = 'none';
        }
      });
    });
  }

  // paleidžiam kartą, kai DOM jau yra
  const cardsRoot = document.querySelector('.cards') || document.getElementById('cards');
  hideDotRows(cardsRoot);

  // paleidžiam kaskart, kai kortelės persirenderina
  if (cardsRoot) {
    const mo = new MutationObserver(() => hideDotRows(cardsRoot));
    mo.observe(cardsRoot, { childList: true, subtree: true });
  }

  // jei turi savo renderCards(), prijunk po jo:
  if (typeof renderCards === 'function') {
    const org = renderCards;
    window.renderCards = function () {
      const r = org.apply(this, arguments);
      // šiek tiek vėliau, kai DOM įstatytas
      setTimeout(() => hideDotRows(cardsRoot), 0);
      return r;
    };
  }
})();

