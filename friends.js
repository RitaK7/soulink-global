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

// ---------- storage + migration ----------
function readJSON(key){
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

function loadFriends(){
  // 1) pagrindinis raktas
  const cur = readJSON(LS_KEY);
  if (Array.isArray(cur)) return cur;

  // 2) migracija iš senų raktų
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

// ---------- contact link ----------
function contactLink(c){
  if (!c) return null;
  const v = c.trim();

  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v)) return `mailto:${v}`;
  if (/^\+?\d[\d\s-]{6,}$/.test(v)) return `https://wa.me/${v.replace(/\D/g,'')}`;
  if (/^@?[\w.]{2,}$/i.test(v)) return `https://instagram.com/${v.replace(/^@/, '')}`;
  return null;
}

// ---------- scoring (demo) ----------
function scoreWithMe(f){
  // jei turi tikrą formulę – įdėsim; kol kas demo, kad matytųsi %-ai
  return Math.floor(Math.random()*41) + 60; // 60–100
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
  };
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
    listEl.appendChild(card);
  });
}

// ---------- delegated actions (Edit/Remove) ----------
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

// ---------- clear ----------
$('#clearAll')?.addEventListener('click', () => {
  if (confirm('Clear all friends?')){
    saveFriends([]);
    render([]);
  }
});

// ---------- export ----------
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

// ---------- EDIT MODAL ----------
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

  // saugiai pildom laukus; jei kurio nėra – parasysim į Console
  const ok1 = setVal('#e-name',    f.name);
  const ok2 = setVal('#e-ct',      f.ct);
  const ok3 = setVal('#e-ll',      f.ll);
  const ok4 = setVal('#e-hobbies', (f.hobbies||[]).join(', '));
  const ok5 = setVal('#e-values',  (f.values ||[]).join(', '));
  const ok6 = setVal('#e-contact', f.contact);
  const ok7 = setVal('#e-notes',   f.notes);
  const ok8 = setVal('#e-photo',   f.photo);

  if (!(ok1 && ok2 && ok3 && ok4 && ok5 && ok6 && ok7 && ok8)) {
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
  });

  arr[editIdx] = updated;
  saveFriends(arr);
  if (modal) modal.hidden = true;
  editIdx = -1;
  render(arr);
});


// ---------- snapshot iš soulQuiz ----------
function fillSnapshot(){
  const me = readJSON('soulQuiz') || {};
  $('#me-name')?.replaceChildren(document.createTextNode(me.name || '–'));
  $('#me-ct')?.replaceChildren(document.createTextNode(me.connectionType || '–'));
  $('#me-ll')?.replaceChildren(document.createTextNode(me.loveLanguage || '–'));

  const hobbies = Array.isArray(me.hobbies) ? me.hobbies.join(', ')
                 : (typeof me.hobbies === 'string' ? me.hobbies : '–');
  const values  = Array.isArray(me.values) ? me.values.join(', ')
                 : (typeof me.values === 'string' ? me.values : '–');

  $('#me-hobbies')?.replaceChildren(document.createTextNode(hobbies || '–'));
  $('#me-values')?.replaceChildren(document.createTextNode(values  || '–'));
}

// ---------- init ----------
fillSnapshot();
render();

})();
