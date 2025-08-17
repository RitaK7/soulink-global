// friends.js — Soulink (fixed + polished)

(() => {
  const KEY_PROFILE = 'soulQuiz';
  const KEY_FRIENDS = 'soulinkFriends';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // --- helpers ---
  const fmt = (v) => {
  const s = (v || '').trim();
  if (!s) return '—';
  const bad = ['any', 'unknown', '--', '-'];
  return bad.includes(s.toLowerCase()) ? '—' : s;
};

function tokenizeCSV(v) {
  return (v || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

const f = normFriend({
  name:   document.getElementById('f-name')?.value.trim(),
  ct:     document.getElementById('f-ct')?.value,
  ll:     document.getElementById('f-ll')?.value,
  hobbies: document.getElementById('f-hobbies')?.value,
  values:  document.getElementById('f-values')?.value,
  contact: (document.getElementById('f-contact')?.value || '').trim(),
  notes:   (document.getElementById('f-notes')?.value   || '').trim()
});

// (nebūtina) mažytė dublikatų apsauga pagal vardą
const all = loadFriends();
if (all.some(x => (x.name || '').toLowerCase() === (f.name || '').toLowerCase())) {
  const ok = confirm(`Friend "${f.name}" already exists. Add anyway?`);
  if (!ok) return;
}

  function escapeHTML(s=''){return s.replace(/[&<>"]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));}

const defaultMsg =
  `Hey! I added you on Soulink 💫 — want to compare our matches?`;
function contactLink(c) {
  if (!c) return null;
  const v = c.trim();

  // pilna nuoroda
  if (/^https?:\/\//i.test(v)) return v;

  // email
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(v)) {
    return `mailto:${v}?subject=${encodeURIComponent('Hi from Soulink')}`
         + `&body=${encodeURIComponent(defaultMsg)}`;
  }

  // tel. -> WhatsApp
  if (/^\+?\d[\d\s\-()]{6,}$/.test(v)) {
    const num = v.replace(/\D/g,'');
    return `https://wa.me/${num}?text=${encodeURIComponent(defaultMsg)}`;
  }

  // instagram handle
  if (/^@?[\w.]{2,}$/i.test(v)) {
    return `https://instagram.com/${v.replace(/^@/,'')}`;
  }

  // fallback – gal tai kitas identifikatorius
  return v;
}

  const loadProfile = () => {
    try { return JSON.parse(localStorage.getItem(KEY_PROFILE) || '{}'); }
    catch { return {}; }
  };
  const loadFriends = () => {
    try { return JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]'); }
    catch { return []; }
  };
  const saveFriends = (arr) => {
    localStorage.setItem(KEY_FRIENDS, JSON.stringify(arr));
  };

  const csv = (arr=[]) => (arr || []).filter(Boolean).join(', ');
  const tokenizeCSV = (s='') =>
    s.split(',').map(v => v.trim()).filter(Boolean);

  // --- Snapshot (left card) ---
  const me = loadProfile();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '–'; };

  set('me-name',    me.name || '–');
  set('me-ct',      me.connectionType || '–');
  set('me-ll',      me.loveLanguage || '–');
  set('me-hobbies', csv(me.hobbies));
  set('me-values',  csv(me.values));

  // --- Scoring ---
  function scoreWithMe(f) {
    let score = 0;

    // connection + love language
    if (me.connectionType && f.ct && me.connectionType === f.ct) score += 20;
    if (me.loveLanguage && f.ll && me.loveLanguage === f.ll)     score += 30;

    // hobbies overlap (max 20)
    const myH  = new Set((me.hobbies || []).map(String));
    const hisH = new Set((f.hobbies || []).map(String));
    let h = 0; hisH.forEach(x => { if (myH.has(x)) h++; });
    score += Math.min(20, h * 5);

    // values overlap (max 30)
    const myV  = new Set((me.values || []).map(String));
    const hisV = new Set((f.values || []).map(String));
    let v = 0; hisV.forEach(x => { if (myV.has(x)) v++; });
    score += Math.min(30, v * 3);

    return Math.max(0, Math.min(100, score));
  }

  // --- Render list ---
  const listEl   = $('#friends-list');
  const emptyEl  = $('#empty-note');

  function render(list) {
    if (!listEl) return;
    listEl.innerHTML = '';
    if (!list || !list.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    list.forEach((f, i) => {
      const card = document.createElement('div');
      card.className = 'friend';
      const score = scoreWithMe(f);

      const href = contactLink(f.contact);
      card.innerHTML = `
     <div class="friend-head">
     <strong>${escapeHTML(f.name || '—')}</strong>
     <span class="badge">${score}</span>
    </div>
     <div class="friend-body">
    <div><b>Connection:</b> ${escapeHTML(fmt(f.ct))}</div>
    <div><b>Love Language:</b> ${escapeHTML(fmt(f.ll))}</div>
    <div><b>Hobbies:</b> ${escapeHTML((f.hobbies || []).join(', ') || '—')}</div>
    <div><b>Values:</b> ${escapeHTML((f.values  || []).join(', ') || '—')}</div>

    ${f.contact ? (() => {
    const href = contactLink(f.contact);   // jei turi helper’į (nebūtina)
    return `<div><b>Contact:</b> ${escapeHTML(f.contact)}
           ${href ? ` <a class="btn btn-ghost btn-xs" href="${href}" target="_blank" rel="noopener">Message</a>` : ''}</div>`;
    })() : ''}

    </div>
     <div class="friend-actions">
     <button class="btn btn-ghost" data-remove="${i}">Remove</button>
    </div>
   `;
      listEl.appendChild(card);
    });

    // remove handlers
    $$('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.getAttribute('data-remove');
        const arr = loadFriends();
        arr.splice(idx, 1);
        saveFriends(arr);
        render(arr);
      });
    });
  }

  render(loadFriends());

  // --- Add friend form ---
  $('#add-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = {
      name:   $('#f-name')?.value.trim(),
      ct:     $('#f-ct')?.value,
      ll:     $('#f-ll')?.value,
      hobbies: tokenizeCSV($('#f-hobbies')?.value || ''),
      values:  tokenizeCSV($('#f-values')?.value  || ''),
      contact: ($('#f-contact')?.value || '').trim()
    };
    if (!f.name) { alert('Please enter a name.'); return; }

    const arr = loadFriends();   // <— visada imame naujausią
    if (loadFriends().some(x => (x.name||'').toLowerCase() === f.name.toLowerCase())) {
  if (!confirm(`Friend "${f.name}" already exists. Add anyway?`)) return;
 }

    arr.push(f);
    saveFriends(arr);
    e.target.reset();
    render(arr);
  });

  // --- Clear all ---
  $('#clearAll')?.addEventListener('click', () => {
    if (confirm('Clear all friends?')) {
      saveFriends([]);
      render();
    }
  });

  // --- Export JSON ---
  $('#exportFriends')?.addEventListener('click', () => {
    const data = loadFriends();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'soulink-friends.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // --- Import JSON ---
  $('#importFriends')?.addEventListener('click', () => {
    const picker = $('#importFile');
    if (!picker) return;
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const arr = JSON.parse(text);
        if (!Array.isArray(arr)) throw new Error('JSON is not an array');
        const imported = JSON.parse(text || '[]');
        const normalized = imported.map(normFriend);
        saveFriends(normalized);
        render();
     // <— tas pats KEY_FRIENDS
        render(arr);
      } catch (err) {
        alert('Import failed: ' + err.message);
      } finally {
        picker.value = '';
      }
    };
    picker.click();
  });

  // --- MIGRATION (jei buvo senas raktas 'friends') ---
  try {
    const legacy = localStorage.getItem('friends');
    if (legacy && !localStorage.getItem(KEY_FRIENDS)) {
      localStorage.setItem(KEY_FRIENDS, legacy);
      localStorage.removeItem('friends');
    }
  } catch {}
})();
