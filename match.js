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

// Jaccard similarity
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
    ll: m.loveLanguage || '',
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
  if (!desired || desired === 'Any') return 1;               // no filter
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

  // If candidate is missing most data, soften extreme highs
  const infoPieces =
    (f.ll?1:0) + (normList(f.hobbies).length?1:0) + (normList(f.values).length?1:0);
  if (infoPieces <= 1) total *= 0.8;

  return Math.max(0, Math.min(100, Math.round(total)));
}

// ------------ rendering ------------
const resultsEl = $('#results'), emptyEl = $('#empty');

function render(){
  const m = me();
  $('#me-name')?.replaceChildren(document.createTextNode(m.name || '–'));
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

  let rows = list.map(f => {
    const s = score(m, f, weightLL);
    return {f, s};
  });

  // filter by search
  if (q){
    const passes = ({f}) => {
      const hay = [
        f.name, f.ct, f.ll, f.contact, f.notes, f.whatsapp, f.instagram, f.facebook, f.email,
        ...(Array.isArray(f.hobbies)?f.hobbies:[String(f.hobbies||'')]),
        ...(Array.isArray(f.values)?f.values:[String(f.values||'')]),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    };
    rows = rows.filter(passes);
  }

  // filter by ct + min score
  rows = rows.filter(({f,s}) => ctMatch(desiredCT||'Any', f.ct) && s >= minScore);

  // sort desc by score, then name
  rows.sort((a,b) => b.s - a.s || String(a.f.name||'').localeCompare(String(b.f.name||'')));

  resultsEl.innerHTML = '';
  if (!rows.length){
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  rows.forEach(({f, s}) => {
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

      <div style="margin-top:.2rem;">
        ${hobbies ? `<div><b>Hobbies:</b> ${escapeHTML(hobbies)}</div>` : ''}
        ${values  ? `<div><b>Values:</b> ${escapeHTML(values)}</div>`   : ''}
        ${f.contact ? `<div><b>Contact:</b> ${escapeHTML(f.contact)}</div>` : ''}
        ${f.notes ? `<div><i>${escapeHTML(f.notes)}</i></div>` : ''}
      </div>

      <div class="row" style="margin-top:.6rem;">
        <a class="btn" href="friends.html">Edit in Friends</a>
        ${messageLinkHTML(f)}
      </div>
    `;
    resultsEl.appendChild(card);
  });
}

function messageLinkHTML(f){
  // Prefer WhatsApp -> Instagram -> Facebook -> Email -> contactLink (best effort)
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

function escapeHTML(str=''){
  return str.replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}

// ------------ events ------------
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

// ------------ init ------------
render();

})();
