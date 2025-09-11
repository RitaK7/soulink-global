(() => {

// ---------- helpers ----------
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const LS_KEY = 'soulFriends';
const LEGACY_KEYS = ['friends', 'friendsList']; // senieji galimi raktai

function escapeHTML(str=''){
  return str.replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}
const digits = s => (s||'').toString().replace(/\D+/g,'');

// ---------- storage + migration ----------
function readJSON(key){
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

function loadFriends(){
  const cur = readJSON(LS_KEY);
  if (Array.isArray(cur)) return cur;

  for (const k of LEGACY_KEYS){
    const legacy = readJSON(k);
    if (Array.isArray(legacy) && legacy.length){
      localStorage.setItem(LS_KEY, JSON.stringify(legacy));
      return legacy;
    }
  }
  return [];
}

function saveFriends(list){
  localStorage.setItem(LS_KEY, JSON.stringify(list || []));
}

// ---------- avatar ----------
function avatarFor(f){
  const url = (f.photo || '').trim();
  if (/^https?:\/\//i.test(url) || url.startsWith('data:image')) return url;

  const ch = (f.name || '?').trim().charAt(0).toUpperCase() || 'S';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
       <rect width="100%" height="100%" fill="#064a4a"/>
       <text x="50%" y="58%" font-size="42" font-family="system-ui"
             text-anchor="middle" fill="#00fdd8">${ch}</text>
     </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ---------- single contact (legacy) ----------
function contactLink(c){
  if (!c) return null;
  const v = c.trim();

  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v)) return `mailto:${v}`;
  if (/^\+?\d[\d\s-]{6,}$/.test(v)) return `https://wa.me/${v.replace(/\D/g,'')}`;
  if (/^@?[\w.]{2,}$/i.test(v)) return `https://instagram.com/${v.replace(/^@/, '')}`;
  return null;
}

// ---------- normalize friend ----------
function normFriend(f){
  return {
    name:    (f.name||'').trim(),
    photo:   (f.photo||'').trim(),
    ct:      (f.ct||'').trim(),
    ll:      (f.ll||'').trim(),
    hobbies: (f.hobbies||'').split(',').map(x=>x.trim()).filter(Boolean),
    values:  (f.values||'').split(',').map(x=>x.trim()).filter(Boolean),
    contact: (f.contact||'').trim(),
    notes:   (f.notes||'').trim(),

    // new fields:
    whatsapp:(f.whatsapp||'').trim(),
    instagram:(f.instagram||'').trim(),
    facebook:(f.facebook||'').trim(),
    email:(f.email||'').trim(),
  };
}

// ---------- scoring (demo) ----------
function scoreWithMe(_f){
  return Math.floor(Math.random()*41) + 60; // 60–100
}

// ---------- build social icon links ----------
function buildSocialIcons(f){
  const items = [];

  if (f.whatsapp){
    const num = digits(f.whatsapp);
    if (num) items.push(`<a class="icon wa" href="https://wa.me/${num}" target="_blank" rel="noopener" title="WhatsApp"><i class="bi bi-whatsapp"></i></a>`);
  }
  if (f.instagram){
    const h = /^https?:\/\//i.test(f.instagram) ? f.instagram : `https://instagram.com/${f.instagram.replace(/^@/,'')}`;
    items.push(`<a class="icon ig" href="${h}" target="_blank" rel="noopener" title="Instagram"><i class="bi bi-instagram"></i></a>`);
  }
  if (f.facebook){
    const h = /^https?:\/\//i.test(f.facebook) ? f.facebook : `https://facebook.com/${f.facebook.replace(/^@/,'')}`;
    items.push(`<a class="icon fb" href="${h}" target="_blank" rel="noopener" title="Facebook"><i class="bi bi-facebook"></i></a>`);
  }
  if (f.email && /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(f.email)){
    items.push(`<a class="icon em" href="mailto:${f.email}" title="Email"><i class="bi bi-envelope"></i></a>`);
  }

  if (!items.length) return '';
  return `<div class="social-icons" style="margin:.5rem 0 .2rem;">${items.join('')}</div>`;
}

// ---------- render ----------
const listEl  = $('#friends-list');
const emptyEl = $('#empty-note');

function render(list = loadFriends()){
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!list.length){
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  list.forEach((f, i) => {
    const card = document.createElement('div');
    card.className = 'friend';

    const score = scoreWithMe(f);
    const cls = score >= 75 ? 'good' : score >= 50 ? 'ok' : 'low';
    const msg = contactLink(f.contact);

    const lines = [];
    if (f.ct) lines.push(`<div><b>Connection:</b> ${escapeHTML(f.ct)}</div>`);
    if (f.ll) lines.push(`<div><b>Love Language:</b> ${escapeHTML(f.ll)}</div>`);
    if ((f.hobbies||[]).length) lines.push(`<div><b>Hobbies:</b> ${escapeHTML(f.hobbies.join(', '))}</div>`);
    if ((f.values||[]).length)  lines.push(`<div><b>Values:</b> ${escapeHTML(f.values.join(', '))}</div>`);
    if (f.contact) {
      const a = msg ? ` <a class="btn btn-ghost btn-xs" href="${msg}" target="_blank" rel="noopener">Message</a>` : '';
      lines.push(`<div><b>Contact:</b> ${escapeHTML(f.contact)}${a}</div>`);
    }
    if (f.notes) lines.push(`<div><i>${escapeHTML(f.notes)}</i></div>`);

    const img = `<img class="avatar" src="${avatarFor(f)}" alt="">`;
    const icons = buildSocialIcons(f);

    card.innerHTML = `
      <div class="friend-head">
        <div class="friend-meta">
          ${img}
          <span class="name">${escapeHTML(f.name || '--')}</span>
        </div>
        <span class="score ${cls}" title="Compatibility">${score}%</span>
      </div>
      <div class="friend-body">
        ${icons}
        ${lines.join('') || '<div><i>No extra details.</i></div>'}
      </div>
      <div class="friend-actions" style="display:flex; gap:.5rem;">
        <button type="button" class="btn btn-ghost" data-edit="${i}">Edit</button>
        <button type="button" class="btn btn-ghost" data-rm="${i}">Remove</button>
      </div>
    `;
    listEl.appendChild(card);
  });
}

// ---------- delegated actions ----------
listEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-edit],[data-rm]');
  if (!btn) return;
  e.preventDefault();

  if (btn.hasAttribute('data-edit')) {
    openEdit(+btn.getAttribute('data-edit'));
  } else {
    const i = +btn.getAttribute('data-rm');
    const arr = loadFriends();
    arr.splice(i, 1);
    saveFriends(arr);
    render(arr);
  }
});

// ---------- add friend ----------
$('#add-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const f = normFriend({
    name:    $('#f-name')?.value,
    ct:      $('#f-ct')?.value,
    ll:      $('#f-ll')?.value,
    hobbies: $('#f-hobbies')?.value,
    values:  $('#f-values')?.value,
    contact: $('#f-contact')?.value,
    notes:   $('#f-notes')?.value,
    photo:   $('#f-photo')?.value,

    whatsapp: $('#f-whatsapp')?.value,
    instagram: $('#f-instagram')?.value,
    facebook: $('#f-facebook')?.value,
    email: $('#f-email')?.value,
  });
  if (!f.name){ alert('Please enter a name.'); return; }

  const arr = loadFriends();
  if (arr.some(x => (x.name||'').toLowerCase() === f.name.toLowerCase()) &&
      !confirm(`"${f.name}" already exists. Add anyway?`)) return;

  arr.push(f);
  saveFriends(arr);
  e.target.reset();
  updatePreviewIcons(); // reset preview
  render(arr);
});

// ---------- clear ----------
$('#clearAll')?.addEventListener('click', () => {
  if (confirm('Clear all friends?')){
    saveFriends([]);
    render([]);
  }
});

// ---------- export / import ----------
$('#exportFriends')?.addEventListener('click', () => {
  const arr = loadFriends();
  const blob = new Blob([JSON.stringify(arr,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'soulink-friends.json';
  a.click();
  URL.revokeObjectURL(url);
});

$('#importFriends')?.addEventListener('click', () => {
  $('#importFile')?.click();
});
$('#importFile')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const arr = JSON.parse(reader.result);
      if (!Array.isArray(arr)) throw new Error('Invalid JSON');
      saveFriends(arr);
      render(arr);
    }catch(err){
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
});

// ---------- EDIT MODAL ----------
const modal = $('#editModal');
let editIdx = -1;

function setVal(sel, val){
  const el = document.querySelector(sel);
  if (!el) {
    console.warn('Edit field not found:', sel);
    return false;
  }
  el.value = val ?? '';
  return true;
}

function openEdit(i){
  const arr = loadFriends();
  const f = arr[i];
  if (!f) return;

  editIdx = i;

  const ok1 = setVal('#e-name',    f.name);
  const ok2 = setVal('#e-ct',      f.ct);
  const ok3 = setVal('#e-ll',      f.ll);
  const ok4 = setVal('#e-hobbies', (f.hobbies||[]).join(', '));
  const ok5 = setVal('#e-values',  (f.values ||[]).join(', '));
  const ok6 = setVal('#e-contact', f.contact);
  const ok7 = setVal('#e-notes',   f.notes);
  const ok8 = setVal('#e-photo',   f.photo);

  const ok9  = setVal('#e-whatsapp', f.whatsapp || '');
  const ok10 = setVal('#e-instagram', f.instagram || '');
  const ok11 = setVal('#e-facebook', f.facebook || '');
  const ok12 = setVal('#e-email', f.email || '');

  if (!(ok1 && ok2 && ok3 && ok4 && ok5 && ok6 && ok7 && ok8 && ok9 && ok10 && ok11 && ok12)) {
    alert('Edit form is missing one or more fields. Please refresh the page (Ctrl+F5) to load the newest HTML.');
    return;
  }

  if (modal) modal.hidden = false;
}

$('#editCancel')?.addEventListener('click', () => {
  if (modal) modal.hidden = true;
  editIdx = -1;
});

$('#edit-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (editIdx < 0) return;

  const arr = loadFriends();

  const updated = normFriend({
    name:    $('#e-name')?.value,
    photo:   $('#e-photo')?.value,
    ct:      $('#e-ct')?.value,
    ll:      $('#e-ll')?.value,
    hobbies: $('#e-hobbies')?.value,
    values:  $('#e-values')?.value,
    contact: $('#e-contact')?.value,
    notes:   $('#e-notes')?.value,

    whatsapp: $('#e-whatsapp')?.value,
    instagram: $('#e-instagram')?.value,
    facebook: $('#e-facebook')?.value,
    email: $('#e-email')?.value,
  });

  arr[editIdx] = updated;
  saveFriends(arr);
  if (modal) modal.hidden = true;
  editIdx = -1;
  render(arr);
});

// ---------- Snapshot from soulQuiz ----------
function fillSnapshot(){
  const me = readJSON('soulQuiz') || {};

  const getText = (v, fallback='–') => {
    if (!v) return fallback;
    if (Array.isArray(v)) return v.join(', ') || fallback;
    if (typeof v === 'string') return v || fallback;
    return fallback;
  };
  const setTxt = (selectors, val) => {
    (Array.isArray(selectors) ? selectors : [selectors]).forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.replaceChildren(document.createTextNode(val));
    });
  };

  setTxt(['#snapshot-name','#me-name'], me.name || '–');
  setTxt(['#snapshot-connection','#me-ct'], me.connectionType || '–');
  setTxt(['#snapshot-loveLanguage','#me-ll'], me.loveLanguage || '–');
  setTxt(['#snapshot-hobbies','#me-hobbies'], getText(me.hobbies));
  setTxt(['#snapshot-values','#me-values'],  getText(me.values));
}

// ---------- Live contact preview (form) ----------
function updatePreviewIcons(){
  const wrap = $('#contactPreview');
  if (!wrap) return;

  const digits = s => (s||'').toString().replace(/\D+/g,'');

  const w  = $('#f-whatsapp')?.value?.trim();
  const ig = $('#f-instagram')?.value?.trim();
  const fb = $('#f-facebook')?.value?.trim();
  const em = $('#f-email')?.value?.trim();

  const waA = wrap.querySelector('.wa');
  const igA = wrap.querySelector('.ig');
  const fbA = wrap.querySelector('.fb');
  const emA = wrap.querySelector('.em');

  // WhatsApp
  if (w && digits(w)){
    waA.removeAttribute('hidden');
    waA.href = 'https://wa.me/' + digits(w);
    waA.target = '_blank'; waA.rel = 'noopener';
  } else { waA.setAttribute('hidden',''); }

  // Instagram
  if (ig){
    igA.removeAttribute('hidden');
    igA.href = /^https?:\/\//i.test(ig) ? ig : 'https://instagram.com/' + ig.replace(/^@/,'');
    igA.target = '_blank'; igA.rel = 'noopener';
  } else { igA.setAttribute('hidden',''); }

  // Facebook
  if (fb){
    fbA.removeAttribute('hidden');
    fbA.href = /^https?:\/\//i.test(fb) ? fb : 'https://facebook.com/' + fb.replace(/^@/,'');
    fbA.target = '_blank'; fbA.rel = 'noopener';
  } else { fbA.setAttribute('hidden',''); }

  // Email
  if (em && /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(em)){
    emA.removeAttribute('hidden');
    emA.href = 'mailto:' + em;
  } else { emA.setAttribute('hidden',''); }
}

['#f-whatsapp','#f-instagram','#f-facebook','#f-email'].forEach(sel => {
  $(sel)?.addEventListener('input', updatePreviewIcons);
});

// ---------- init ----------
fillSnapshot();
render();
updatePreviewIcons();

})();

/* ==========================================
   Soulink – Friends shims (non-breaking)
   - Ensure loveLanguage persists + migrate old entries
   - Align navbar order & active state
   - Fix footer Next → Results
   ========================================== */
(function friendsShims(){
  // --- A) loveLanguage: save & one-time migrate ---
  const KEY = 'soulFriends';

  function normalizeLL(list){
    return (list || []).map(f => {
      const ll = f?.loveLanguage || f?.ll || 'Unknown';
      return Object.assign({}, f, { loveLanguage: ll, ll: ll });
    });
  }

  // monkey-patch saveFriends to always store both keys (ll & loveLanguage)
  if (typeof window.saveFriends === 'function'){
    const __saveFriends = window.saveFriends;
    window.saveFriends = function(list){
      return __saveFriends( normalizeLL(list) );
    };
  }

  // one-time migration of existing records
  try {
    const cur = JSON.parse(localStorage.getItem(KEY) || '[]');
    const migrated = normalizeLL(cur);
    localStorage.setItem(KEY, JSON.stringify(migrated));
    // re-render if your render(list) exists
    if (typeof window.render === 'function') window.render(migrated);
  } catch {}

  // --- B) navbar: enforce order + active class (no markup rename) ---
  const desiredOrder = [
    'quiz.html','edit-profile.html','my-soul.html','soul-chart.html',
    'soul-coach.html','match.html','friends.html','result.html'
  ];
  const navList = document.querySelector('.navbar .nav-links, .navbar #navMenu');
  if (navList){
    const items = Array.from(navList.querySelectorAll('li, a')).filter(x => x.tagName === 'LI' || x.tagName === 'A');
    // normalize to <li> wrappers if present
    const links = items.map(n => n.tagName === 'LI' ? n.querySelector('a') : n).filter(Boolean);

    // sort by desired order (append unknowns at the end)
    links
      .sort((a,b) => {
        const ia = desiredOrder.indexOf(a.getAttribute('href'));
        const ib = desiredOrder.indexOf(b.getAttribute('href'));
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
      .forEach(a => (a.parentElement && a.parentElement.tagName === 'LI')
        ? navList.appendChild(a.parentElement)
        : navList.appendChild(a));

    // active glow + aria
    links.forEach(a => {
      if (a.getAttribute('href')?.endsWith('friends.html')){
        a.classList.add('active');
        a.setAttribute('aria-current','page');
      } else {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      }
    });
  }

  // --- C) footer Next → Results (non-destructive) ---
  (function fixFooterNext(){
    // try main-bottom nav first, then any nav in main/footer
    const scope = document.querySelector('main') || document;
    const candidates = Array.from(scope.querySelectorAll('a[href$="match.html"], a[data-next="match"]'));
    const btn = candidates.reverse().find(Boolean); // likely the "Next" button is the last one
    if (btn){
      btn.setAttribute('href','result.html');
      if (btn.textContent) btn.textContent = btn.textContent.replace(/Match/i, 'Results');
    }
  })();
})();
/* ==========================================
   Soulink – Friends: quick shims (non-breaking)
   - Love Language save/migrate (ll <-> loveLanguage)
   - Navbar order + active glow
   - Footer Next → Results
   ========================================== */
(function friendsFixes(){
  // --- A) Love Language: migrate + mirror
  const KEY = 'soulFriends';
  function fixLL(list){
    (list || []).forEach(f => {
      const cur = f.ll || f.loveLanguage;
      const val = (cur && String(cur).trim()) ? cur : 'Unknown';
      if (!f.ll)           f.ll = val;
      if (!f.loveLanguage) f.loveLanguage = val;
    });
    return list || [];
  }
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    localStorage.setItem(KEY, JSON.stringify(fixLL(arr)));
    if (typeof window.render === 'function') window.render(arr);
  } catch {}

  // ensure all future saves keep both keys in sync (wrap existing saveFriends if present)
  if (typeof window.saveFriends === 'function'){
    const __saveFriends = window.saveFriends;
    window.saveFriends = function(list){ return __saveFriends( fixLL(list) ); };
  }

  // --- B) Navbar: order + active (matches other pages)
  const nav = document.querySelector('.navbar #navMenu, .navbar .nav-links');
  const desired = [
    'quiz.html','edit-profile.html','my-soul.html','soul-chart.html',
    'soul-coach.html','match.html','friends.html','result.html'
  ];
  if (nav){
    const items = Array.from(nav.querySelectorAll('a'));
    items.sort((a,b) => {
      const ia = desired.indexOf(a.getAttribute('href')||'');
      const ib = desired.indexOf(b.getAttribute('href')||'');
      return (ia<0?999:ia) - (ib<0?999:ib);
    }).forEach(a => nav.appendChild(a.closest('li') || a));

    items.forEach(a => {
      const active = /friends\.html$/i.test(a.getAttribute('href')||'');
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
  }

  // --- C) Footer: Next → Results (non-destructive)
  document.querySelectorAll('a[href$="match.html"]').forEach(a => {
    if (/Next/i.test(a.textContent || '')) {
      a.href = 'result.html';
      a.textContent = a.textContent.replace(/Match/i, 'Results');
    }
  });
})();
/* =========================================
   Soulink · Friends — SCOPE=friendship + pills as nav + snapshot hydrate
   ========================================= */
(() => {
  const SCOPE = 'friendship';
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const safeJSON = s => { try { return JSON.parse(s); } catch { return null; } };
  const norm = s => (s||'').toString().trim().toLowerCase();

  document.body.classList.add('friends-page');

  // Navbar active
  document.querySelectorAll('.navbar .nav-links a').forEach(a=>{
    const on = /friends\.html$/i.test(a.getAttribute('href')||'');
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });

  // Snapshot
  function hydrateSnapshot(q){
    const conn = (() => {
      const c = norm(q?.connectionType || q?.connection);
      return c === 'both' ? SCOPE : (c || '—');
    })();
    const love = Array.isArray(q?.loveLanguages) ? (q.loveLanguages[0] || '') :
                 (q?.loveLanguagePrimary || q?.loveLanguage || '');
    const toArr = v => Array.isArray(v) ? v :
                  (typeof v==='string' ? v.split(/[\n,|]/).map(s=>s.trim()).filter(Boolean) : []);
    const hobbies = toArr(q?.hobbies);
    const values  = toArr(q?.values);

    const setTxt = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val || '—'; };
    const setChips = (sel, arr) => {
      const box = document.querySelector(sel); if (!box) return;
      box.innerHTML = '';
      (arr||[]).forEach(t => { const s=document.createElement('span'); s.className='chip'; s.textContent=t; box.appendChild(s); });
      if (!box.children.length) { const dash=document.createElement('span'); dash.textContent='—'; box.appendChild(dash); }
    };

    setTxt('#snapshot-connection', conn);
    setTxt('#snapshot-love', love || '—');
    setChips('#snapshot-hobbies', hobbies);
    setChips('#snapshot-values', values);
  }

  // Pills: Friendship aktyvus, Romantic -> match.html
  function hydratePills(){
    const row = document.querySelector('.pill-row'); if (!row) return;
    row.innerHTML = '';
    const active = (txt)=>{
      const s=document.createElement('span');
      s.className='pill is-active'; s.setAttribute('role','tab'); s.setAttribute('aria-selected','true');
      s.textContent=txt; return s;
    };
    const link = (txt,href)=>{
      const a=document.createElement('a');
      a.className='pill'; a.href=href; a.setAttribute('role','tab'); a.setAttribute('aria-selected','false');
      a.textContent=txt; return a;
    };
    row.append(active('Friendship'), link('Romantic','match.html'));
  }

  // includeByScope (legacy "both" praleidžiam)
  function includeByScope(conn, scope){ if(!conn) return false; if(conn==='both') return true; return conn===scope; }

  const quiz = safeJSON(localStorage.getItem('soulQuiz')) || {};
  const allFromLS = safeJSON(localStorage.getItem('soulFriends')) || [];
  const scoped = allFromLS.filter(p => includeByScope(norm(p.connection), SCOPE));

  document.addEventListener('DOMContentLoaded', () => {
    hydrateSnapshot(quiz);
    hydratePills();

    if (typeof window.renderPeople === 'function') {
      window.renderPeople(scoped);
    } else if (typeof window.renderFriends === 'function') {
      window.renderFriends(scoped);
    } else {
      // fallback: jei kortelės jau sugeneruotos, tiesiog paslėpk ne-scope
      let cards = $$('.friend-card, .match-card, .cards .card');
      cards.forEach(c=>{
        const t = (c.dataset.connection || '').toLowerCase();
        const ok = includeByScope(t || (()=>{ const m=(c.textContent||'').match(/connection\s*:\s*(friendship|romantic|both)/i); return (m?m[1].toLowerCase():'both'); })(), SCOPE);
        c.classList.toggle('is-hidden', !ok);
        c.style.display = ok ? '' : 'none';
      });
    }

    // Footer „Next → Results“ (tik patvirtinam)
    const next = document.querySelector('a[href$="result.html"], a[href$="results.html"]');
    if (!next) {
      const candidate = Array.from(document.querySelectorAll('a')).find(a=>/next/i.test(a.textContent||''));
      candidate && (candidate.href = 'result.html');
    }
  });
})();
/* =========================================================
   Soulink · Friends — Enhancements (non-destructive)
   Requirements covered: 1,2,3,4,5,6,7,8,9,10
   ========================================================= */
(() => {
  // ---------- storage adapter (back-compat) ----------
  const NEW_FRIENDS = 'soulink.friends.list';
  const OLD_FRIENDS = 'soulFriends';                // existing key in your app
  const NEW_QUIZ    = 'soulink.soulQuiz';
  const OLD_QUIZ    = 'soulQuiz';

  const safeJSON = s => { try { return JSON.parse(s); } catch { return null; } };

  function loadAllFriends(){
    const fromNew = safeJSON(localStorage.getItem(NEW_FRIENDS));
    if (Array.isArray(fromNew)) return fromNew;
    const fromOld = safeJSON(localStorage.getItem(OLD_FRIENDS)) || [];
    return fromOld;
  }
  function saveAllFriends(list){
    const arr = Array.isArray(list) ? list : [];
    try { localStorage.setItem(NEW_FRIENDS, JSON.stringify(arr)); } catch {}
    try { localStorage.setItem(OLD_FRIENDS, JSON.stringify(arr)); } catch {}
  }
  function loadQuiz(){
    return safeJSON(localStorage.getItem(NEW_QUIZ)) ||
           safeJSON(localStorage.getItem(OLD_QUIZ)) || {};
  }

  // Make existing helpers call our adapters
  if (typeof window.loadFriends === 'function'){
    window.loadFriends = loadAllFriends;
  }
  if (typeof window.saveFriends === 'function'){
    const __save = window.saveFriends;
    window.saveFriends = (l)=>{ saveAllFriends(l); return __save(l); };
  }

  // ---------- deterministic score (for stable sort) ----------
  function stableScore(f){
    const s = (f.name||'')+'|'+(Array.isArray(f.values)?f.values.join(','):f.values||'')+'|'+(f.ll||f.loveLanguage||'');
    let h=0; for(let i=0;i<s.length;i++) h=(h*31 + s.charCodeAt(i))>>>0;
    return 50 + (h % 51); // 50..100
  }
  if (typeof window.scoreWithMe === 'function'){
    window.scoreWithMe = stableScore;
  }

  // ---------- toolbar UI (inject above list) ----------
  const listWrap = document.querySelector('#friends-list')?.closest('.card');
  if (listWrap && !document.getElementById('friendsToolbar')){
    const bar = document.createElement('div');
    bar.id = 'friendsToolbar';
    bar.innerHTML = `
      <input id="friendsSearch" type="search" aria-label="Search friends" placeholder="Search name, notes, socials…" />
      <div id="filterConnection" class="row" role="group" aria-label="Filter by connection">
        <span class="chip" data-val="">Any</span>
        <span class="chip" data-val="friendship">Friendship</span>
        <span class="chip" data-val="romantic">Romantic</span>
      </div>
      <div id="filterLoveLanguage" class="row" role="group" aria-label="Filter by love language">
        <span class="chip" data-val="">All</span>
        <span class="chip" data-val="acts">Acts</span>
        <span class="chip" data-val="gifts">Gifts</span>
        <span class="chip" data-val="quality_time">Quality Time</span>
        <span class="chip" data-val="physical_touch">Physical Touch</span>
        <span class="chip" data-val="words">Words</span>
      </div>
      <div id="friendsSort" class="row" role="group" aria-label="Sort">
        <span class="chip" data-sort="score-asc"  aria-pressed="false">Score ⬆︎</span>
        <span class="chip" data-sort="score-desc" aria-pressed="true">Score ⬇︎</span>
        <span class="chip" data-sort="az"         aria-pressed="false">A–Z</span>
      </div>
    `;
    listWrap.insertBefore(bar, listWrap.querySelector('#friends-list'));
  }

  // ---------- in-memory state + debounced filter ----------
  let RAW = loadAllFriends();
  let STATE = { q:'', conn:'', ll:'', sort:'score-desc' };

  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  function llKey(f){
    const t = (f.loveLanguage || f.ll || '').toString().toLowerCase();
    if (/acts/.test(t)) return 'acts';
    if (/gift/.test(t)) return 'gifts';
    if (/quality/.test(t)) return 'quality_time';
    if (/touch/.test(t)) return 'physical_touch';
    if (/word/.test(t)) return 'words';
    return 'unknown';
  }
  const norm = s => (s||'').toString().trim().toLowerCase();
  const includes = (hay,needle)=> norm(hay).includes(norm(needle));

  function applyFilters(){
    let list = RAW.slice();

    // search
    if (STATE.q){
      list = list.filter(f=>{
        const blob = [
          f.name, f.notes, f.contact, f.email, f.instagram, f.facebook,
          (Array.isArray(f.hobbies)?f.hobbies.join(','):f.hobbies||''),
          (Array.isArray(f.values)?f.values.join(','):f.values||'')
        ].join(' | ');
        return includes(blob, STATE.q);
      });
    }
    // connection
    if (STATE.conn){
      list = list.filter(f=>{
        const c = norm(f.connection || f.ct || '');
        if (c === 'both' || c === 'any') return true;
        return c === STATE.conn;
      });
    }
    // love language
    if (STATE.ll){
      list = list.filter(f=> llKey(f) === STATE.ll);
    }
    // sort
    if (STATE.sort === 'az'){
      list.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    } else if (STATE.sort === 'score-asc'){
      list.sort((a,b)=> stableScore(a) - stableScore(b));
    } else {
      list.sort((a,b)=> stableScore(b) - stableScore(a));
    }

    // render using your existing renderer, then enhance cards
    if (typeof window.render === 'function') window.render(list);
    enhanceCards(list);
  }

  // debounce search
  const debounce = (fn,ms=250)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

  // wire controls
  $('#friendsSearch')?.addEventListener('input', debounce(e => { STATE.q = e.target.value; applyFilters(); }, 250));
  $('#filterConnection')?.addEventListener('click', e=>{
    const c = e.target.closest('.chip'); if(!c) return;
    STATE.conn = c.dataset.val || '';
    $$('#filterConnection .chip').forEach(x=>x.classList.toggle('is-active', x===c));
    applyFilters();
  });
  $('#filterLoveLanguage')?.addEventListener('click', e=>{
    const c = e.target.closest('.chip'); if(!c) return;
    STATE.ll = c.dataset.val || '';
    $$('#filterLoveLanguage .chip').forEach(x=>x.classList.toggle('is-active', x===c));
    applyFilters();
  });
  $('#friendsSort')?.addEventListener('click', e=>{
    const c = e.target.closest('.chip'); if(!c) return;
    STATE.sort = c.dataset.sort || 'score-desc';
    $$('#friendsSort .chip').forEach(x=>x.setAttribute('aria-pressed', x===c ? 'true':'false'));
    applyFilters();
  });

  // turn off copy buttons everywhere
  const ENABLE_COPY_BUTTONS = false;
  function enhanceCards(list){
    const cards = $$('#friends-list .friend');
    cards.forEach((card, i)=>{
      const f = list[i] || {};
      // dataset for external filters
      card.dataset.key = (f.id || (f.email||'').toLowerCase() || (f.instagram||'').toLowerCase() || (f.name||'') );
      card.dataset.connection = (f.connection || f.ct || 'both').toLowerCase();

      // love-language badge near name
      const nameEl = card.querySelector('.friend-meta .name');
      if (nameEl && !nameEl.nextElementSibling?.classList?.contains('ll-badge')){
        const map = {
          acts:'Acts of Service', gifts:'Receiving Gifts', quality_time:'Quality Time',
          physical_touch:'Physical Touch', words:'Words of Affirmation', unknown:'Unknown'
        };
        const s = document.createElement('span');
        s.className = 'll-badge chip';
        s.style.marginLeft = '.4rem';
        s.textContent = map[llKey(f)];
        nameEl.after(s);
      }

      // convert Hobbies/Values lines into chips (max 3 + “+N more”)
      ['hobbies','values'].forEach(kind=>{
        const row = Array.from(card.querySelectorAll('.friend-body > div')).find(d => /^(\s*)?(Hobbies|Values)\s*:/.test(d.textContent||''));
        if (!row) return;
        const items = (kind==='hobbies' ? (f.hobbies||[]) : (f.values||[]));
        if (!items.length) return;
        const box = document.createElement('div');
        box.className = 'chips';
        const cap = document.createElement('b'); cap.textContent = (kind==='hobbies'?'Hobbies: ':'Values: ');
        box.appendChild(cap);

        const wrap = document.createElement('span');
        wrap.className = 'collapsible'; wrap.style.display='inline-block';
        const max = 3;
        items.forEach((t,idx)=>{
          const c = document.createElement('span');
          c.className = 'chip'; c.textContent = t;
          if (idx>=max) c.dataset.more='1';
          wrap.appendChild(c);
        });
        box.appendChild(wrap);

        if (items.length>max){
          const more = document.createElement('span');
          more.className = 'more-toggle'; more.tabIndex=0;
          more.textContent = `+${items.length-max} more`;
          more.setAttribute('role','button');
          let open=false;
          more.onclick = ()=>{ open=!open; $$('.chip[data-more]',wrap).forEach(el=> el.style.display=open?'inline-flex':'none'); more.textContent = open?'Show less':`+${items.length-max} more`; };
          box.appendChild(more);
          // start collapsed
          $$('.chip[data-more]',wrap).forEach(el=> el.style.display='none');
        }
        row.replaceWith(box);
      });

      /* copy helpers next to email/handle inside Contact row (if present anchors) */
if (!ENABLE_COPY_BUTTONS) {
  $$('.copy-btn', card).forEach(b => b.remove());
} else {
  const anchors = card.querySelectorAll(
    '.friend-body a[href^="mailto:"], .friend-body a[href*="instagram.com/"]'
  );
  anchors.forEach(a => {
    if (a.nextElementSibling?.classList?.contains('copy-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy contact');

    btn.onclick = async () => {
      const val = a.href.startsWith('mailto:')
        ? a.href.replace('mailto:', '')
        : a.href;
      try {
        await navigator.clipboard.writeText(val);
        const old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = old), 1200);
      } catch {}
    };

    a.after(btn);
  });
} // <— čia baigiasi copy helperio if/else
}); // <— čia baigiasi cards.forEach
}   // <— čia baigiasi function enhanceCards(list)


  // ---------- Remove with Undo (capture; cancels old immediate delete) ----------
  const TOASTS = (()=>{ const c=document.createElement('div'); c.id='friendsToasts'; document.body.appendChild(c); return c; })();

  function showToast(name, onUndo){
    const t=document.createElement('div'); t.className='toast';
    t.innerHTML=`<span>Removed ${name}.</span><button class="undo" aria-label="Undo removing ${name}">Undo</button>`;
    TOASTS.appendChild(t);
    const btn=t.querySelector('.undo');
    let timer=setTimeout(()=>{ t.remove(); }, 5200);
    btn.onclick=()=>{ clearTimeout(timer); t.remove(); onUndo&&onUndo(); };
    return ()=>{ clearTimeout(timer); t.remove(); };
  }

  document.addEventListener('click', (e)=>{
    const rm = e.target.closest('#friends-list [data-rm]');
    if (!rm) return;
    e.preventDefault(); e.stopPropagation(); // stop old handler

    const card = rm.closest('.friend');
    const key  = card?.dataset.key || '';
    const name = card?.querySelector('.name')?.textContent?.trim() || 'friend';
    card?.classList.add('is-hidden');

    // find friend by key
    let arr = loadAllFriends();
    const idx = arr.findIndex(f => (f.id||'')===key || (f.email||'').toLowerCase()===key || (f.instagram||'').toLowerCase()===key || (f.name||'')===key);
    const fallbackIdx = +rm.getAttribute('data-rm'); // as last resort
    const realIdx = idx>=0 ? idx : fallbackIdx;
    const removed = arr[realIdx];

    // schedule delete in 5s unless undone
    const cancelToast = showToast(name, () => {
      // undo
      card?.classList.remove('is-hidden');
    });
    const t = setTimeout(()=>{
      const cur = loadAllFriends();
      const i = realIdx;
      if (i>-1 && cur[i] && (removed ? cur[i].name===removed.name : true)){
        cur.splice(i,1);
        saveAllFriends(cur);
        RAW = cur.slice();
        applyFilters();
      }
      cancelToast();
    }, 5000);
    // If user clicks Undo button, we already restored the card visually; do nothing else.
  }, true); // capture

  // ---------- Add form: validation / normalization / dedupe (capture) ----------
  const form = document.getElementById('add-form');
  function emailOk(v){
  v = (v ?? '').trim();
  return !v || v.includes('@'); // tuščia leidžiama, arba privalo turėti @
}
const cleanPhone = v => (v || '').replace(/[^\d+\- ]/g, ''); // leidžiam +, skaičius, tarpą, minusą
function igHandle(v){
  v = (v || '').trim();
  const m = v.match(/^https?:\/\/(www\.)?instagram\.com\/([^/?#]+)\/?/i);
  if (m) return m[2];
  return v.replace(/^@/, '');
}

  function mergeInto(dst, src){
    const copy = (k)=>{ if (!dst[k] && src[k]) dst[k]=src[k]; };
    ['photo','ct','ll','hobbies','values','contact','notes','whatsapp','instagram','facebook','email'].forEach(k=>{
      if (!dst[k] && src[k]) dst[k]=src[k];
    });
    // keep name; do not override existing non-empty
    return dst;
  }
  form && form.addEventListener('submit', (e)=>{
    // handle here, stop old submit listener
    e.preventDefault(); e.stopPropagation();

    const nm = document.getElementById('f-name')?.value?.trim();
    if (!nm){ alert('Please enter a name.'); return; }

    const ig = igHandle(document.getElementById('f-instagram')?.value?.trim());
    const em = document.getElementById('f-email')?.value?.trim();
    if (em && !emailOk(em)){ alert('Please enter a valid email.'); return; }

    const friend = {
      name: nm,
      photo: document.getElementById('f-photo')?.value?.trim() || '',
      ct: (document.getElementById('f-ct')?.value || '').trim(),
      ll: (document.getElementById('f-ll')?.value || '').trim(),
      hobbies: (document.getElementById('f-hobbies')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
      values:  (document.getElementById('f-values')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
      contact: document.getElementById('f-contact')?.value?.trim() || '',
      notes:   document.getElementById('f-notes')?.value?.trim() || '',
      whatsapp: phoneDigits(document.getElementById('f-whatsapp')?.value),
      instagram: ig,
      facebook: document.getElementById('f-facebook')?.value?.trim() || '',
      email: em || ''
    };
    // dedupe by email OR instagram handle (case-insensitive)
    const arr = loadAllFriends();
    const byEmail = em ? arr.findIndex(x => (x.email||'').toLowerCase() === em.toLowerCase()) : -1;
    const byIg    = ig ? arr.findIndex(x => (x.instagram||'').toLowerCase() === ig.toLowerCase()) : -1;
    const dupIdx = byEmail>-1 ? byEmail : (byIg>-1 ? byIg : -1);

    if (dupIdx>-1){
      const choice = prompt(`This contact exists.\nType: UPDATE to merge, SKIP to cancel, NEW to add as another.`);
      if (!choice || /skip/i.test(choice)) return;
      if (/update/i.test(choice)){
        arr[dupIdx] = mergeInto(arr[dupIdx], friend);
        saveAllFriends(arr);
        RAW = arr.slice();
        form.reset(); applyFilters(); return;
      }
      // NEW -> add with suffix
      friend.name = `${friend.name} (2)`;
    }
    arr.unshift(friend);
    saveAllFriends(arr);
    RAW = arr.slice();
    form.reset();
    applyFilters();
  }, true); // capture

  // ---------- Export / Import JSON (shape + merge choices) ----------
  const expBtn = document.getElementById('exportFriends');
  expBtn && expBtn.addEventListener('click', (e)=>{
    e.preventDefault(); e.stopPropagation();
    const data = { version:1, items: loadAllFriends() };
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='soulink-friends.json'; a.click();
    URL.revokeObjectURL(url);
  }, true);

  const impBtn = document.getElementById('importFriends');
  const impFile= document.getElementById('importFile');
  impBtn && impBtn.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); impFile?.click(); }, true);
  impFile && impFile.addEventListener('change', (e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const parsed = JSON.parse(reader.result);
        const items = Array.isArray(parsed?.items) ? parsed.items :
                      (Array.isArray(parsed) ? parsed : []);
        if (!Array.isArray(items)) throw new Error('Invalid JSON');

        const existing = loadAllFriends();
        const emailMap = new Map(existing.map((f,i)=>[(f.email||'').toLowerCase(),i]));
        const igMap    = new Map(existing.map((f,i)=>[(f.instagram||'').toLowerCase(),i]));

        const choice = prompt('Duplicates: MERGE to prefer imported non-empty, SKIP to keep existing, REPLACE to override existing.');
        const out = existing.slice();

        items.forEach(f=>{
          const ekey=(f.email||'').toLowerCase(), ikey=(f.instagram||'').toLowerCase();
          const hit = (ekey && emailMap.has(ekey)) ? emailMap.get(ekey)
                    : (ikey && igMap.has(ikey)) ? igMap.get(ikey) : -1;
          if (hit<0){ out.push(f); return; }
          if (/replace/i.test(choice)){ out[hit] = f; return; }
          if (/merge/i.test(choice)){
            const dst = out[hit];
            Object.keys(f).forEach(k=>{ if(!dst[k] && f[k]) dst[k]=f[k]; });
          }
          // skip => do nothing
        });

        saveAllFriends(out); RAW = out.slice(); applyFilters();
      }catch(err){ alert('Invalid JSON.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, true);

  // ---------- hydrate snapshot from soulink.soulQuiz (non-breaking) ----------
  (function hydrateSnapshot(){
    const me = loadQuiz();
    const get = (v)=> Array.isArray(v) ? v.join(', ') : (v||'—');
    const S = (sel,val)=>{ const el=document.querySelector(sel); if(el) el.textContent = val; };
    S('#me-name', me.name || '—');
    S('#me-ct',   me.connectionType || me.connection || '—');
    S('#me-ll',   (Array.isArray(me.loveLanguages) ? me.loveLanguages[0] : (me.loveLanguage || '—')));
    S('#me-hobbies', get(me.hobbies));
    S('#me-values',  get(me.values));
  })();

  // ---------- initial paint ----------
  applyFilters();
})();
/* =========================================================
   Soulink · Friends — card normalize + +N more + Remove→Undo
   and Add-form validation/normalization (non-breaking)
   ========================================================= */
(() => {
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  // ---------- Toast container ----------
  const TOASTS = (()=>{ let c=$('#friendsToasts'); if(!c){ c=document.createElement('div'); c.id='friendsToasts'; c.setAttribute('aria-live','polite'); c.setAttribute('aria-atomic','true'); document.body.appendChild(c);} return c; })();
  const showToast = (msg, onUndo) => {
    const el=document.createElement('div'); el.className='toast';
    el.innerHTML = `<span>${msg}</span><button class="undo" aria-label="Undo">${'Undo'}</button>`;
    TOASTS.appendChild(el);
    const btn=el.querySelector('.undo');
    let t=setTimeout(()=>{ el.remove(); },5200);
    btn.onclick=()=>{ clearTimeout(t); el.remove(); onUndo&&onUndo(); };
  };

  // ---------- Helpers ----------
  const norm = s => (s||'').toString().trim();
  const uniq = arr => { const seen=new Set(), out=[]; for(const x of arr){ const k=x.toLowerCase(); if(!seen.has(k)){ seen.add(k); out.push(x);} } return out; };
  const splitList = (txt) => norm(txt).split(/[,\u00B7|/]+/).map(s=>s.trim()).filter(Boolean);

  // Extract chips/text tokens from a "Hobbies:" or "Values:" row
  function tokensFromRow(row){
    const chips = $$('.chip', row).map(x=>norm(x.textContent));
    if (chips.length) return chips.filter(Boolean);
    const after = (row.textContent||'').split(':').slice(1).join(':'); // everything after first colon
    return splitList(after);
  }

  // Build labeled chips row with +N more (max 3 shown)
  function buildLabeledChips(label, items){
    const wrap = document.createElement('div');
    wrap.className='chips';
    const b = document.createElement('b'); b.textContent = label + ': '; wrap.appendChild(b);

    const box = document.createElement('span'); box.className = 'collapsible'; wrap.appendChild(box);

    const max=3; items.forEach((t,i)=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=t; if(i>=max) c.dataset.more='1'; box.appendChild(c); });

    if(items.length>max){
      const more=document.createElement('span'); more.className='more-toggle'; more.setAttribute('role','button'); more.tabIndex=0;
      let open=false;
      function paint(){ $$('.chip[data-more]',box).forEach(el=> el.style.display=open?'inline-flex':'none'); more.textContent=open?'Show less':`+${items.length-max} more`; }
      more.onclick=()=>{ open=!open; paint(); };
      more.onkeydown=(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); more.click(); } };
      wrap.appendChild(more);
      paint();
    }
    return wrap;
  }

  // Merge duplicated "Values:" rows into one; also compact Hobbies/Values lines
  function normalizeCard(card){
    const body = card.querySelector('.friend-body') || card;
    if(!body) return;

    // Score pin
    const sc = card.querySelector('.score'); if(sc) sc.classList.add('score-badge');

    // gather all rows that start with "Values:" or "Hobbies:"
    const rows = $$('.friend-body > *', card);
    const valRows = rows.filter(el => /^values\s*:/i.test((el.textContent||'').trim()));
    const hobRows = rows.filter(el => /^hobbies\s*:/i.test((el.textContent||'').trim()));

    if (valRows.length){
      const items = uniq(valRows.flatMap(tokensFromRow));
      const repl = buildLabeledChips('Values', items);
      valRows[0].replaceWith(repl);
      valRows.slice(1).forEach(el=>el.remove());
    }
    if (hobRows.length){
      const items = uniq(hobRows.flatMap(tokensFromRow));
      const repl = buildLabeledChips('Hobbies', items);
      hobRows[0].replaceWith(repl);
      hobRows.slice(1).forEach(el=>el.remove());
    }
  }

  // Enhance all current cards (call after your render runs)
  function enhanceAll(){
    $$('#friends-list .friend').forEach(normalizeCard);
  }

  // If your app has a global render() -> patch to enhance after it finishes
  if (typeof window.render === 'function'){
    const __render = window.render;
    window.render = function(...args){ const out = __render.apply(this,args); try{ enhanceAll(); }catch{} return out; };
  }
  // Run once on load as well
  if (document.readyState !== 'loading') enhanceAll();
  else document.addEventListener('DOMContentLoaded', enhanceAll);

  // ---------- Remove with Undo (optimistic) ----------
  document.addEventListener('click',(e)=>{
    const btn = e.target.closest('.friend .btn, .friend [data-rm]');
    if(!btn) return;
    const label = (btn.textContent||'').trim().toLowerCase();
    if (!/remove/.test(label)) return;

    e.preventDefault(); e.stopPropagation();

    const card = btn.closest('.friend'); if(!card) return;
    const name = norm(card.querySelector('.name')?.textContent) || 'Friend';
    card.classList.add('is-hidden');

    // Remove from storage after 5s unless undone
    let timer = setTimeout(()=> persistRemove(name), 5000);
    showToast(`Friend removed —`, ()=>{ clearTimeout(timer); card.classList.remove('is-hidden'); });
  }, true);

  function loadFriends(){
    try{
      const a = JSON.parse(localStorage.getItem('soulink.friends.list')||'null');
      if (Array.isArray(a)) return a;
      return JSON.parse(localStorage.getItem('soulFriends')||'[]')||[];
    }catch{ return []; }
  }
  function saveFriends(list){
    try{ localStorage.setItem('soulink.friends.list', JSON.stringify(list)); }catch{}
    try{ localStorage.setItem('soulFriends', JSON.stringify(list)); }catch{}
  }
  function persistRemove(name){
    const list = loadFriends();
    const i = list.findIndex(f => (f.name||'').trim().toLowerCase() === name.toLowerCase());
    if (i>-1){ list.splice(i,1); saveFriends(list); }
    // re-render if your app exposes render(list)
    if (typeof window.render === 'function') window.render(list);
    enhanceAll();
  }

  // ---------- Add Friend: validate + normalize (no markup changes) ----------
  const form = document.getElementById('add-form');
  function emailOk(v){ return !v || v.includes('@'); }
  const cleanPhone = v => (v||'').replace(/[^\d+ -]/g,''); // allow +, digits, space, dash
  function igHandle(v){
    v = (v||'').trim();
    const m=v.match(/^https?:\/\/(www\.)?instagram\.com\/([^/?#]+)\/?/i);
    if (m) return m[2];
    return v.replace(/^@/,'');
  }
  form && form.addEventListener('submit',(e)=>{
    // normalize into inputs so existing handler saves normalized values
    const f = form;
    const email = f.querySelector('#f-email') || f.querySelector('input[type="email"]');
    const wa    = f.querySelector('#f-whatsapp');
    const insta = f.querySelector('#f-instagram');

    if (email && !emailOk(email.value)) {
  e.preventDefault();
  alert('Please enter a valid email (must contain @).');
  return;
}


    // clear fields after your original handler runs
    setTimeout(()=>{ try{ f.reset(); }catch{} }, 0);
  }, true);
})();
/* =========================================================
   Soulink · Friends — tiny polish (non-breaking)
   - Navbar order + active
   - Snapshot hydrate from localStorage.soulQuiz (with fallback)
   - Clear All fixes (form reset)
   - Ensure freshly added friend shows immediately
   - Values/Hobbies: dedupe + chips + "+N more"
   - Keep filters/sort working (calls existing render/applyFilters if present)
   - Next → Results link fix
   ========================================================= */
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* ---------- Navbar: order + glow (like other pages) ---------- */
  (function fixNav(){
    const ul = $('#navMenu') || $('.nav-links');
    if(!ul) return;
    const desired = [
      'Home','Quiz','Edit Profile','My Soul','Soul Chart','Soul Coach',
      'Match','Friends','Results','Log In','Sign Up','Log Out'
    ];
    const items = Array.from(ul.querySelectorAll('li, a')).map(n => n.tagName==='A' ? n.parentElement : n).filter(Boolean);
    const byLabel = new Map();
    items.forEach(li => {
      const a = li.querySelector('a'); if(!a) return;
      const label = (a.textContent||'').trim();
      if(!byLabel.has(label)) byLabel.set(label, li); else li.remove(); // remove dup separators/cards
    });
    desired.forEach(label => { const li = byLabel.get(label); if(li) ul.appendChild(li); });
    // active
    ul.querySelectorAll('a').forEach(a => {
      const isHere = /friends\.html$/i.test(a.getAttribute('href')||'');
      a.classList.toggle('active', isHere);
      if (isHere) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
  })();

  /* ---------- Snapshot hydrate (Name/Connection/LL/Hobbies/Values) ---------- */
  (function snapshot(){
    function readQuiz(){
      try{
        return JSON.parse(localStorage.getItem('soulink.soulQuiz')) ||
               JSON.parse(localStorage.getItem('soulQuiz')) || {};
      }catch{ return {}; }
    }
    const toList = v => Array.isArray(v) ? v
      : (typeof v === 'string' ? v.split(/[,\n]/).map(s=>s.trim()).filter(Boolean) : []);
    const uniq = arr => { const s=new Set(); return arr.filter(x=>{ const k=(x||'').toLowerCase(); if(s.has(k))return false; s.add(k); return true; }); };

    function setText(sel,val){ const el=$(sel); if(!el) return; el.textContent=(val && String(val).trim()) ? String(val) : '–'; }
    function chips(sel, arr){
      const box=$(sel); if(!box) return;
      box.innerHTML='';
      const list = uniq(toList(arr));
      if(!list.length){ box.textContent='–'; return; }
      list.forEach(t=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=t; box.appendChild(c); });
    }

    function hydrate(){
      const q = readQuiz();
      setText('#me-name', q.name);
      setText('#me-ct', q.connection || q.connectionType);
      setText('#me-ll', (Array.isArray(q.loveLanguages) && q.loveLanguages[0]) || q.loveLanguage || '–');
      chips('#me-hobbies', q.hobbies);
      chips('#me-values',  q.values);
    }
    document.addEventListener('DOMContentLoaded', hydrate);
    window.addEventListener('soulink:updateSnapshot', hydrate);
  })();

  /* ---------- Clear All: tikras form reset (nekeičiant markup) ---------- */
  (function clearAllFix(){
    const btn = $('#clearAll') || $$('button').find(b => /^clear all$/i.test(b.textContent||''));
    if(!btn) return;
    btn.addEventListener('click', () => {
      const scope = btn.closest('.card') || document;
      $$('input,select,textarea', scope).forEach(el=>{
        if(el.type==='checkbox'||el.type==='radio') el.checked=false;
        else el.value='';
      });
    });
  })();

  /* ---------- Make new friend appear immediately after Add ---------- */
  (function showAfterAdd(){
    // Find the "Add" button next to the form.
    const addBtn = $('#addFriendBtn') || $$('button').find(b => /^\s*add\s*$/i.test(b.textContent||''));
    if(!addBtn) return;
    addBtn.addEventListener('click', () => {
      // Give the page's own "add" handler a tick to write to storage, then re-render.
      setTimeout(() => {
        try {
          if (typeof window.applyFilters === 'function') { window.applyFilters(); }
          else if (typeof window.render === 'function')   { window.render(); }
          // call any enhancers you have (chips, +N more, etc.)
          document.dispatchEvent(new CustomEvent('friends:enhance'));
        } catch {}
      }, 30);
    });
  })();

  /* ---------- Cards: dedupe Values/Hobbies + compact chips with +N ---------- */
  (function enhanceCards(){
    const uniq = arr => { const s=new Set(); return arr.filter(x=>{ const k=(x||'').toLowerCase(); if(s.has(k))return false; s.add(k); return true; }); };
    const tokensFrom = (row, key) => {
      // Try chips first
      const chips = $$('.chip', row).map(x=> (x.textContent||'').trim()).filter(Boolean);
      if (chips.length) return chips;
      // Fallback: text after "Values:" or "Hobbies:"
      const t = (row.textContent||'').split(':').slice(1).join(':');
      return t.split(/[,\u00B7|/]+/).map(s=>s.trim()).filter(Boolean);
    };
    function buildLine(label, items){
      const wrap=document.createElement('div');
      wrap.className='chips';
      const b=document.createElement('b'); b.textContent=label+': '; wrap.appendChild(b);
      const box=document.createElement('span'); box.className='collapsible'; wrap.appendChild(box);
      const list = uniq(items);
      list.forEach((t,i)=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=t; if(i>=3) c.dataset.more='1'; box.appendChild(c); });
      if(list.length>3){
        const more=document.createElement('span'); more.className='more-toggle'; more.tabIndex=0; let open=false;
        const paint=()=>{ $$('.chip[data-more]',box).forEach(el=> el.style.display=open?'inline-flex':'none'); more.textContent=open?'Show less':`+${list.length-3} more`; };
        more.onclick=()=>{ open=!open; paint(); };
        more.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); more.click(); } };
        wrap.appendChild(more); paint();
      }
      return wrap;
    }
    function normalizeCard(card){
      const area = card.querySelector('.friend-body') || card;
      if(!area) return;

      // Score pin
      const sc = card.querySelector('.score');
      if (sc){ sc.style.position='absolute'; sc.style.top='8px'; sc.style.right='8px'; }

      // Merge/compact "Values:" rows
      const rows = Array.from(area.children);
      const valRows = rows.filter(el => /^values\s*:/i.test((el.textContent||'').trim()));
      if (valRows.length){
        const list = valRows.flatMap(r=>tokensFrom(r,'values'));
        const line = buildLine('Values', list);
        valRows[0].replaceWith(line);
        valRows.slice(1).forEach(el=>el.remove());
      }
      // Merge/compact "Hobbies:" rows
      const hobRows = rows.filter(el => /^hobbies\s*:/i.test((el.textContent||'').trim()));
      if (hobRows.length){
        const list = hobRows.flatMap(r=>tokensFrom(r,'hobbies'));
        const line = buildLine('Hobbies', list);
        hobRows[0].replaceWith(line);
        hobRows.slice(1).forEach(el=>el.remove());
      }
    }
    function run(){ $$('#friends-list .friend').forEach(normalizeCard); }
    if (document.readyState !== 'loading') run(); else document.addEventListener('DOMContentLoaded', run);
    document.addEventListener('friends:enhance', run);
    // if your render() exists, patch once so enhancement runs after it
    if (typeof window.render === 'function' && !window.__friendsEnhPatched){
      const r = window.render; window.render = function(...a){ const out = r.apply(this,a); try{ run(); }catch{} return out; };
      window.__friendsEnhPatched = true;
    }
  })();

  /* ---------- Fix footer Next → Results ---------- */
  (function fixNext(){
    const next = $$('a,button').find(el => /next/i.test(el.textContent||''));
    if(next && next.tagName==='A') next.setAttribute('href','results.html');
  })();
})();

