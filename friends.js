// friends.js — Soulink (compat %, edit modal, clean rendering)
(() => {
  const KEY_PROFILE = 'soulQuiz';
  const KEY_FRIENDS = 'soulinkFriends';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- helpers ----------
  const escapeHTML = (s='') =>
    s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));

  const csv = (arr=[]) => (arr || []).filter(Boolean).join(', ');
  const tokenizeCSV = (s='') => s.split(',').map(v => v.trim()).filter(Boolean);

  // “tuščių” reikšmių normalizavimas
  const clean = (v='') => {
    const s = String(v).trim();
    if (!s) return '';
    const bad = ['any','unknown','–','-'];
    return bad.includes(s.toLowerCase()) ? '' : s;
  };

  // friend objektas į tvarkingą formą
    const normFriend = (o = {}) => ({
    name:    (o.name || '').trim(),
    photo:   (o.photo || o.avatar || '').trim(),
    ct:      clean(o.ct || o.connection || o.type),
    ll:      clean(o.ll || o.loveLanguage || o.language),
    hobbies: Array.isArray(o.hobbies) ? o.hobbies.map(String) : tokenizeCSV(o.hobbies || ''),
    values:  Array.isArray(o.values)  ? o.values.map(String)  : tokenizeCSV(o.values  || ''),
    contact: (o.contact || o.email || o.phone || o.link || '').trim(),
    notes:   (o.notes || '').trim()
   });
 
  const loadProfile = () => { try { return JSON.parse(localStorage.getItem(KEY_PROFILE) || '{}'); } catch { return {}; } };
  const loadFriends = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]');
      const normed = raw.map(normFriend);
      if (JSON.stringify(raw) !== JSON.stringify(normed)) {
        localStorage.setItem(KEY_FRIENDS, JSON.stringify(normed));
      }
      return normed;
    } catch { return []; }
  };
  const saveFriends = (list) => localStorage.setItem(KEY_FRIENDS, JSON.stringify(list));

  // migracija iš seno rakto (jei buvo)
  try {
    const legacy = localStorage.getItem('friends');
    if (legacy && !localStorage.getItem(KEY_FRIENDS)) {
      localStorage.setItem(KEY_FRIENDS, legacy);
      localStorage.removeItem('friends');
    }
  } catch {}

  // ---------- Me snapshot ----------
  const me = loadProfile();
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '–'; };

  setTxt('me-name',    me.name || '–');
  setTxt('me-ct',      me.connectionType || '–');
  setTxt('me-ll',      me.loveLanguage   || '–');
  setTxt('me-hobbies', csv(me.hobbies));
  setTxt('me-values',  csv(me.values));

  // ---------- scoring (0..100) ----------
  function scoreWithMe(f){
    let score = 0;
    if (me.connectionType && f.ct && me.connectionType === f.ct) score += 20;
    if (me.loveLanguage   && f.ll && me.loveLanguage   === f.ll) score += 30;

    const myH  = new Set((me.hobbies || []).map(String));
    const hisH = new Set((f.hobbies  || []).map(String));
    let h = 0; hisH.forEach(x => { if (myH.has(x)) h++; });
    score += Math.min(20, h * 5);

    const myV  = new Set((me.values || []).map(String));
    const hisV = new Set((f.values || []).map(String));
    let v = 0; hisV.forEach(x => { if (myV.has(x)) v++; });
    score += Math.min(30, v * 3);

    return Math.max(0, Math.min(100, score));
  }

  // kontaktų link’ai
  // --- Avatar (ATSIRANDA AUKŠTAI, UŽ contactLink RIBŲ) ---
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

// --- Kontaktų nuorodos normalizatorius (ATSIRANDA ATSKIRAI) ---
function contactLink(c){
  if (!c) return null;
  const v = c.trim();

  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v)) return `mailto:${v}`;
  if (/^\+?\d[\d\s-]{6,}$/.test(v)) return `https://wa.me/${v.replace(/\D/g,'')}`;
  if (/^@?[\w.]{2,}$/i.test(v)) return `https://instagram.com/${v.replace(/^@/,'')}`;
  return null;
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
      const msg   = contactLink(f.contact);

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

    card.innerHTML = `
    <div class="friend-head">
    <div class="friend-meta">
      ${img}
    <span class="name">${escapeHTML(f.name || '--')}</span>
     </div>
    <span class="score ${cls}" title="Compatibility">${score}%</span>
     </div>
    <div class="friend-body">
    ${lines.join('') || '<div><i>No extra details.</i></div>'}
    </div>
    <div class="friend-actions" style="display:flex; gap:.5rem;">
    <button type="button" class="btn btn-ghost" data-edit="${i}">Edit</button>
    <button type="button" class="btn btn-ghost" data-rm="${i}">Remove</button>
  </div>
`;
// !!! čia NEBETURI BŪTI ".;" eilutės !!!
   listEl.appendChild(card);
   $$('#list [data-edit]')
   $$('#list [data-rm]')

   // po to kai sudedi korteles į listEl:
$$('#list [data-edit]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const i = +btn.getAttribute('data-edit');
    openEdit(i);
  });
});

$$('#list [data-rm]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const i = +btn.getAttribute('data-rm');
    const arr = loadFriends();
    arr.splice(i, 1);
    saveFriends(arr);
    render(arr);
  });
});

    });

    // remove
    $$('[data-rm]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.getAttribute('data-rm');
        const arr = loadFriends();
        arr.splice(idx, 1);
        saveFriends(arr);
        render(arr);
      });
    });

    // edit
    $$('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openEdit(+btn.getAttribute('data-edit')));
    });
  }

  render(); // pirmas piešimas

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
  });
  if (!f.name){ alert('Please enter a name.'); return; }

  const arr = loadFriends();
  if (arr.some(x => (x.name||'').toLowerCase() === f.name.toLowerCase()) &&
      !confirm(`"${f.name}" already exists. Add anyway?`)) return;

  arr.push(f);
  saveFriends(arr);
  e.target.reset();
  render(arr);
});

  // ---------- clear all ----------
  $('#clearAll')?.addEventListener('click', () => {
    if (confirm('Clear all friends?')){
      saveFriends([]);
      render([]);
    }
  });

  // ---------- export ----------
  $('#exportFriends')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(loadFriends(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'soulink-friends.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ---------- import (merge by name) ----------
  $('#importFriends')?.addEventListener('click', () => {
    const picker = $('#importFile');
    if (!picker) return;

    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;
      try {
        const text  = await file.text();
        const data  = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('JSON must be an array');

        const current = loadFriends();
        const byName  = new Map(current.map(x => [(x.name||'').toLowerCase(), x]));
        data.map(normFriend).forEach(f => { byName.set((f.name||'').toLowerCase(), f); });

        const merged = Array.from(byName.values());
        saveFriends(merged);
        render(merged);
      } catch (err) {
        alert('Import failed: ' + err.message);
      } finally {
        picker.value = '';
      }
    };
    picker.click();
  });

  // ---------- EDIT MODAL ----------
const modal = $('#editModal');
let editIdx = -1;

function openEdit(i){
  const arr = loadFriends();
  const f = arr[i];
  if (!f) return;

  editIdx = i;
  $('#e-name').value    = f.name || '';
  $('#e-ct').value      = f.ct || '';
  $('#e-ll').value      = f.ll || '';
  $('#e-hobbies').value = (f.hobbies || []).join(', ');
  $('#e-values').value  = (f.values  || []).join(', ');
  $('#e-contact').value = f.contact || '';
  $('#e-notes').value   = f.notes || '';
  $('#e-photo').value   = f.photo || '';

  modal.hidden = false;
}

$('#editCancel')?.addEventListener('click', () => {
  modal.hidden = true;
  editIdx = -1;
});

// ---------- EDIT: save ----------
$('#edit-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (editIdx < 0) return;

  const arr = loadFriends();

  const updated = normFriend({
    name:    $('#e-name').value,
    photo:   $('#e-photo').value,
    ct:      $('#e-ct').value,
    ll:      $('#e-ll').value,
    hobbies: $('#e-hobbies').value,
    values:  $('#e-values').value,
    contact: $('#e-contact').value,
    notes:   $('#e-notes').value,
  });

  arr[editIdx] = updated;
  saveFriends(arr);
  modal.hidden = true;
  editIdx = -1;
    render(arr);
});         // uždaro '#edit-form' submit listener
})();       // uždaro IIFE, kuri prasidėjo pačioje pradžioje

