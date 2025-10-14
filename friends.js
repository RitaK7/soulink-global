(() => {
// ---------- helpers ----------
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const LS_KEY = 'soulFriends';
const LEGACY_KEYS = ['friends', 'friendsList']; // senesni raktai

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
    whatsapp:(f.whatsapp||'').trim(),
    instagram:(f.instagram||'').trim(),
    facebook:(f.facebook||'').trim(),
    email:(f.email||'').trim(),
  };
}

// ---------- demo scoring for Friends list ----------
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
  return items.length ? `<div class="social-icons" style="margin:.5rem 0 .2rem;">${items.join('')}</div>` : '';
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
    const cls = score >= 75 ? 'good' : score >= 55 ? 'ok' : 'low';
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

// delegated actions
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

// add
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
  updatePreviewIcons();
  render(arr);
});

// clear
$('#clearAll')?.addEventListener('click', () => {
  if (confirm('Clear all friends?')){
    saveFriends([]);
    render([]);
  }
});

// export / import
$('#exportFriends')?.addEventListener('click', () => {
  const arr = loadFriends();
  const blob = new Blob([JSON.stringify(arr,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'soulink-friends.json'; a.click();
  URL.revokeObjectURL(url);
});
$('#importFriends')?.addEventListener('click', () => { $('#importFile')?.click(); });
$('#importFile')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const arr = JSON.parse(reader.result);
      if (!Array.isArray(arr)) throw new Error('Invalid JSON');
      saveFriends(arr);
      render(arr);
    }catch{ alert('Invalid JSON file.'); }
  };
  reader.readAsText(file);
});

// EDIT modal
const modal = $('#editModal'); let editIdx = -1;
function setVal(sel, val){ const el=document.querySelector(sel); if(!el){ console.warn('Missing:',sel); return false; } el.value=val??''; return true; }
function openEdit(i){
  const arr = loadFriends(); const f = arr[i]; if (!f) return;
  editIdx = i;
  const ok =
    setVal('#e-name', f.name) & setVal('#e-ct', f.ct) & setVal('#e-ll', f.ll) &
    setVal('#e-hobbies', (f.hobbies||[]).join(', ')) & setVal('#e-values', (f.values||[]).join(', ')) &
    setVal('#e-contact', f.contact) & setVal('#e-notes', f.notes) & setVal('#e-photo', f.photo) &
    setVal('#e-whatsapp', f.whatsapp||'') & setVal('#e-instagram', f.instagram||'') &
    setVal('#e-facebook', f.facebook||'') & setVal('#e-email', f.email||'');
  if (!ok){ alert('Edit form is missing fields. Refresh the page.'); return; }
  modal.hidden = false;
}
$('#editCancel')?.addEventListener('click', () => { modal.hidden = true; editIdx = -1; });
$('#edit-form')?.addEventListener('submit', (e) => {
  e.preventDefault(); if (editIdx < 0) return;
  const arr = loadFriends();
  arr[editIdx] = normFriend({
    name:$('#e-name')?.value, photo:$('#e-photo')?.value, ct:$('#e-ct')?.value, ll:$('#e-ll')?.value,
    hobbies:$('#e-hobbies')?.value, values:$('#e-values')?.value, contact:$('#e-contact')?.value, notes:$('#e-notes')?.value,
    whatsapp:$('#e-whatsapp')?.value, instagram:$('#e-instagram')?.value, facebook:$('#e-facebook')?.value, email:$('#e-email')?.value
  });
  modal.hidden = true; editIdx = -1; saveFriends(arr); render(arr);
});

// Snapshot
function fillSnapshot(){
  const me = readJSON('soulQuiz') || {};
  const getText = (v, fallback='–') => Array.isArray(v) ? (v.join(', ')||fallback) : (v||fallback);
  const setTxt = (sels, val) => (Array.isArray(sels)?sels:[sels]).forEach(s=>{ const el=document.querySelector(s); if(el) el.textContent=val; });

  setTxt(['#snapshot-name','#me-name'], me.name || '–');
  setTxt(['#snapshot-connection','#me-ct'], me.connectionType || '–');
  setTxt(['#snapshot-loveLanguage','#me-ll'], me.loveLanguage || '–');
  setTxt(['#snapshot-hobbies','#me-hobbies'], getText(me.hobbies));
  setTxt(['#snapshot-values','#me-values'],  getText(me.values));
}

// Live contact preview
function updatePreviewIcons(){
  const wrap = $('#contactPreview'); if (!wrap) return;
  const w  = $('#f-whatsapp')?.value?.trim(); const ig = $('#f-instagram')?.value?.trim();
  const fb = $('#f-facebook')?.value?.trim(); const em = $('#f-email')?.value?.trim();

  const waA = wrap.querySelector('.wa'), igA = wrap.querySelector('.ig');
  const fbA = wrap.querySelector('.fb'), emA = wrap.querySelector('.em');

  if (w && digits(w)){ waA.removeAttribute('hidden'); waA.href='https://wa.me/'+digits(w); waA.target='_blank'; waA.rel='noopener'; }
  else waA.setAttribute('hidden','');

  if (ig){ igA.removeAttribute('hidden'); igA.href=/^https?:\/\//i.test(ig)?ig:'https://instagram.com/'+ig.replace(/^@/,''); igA.target='_blank'; igA.rel='noopener'; }
  else igA.setAttribute('hidden','');

  if (fb){ fbA.removeAttribute('hidden'); fbA.href=/^https?:\/\//i.test(fb)?fb:'https://facebook.com/'+fb.replace(/^@/,''); fbA.target='_blank'; fbA.rel='noopener'; }
  else fbA.setAttribute('hidden','');

  if (em && /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(em)){ emA.removeAttribute('hidden'); emA.href='mailto:'+em; }
  else emA.setAttribute('hidden','');
}
['#f-whatsapp','#f-instagram','#f-facebook','#f-email'].forEach(sel => {
  $(sel)?.addEventListener('input', updatePreviewIcons);
});

// init
fillSnapshot(); render(); updatePreviewIcons();
})();
