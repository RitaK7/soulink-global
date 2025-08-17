/* friends.js — Soulink (Friends & Matches) */
/* robust to minor ID variations in friends.html */

document.addEventListener('DOMContentLoaded', () => {
  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const escapeHtml = (s = '') =>
    s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const tag = (t) => `<span class="tag">${escapeHtml(t)}</span>`;
  const csvToArr = (s = '') =>
    s.split(',').map(v => v.trim()).filter(Boolean);

  // ---------- elements (with fallbacks for your markup variants) ----------
  const meLl = $('#me-ll');
  const meHobbies = $('#me-hobbies');
  const meValues = $('#me-values');
  const meName = document.getElementById('me-name') || document.querySelector('[data-me="name"]');
  const meConn = document.getElementById('me-conn') || document.querySelector('[data-me="connection"]');
 
  const addForm = $('#add-form') || $('addForm') || document.querySelector('form.card');
  const fName   = $('#f-name') || $('#fName');
  const fCt     = $('#f-ct')   || $('#fCt');     // Connection
  const fLl     = $('#f-ll')   || $('#fLl');     // Love Language
  const fHobbies= $('#f-hobbies') || $('#fHobbies');
  const fValues = $('#f-values')  || $('#fValues');
  const fNotes  = $('#f-notes')   || null;       // optional field

  const listEl  = $('#friends-list') || document.querySelector('.friends-list') || $('#friendsList');

  const btnExport = $('#btnExport') || $('#exportFriends');
  const btnImport = $('#btnImport') || $('#importFriends');
  const fileInput = $('#fileImport') || $('#importFriendsFile') ||
                    document.querySelector('input[type="file"][accept="application/json"]');

  const emptyNote = $('#empty-note') || { style: { display: 'none' } };

  // ---------- state ----------
  const PROFILE_KEY = 'soulQuiz';
  const FRIENDS_KEY = 'friends';

  const loadProfile = () => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); }
    catch { return {}; }
  };
  const saveFriends = () => localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  const loadFriends = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(FRIENDS_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };

  const me = loadProfile();
  let friends = loadFriends();

  // ---------- snapshot (left panel) ----------
  (function renderSnapshot(){
    if (meLl) meLl.textContent = me.loveLanguage || (me.loveLang || '') || '—';
    if (meHobbies) meHobbies.textContent = (me.hobbies || []).join(', ') || '—';
    if (meValues)  meValues.textContent  = (me.values  || []).join(', ') || '—';
  })();

  // ---------- scoring ----------
  function scoreFriend(f) {
    let score = 0;

    // Connection
    const myConn = (me.connectionType || me.connection || '').toLowerCase();
    const ct = (f.ct || '').toLowerCase();
    if (!ct || ct === 'any') score += 10;
    else if (myConn && (ct === myConn || myConn === 'both' || ct === 'both')) score += 20;

    // Love Language
    const myLL = ((me.loveLanguage || me.loveLang || '') + '').toLowerCase();
    const frLL = ((f.ll || '') + '').toLowerCase();
    if (!frLL || frLL === 'unknown') score += 5;
    else if (myLL && frLL && myLL === frLL) score += 25;

    // Hobbies overlap
    const myH = (me.hobbies || []).map(x => x.toLowerCase());
    const frH = (f.hobbies || []).map(x => x.toLowerCase());
    const hOverlap = myH.filter(x => frH.includes(x)).length;
    if (myH.length && frH.length) {
      const hPart = Math.min(1, hOverlap / Math.max(myH.length, frH.length));
      score += Math.round(hPart * 25);
    }

    // Values overlap
    const myV = (me.values || []).map(x => x.toLowerCase());
    const frV = (f.values || []).map(x => x.toLowerCase());
    const vOverlap = myV.filter(x => frV.includes(x)).length;
    if (myV.length && frV.length) {
      const vPart = Math.min(1, vOverlap / Math.max(myV.length, frV.length));
      score += Math.round(vPart * 25);
    }
    (function renderSnapshot(){
     const me = loadProfile(); // jeigu pas tave 'me' jau globalus - gali nenaudoti šios eilutės
   // Name
     if (meName)  meName.textContent  = me.name || '—';

    // Connection (priima įvairius raktažodžius)
     const conn = me.connectionType || me.connection || me.typeOfConnection || '';
     if (meConn)  meConn.textContent  = conn || '—';

  // Love Language
     const ll = me.loveLanguage || me.loveLang || '';
     if (meLl)    meLl.textContent    = ll || '—';

  // Hobbies
     const hobbies = Array.isArray(me.hobbies)
     ? me.hobbies
     : (typeof me.hobbies === 'string' ? me.hobbies.split(',').map(s=>s.trim()).filter(Boolean) : []);
     if (meHobbies) meHobbies.textContent = hobbies.length ? hobbies.join(', ') : '—';

   // Values
     const values = Array.isArray(me.values)
    ? me.values
    : (typeof me.values === 'string' ? me.values.split(',').map(s=>s.trim()).filter(Boolean) : []);
     if (meValues)  meValues.textContent  = values.length ? values.join(', ') : '—';
  })();

    // Clamp
    score = Math.max(0, Math.min(100, score));
    return score;
  }

  // ---------- render ----------
  function renderFriends() {
    if (!listEl) return;

    listEl.innerHTML = '';
    if (!friends.length) {
      emptyNote.style.display = 'block';
      return;
    }
    emptyNote.style.display = 'none';

    friends.forEach((f, i) => {
      // compute score if missing
      f.score = typeof f.score === 'number' ? f.score : scoreFriend(f);

      const hobbies = (f.hobbies || []).filter(Boolean);
      const values  = (f.values  || []).filter(Boolean);
      const ct = (f.ct && f.ct !== 'Any') ? f.ct : '';
      const ll = (f.ll && f.ll !== 'Unknown') ? f.ll : '';

      const rows = [
        ct && `<div><strong>Connection:</strong> ${escapeHtml(ct)}</div>`,
        ll && `<div><strong>Love Language:</strong> ${escapeHtml(ll)}</div>`,
        hobbies.length && `<div><strong>Hobbies:</strong> ${hobbies.map(tag).join(' ')}</div>`,
        values.length  && `<div><strong>Values:</strong> ${values.map(tag).join(' ')}</div>`,
        (f.notes && f.notes.trim()) && `<div class="muted" style="margin-top:.25rem;">${escapeHtml(f.notes.trim())}</div>`
      ].filter(Boolean).join('');

      const card = document.createElement('article');
      card.className = 'friend';
      card.innerHTML = `
        <div class="row" style="justify-content:space-between;align-items:flex-start;">
          <h4 style="margin:0;">${escapeHtml(f.name || 'Unnamed')}</h4>
          <span class="score">${f.score ?? '--'}</span>
        </div>
        ${rows || '<div class="muted">No details provided yet.</div>'}
        <div class="row" style="margin-top:.6rem;">
          <button class="btn btn-ghost" data-remove="${i}">Remove</button>
        </div>
      `;
      listEl.appendChild(card);
    });
  }

  // ---------- add ----------
  function addFriend(friend) {
    // normalize arrays & strings
    friend.name = friend.name || 'Unnamed';
    friend.hobbies = (friend.hobbies || []).filter(Boolean);
    friend.values  = (friend.values  || []).filter(Boolean);
    friend.ct = friend.ct || 'Any';
    friend.ll = friend.ll || 'Unknown';
    friend.notes = (friend.notes || '').trim();

    // score & push
    friend.score = scoreFriend(friend);
    friends.push(friend);
    saveFriends();
    renderFriends();
  }

  if (addForm && fName && fCt && fLl && fHobbies && fValues) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const friend = {
        name: fName.value.trim(),
        ct: fCt.value,
        ll: fLl.value,
        hobbies: csvToArr(fHobbies.value),
        values:  csvToArr(fValues.value),
        notes: fNotes ? (fNotes.value.trim()) : ''
      };
      // if name empty – ignore
      if (!friend.name) return;
      addFriend(friend);

      // clear inputs
      fName.value = ''; fCt.value = ''; fLl.value = '';
      fHobbies.value = ''; fValues.value = '';
      if (fNotes) fNotes.value = '';
    });
  }

  // "Clear All" (form) – jei yra
  const btnClear = $('#clearAll') || $('#btnClear');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      [fName,fCt,fLl,fHobbies,fValues,fNotes].forEach(el => el && (el.value = ''));
      fCt && (fCt.value = ''); fLl && (fLl.value = '');
    });
  }

  // ---------- remove (event delegation) ----------
  if (listEl) {
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-remove]');
      if (!btn) return;
      const idx = +btn.getAttribute('data-remove');
      if (Number.isInteger(idx) && idx >= 0) {
        friends.splice(idx, 1);
        saveFriends();
        renderFriends();
      }
    });
  }

  // ---------- export / import JSON ----------
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(friends, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'soulink-friends.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('Invalid JSON');
        // normalize each entry a bit
        friends = data.map(x => ({
          name: x.name || 'Unnamed',
          ct: x.ct || x.connection || 'Any',
          ll: x.ll || x.loveLanguage || 'Unknown',
          hobbies: Array.isArray(x.hobbies) ? x.hobbies : csvToArr(x.hobbies || ''),
          values: Array.isArray(x.values) ? x.values : csvToArr(x.values || ''),
          notes: (x.notes || '').trim()
        }));
        saveFriends();
        renderFriends();
      } catch (err) {
        alert('Import failed: ' + err.message);
      } finally {
        e.target.value = '';
      }
    });
  }

  // ---------- first paint ----------
  renderFriends();
});
