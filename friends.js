// friends.js — Soulink (fixed)
(() => {
  const KEY_PROFILE  = 'soulQuiz';
  const KEY_FRIENDS  = 'soulinkFriends';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Profile (left panel)
  const me = (() => { try { return JSON.parse(localStorage.getItem(KEY_PROFILE) || '{}'); } catch { return {}; } })();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '–'; };
  set('me-name',    me.name);
  set('me-ct',      me.connectionType);
  set('me-ll',      me.loveLanguage);
  set('me-hobbies', (me.hobbies?.length ? me.hobbies.join(', ') : '–'));
  set('me-values',  (me.values?.length  ? me.values.join(', ')  : '–'));

  // Helpers
  const loadFriends = () => { try { return JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]'); } catch { return []; } };
  const saveFriends = (arr) => localStorage.setItem(KEY_FRIENDS, JSON.stringify(arr));
  const tokenizeCSV = s => (s||'').split(',').map(x=>x.trim()).filter(Boolean);

  // Scoring (very simple)
  function scoreFriend(f) {
    let score = 50;
    if (me.connectionType && f.ct && (me.connectionType === f.ct || f.ct === 'Both' || me.connectionType === 'Both')) score += 20;
    if (me.loveLanguage && f.ll && me.loveLanguage === f.ll) score += 20;

    const myH = new Set((me.hobbies || []).map(String));
    const hisH = new Set((f.hobbies || []).map(String));
    let hShared = 0; hisH.forEach(h => myH.has(h) && hShared++);
    score += Math.min(20, hShared * 5);

    const myV = new Set((me.values || []).map(String));
    const hisV = new Set((f.values || []).map(String));
    let vShared = 0; hisV.forEach(v => myV.has(v) && vShared++);
    score += Math.min(30, vShared * 3);

    return Math.max(0, Math.min(100, score));
  }

  // Render
  const container = $('#friends-list');
  const emptyNote = $('#empty-note');

  function escapeHtml(s=''){ return String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

function chips(arr){
  if (!arr || !arr.length) return '<span class="mini-label">–</span>';
  return `<div class="chips">${arr.map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join('')}</div>`;
}

function render(list){
  const box = document.getElementById('friends-list');
  const empty = document.getElementById('empty-note');
  box.innerHTML = '';

  if (!list.length){
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  list.map(f => ({...f, score: scoreFriend(f)}))
      .sort((a,b)=> b.score - a.score)
      .forEach((f,i)=>{
        const div = document.createElement('div');
        div.className = 'friend';
        div.innerHTML = `
          <div class="row">
            <strong>${escapeHtml(f.name || 'Friend')}</strong>
            <span class="score">${f.score}</span>
          </div>

          <div class="mini-label"><strong>Connection:</strong> ${escapeHtml(f.ct || '–')}</div>
          <div class="mini-label"><strong>Love Language:</strong> ${escapeHtml(f.ll || '–')}</div>

          <div class="mini-label"><strong>Hobbies:</strong></div>
          ${chips(f.hobbies)}

          <div class="mini-label"><strong>Values:</strong></div>
          ${chips(f.values)}

          <button class="btn" data-del="${i}">Remove</button>
        `;
        box.appendChild(div);
      });

  // remove handlers
  [...box.querySelectorAll('[data-del]')].forEach(btn=>{
    btn.addEventListener('click',()=>{
      const idx = +btn.getAttribute('data-del');
      const arr = loadFriends();
      arr.splice(idx,1);
      saveFriends(arr);
      render(arr);
    });
  });
}

  render(loadFriends());

  // Add friend
  $('#add-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = {
      name:    $('#f-name')?.value.trim(),
      ct:      $('#f-ct')?.value,
      ll:      $('#f-ll')?.value,
      hobbies: tokenizeCSV($('#f-hobbies')?.value),
      values:  tokenizeCSV($('#f-values')?.value),
    };
    if (!f.name) { alert('Please enter a name.'); return; }

    const arr = loadFriends();
    arr.push(f);
    saveFriends(arr);
    e.target.reset();
    render(arr);
  });

  // Clear all
  $('#clearAll')?.addEventListener('click', () => {
    if (confirm('Clear all friends?')) {
      saveFriends([]);
      render([]);
    }
  });

  // Export / Import (IDs: exportFriends / importFriends / importFile)
  const btnExport = document.getElementById('exportFriends');
  const btnImport = document.getElementById('importFriends');
  const fileInput = document.getElementById('importFile');

  btnExport?.addEventListener('click', () => {
    const data = JSON.stringify(loadFriends(), null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], {type:'application/json'}));
    a.download = 'soulink-friends.json';
    a.click();
  });

  btnImport?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('JSON must be an array');
      saveFriends(arr);
      render(arr);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  });
})();
