// friends.js — Soulink (clean, stable)
(() => {
  const KEY_PROFILE = 'soulQuiz';
  const KEY_FRIENDS = 'soulinkFriends';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- helpers ----------
  const escapeHTML = (s='') =>
    s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));

  const csv = (arr=[]) => (arr || []).filter(Boolean).join(', ');

  const tokenizeCSV = (s='') =>
    s.split(',').map(v => v.trim()).filter(Boolean);

  const fmt = (v) => {
    const s = (v || '').trim();
    if (!s) return '—';
    const bad = ['any','unknown','–','-'];
    return bad.includes(s.toLowerCase()) ? '—' : s;
  };

  const normFriend = (o = {}) => ({
    name:    (o.name || '').trim(),
    ct:      (o.ct   || '').trim(),           // connection type
    ll:      (o.ll   || '').trim(),           // love language
    hobbies: Array.isArray(o.hobbies) ? o.hobbies.map(String) : tokenizeCSV(o.hobbies || ''),
    values:  Array.isArray(o.values)  ? o.values.map(String)  : tokenizeCSV(o.values  || ''),
    contact: (o.contact || '').trim(),
    notes:   (o.notes   || '').trim()
  });

  const loadProfile = () => {
    try { return JSON.parse(localStorage.getItem(KEY_PROFILE) || '{}'); }
    catch { return {}; }
  };

  const loadFriends = () => {
    try { return JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]'); }
    catch { return []; }
  };

  const saveFriends = (list) => {
    localStorage.setItem(KEY_FRIENDS, JSON.stringify(list));
  };

  // migrate old key (if any)
  try {
    const legacy = localStorage.getItem('friends');
    if (legacy && !localStorage.getItem(KEY_FRIENDS)) {
      localStorage.setItem(KEY_FRIENDS, legacy);
      localStorage.removeItem('friends');
    }
  } catch {}

  // ---------- snapshot (left card) ----------
  const me = loadProfile();
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '–'; };

  setTxt('me-name',    me.name || '–');
  setTxt('me-ct',      me.connectionType || '–');
  setTxt('me-ll',      me.loveLanguage   || '–');
  setTxt('me-hobbies', csv(me.hobbies));
  setTxt('me-values',  csv(me.values));

  // ---------- scoring ----------
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

  // clickable contact
  function contactLink(c){
    if (!c) return null;
    const v = c.trim();
    if (/^https?:\/\//i.test(v)) return v;                                     // full link
    if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(v)) return `mailto:${v}`;        // email
    if (/^\+?\d[\d\s\-()]{6,}$/.test(v)) return `https://wa.me/${v.replace(/\D/g,'')}`; // phone -> WhatsApp
    if (/^@?[\w.]{2,}$/i.test(v)) return `https://instagram.com/${v.replace(/^@/,'')}`; // @handle
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
      const card  = document.createElement('div');
      card.className = 'friend';

      const score = scoreWithMe(f);
      const msg   = contactLink(f.contact);

      card.innerHTML = `
        <div class="friend-head">
          <strong>${escapeHTML(f.name || '—')}</strong>
          <span class="score">${score}</span>
        </div>
        <div class="friend-body">
          <div><b>Connection:</b> ${escapeHTML(fmt(f.ct))}</div>
          <div><b>Love Language:</b> ${escapeHTML(fmt(f.ll))}</div>
          <div><b>Hobbies:</b> ${escapeHTML((f.hobbies || []).join(', ') || '—')}</div>
          <div><b>Values:</b> ${escapeHTML((f.values  || []).join(', ') || '—')}</div>
          ${f.contact ? `<div><b>Contact:</b> ${escapeHTML(f.contact)}
            ${msg ? ` <a class="btn btn-ghost btn-xs" href="${msg}" target="_blank" rel="noopener">Message</a>` : ''}</div>` : ''}
        </div>
        <div class="friend-actions">
          <button class="btn btn-ghost" data-rm="${i}">Remove</button>
        </div>
      `;
      listEl.appendChild(card);
    });

    $$('[data-rm]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.getAttribute('data-rm');
        const arr = loadFriends();
        arr.splice(idx, 1);
        saveFriends(arr);
        render(arr);
      });
    });
  }

  render(); // first paint

  // ---------- add friend ----------
  $('#add-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = normFriend({
      name:   $('#f-name')?.value,
      ct:     $('#f-ct')?.value,
      ll:     $('#f-ll')?.value,
      hobbies: $('#f-hobbies')?.value,
      values:  $('#f-values')?.value,
      contact: $('#f-contact')?.value,
      notes:   $('#f-notes')?.value
    });
    if (!f.name){ alert('Please enter a name.'); return; }

    const arr = loadFriends();
    if (arr.some(x => (x.name||'').toLowerCase() === f.name.toLowerCase())){
      if (!confirm(`"${f.name}" already exists. Add anyway?`)) return;
    }
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
})();
