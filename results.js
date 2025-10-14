// results.js — Soulink Results (legacy-safe, nekeičia tavo vizualo)
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // helpers
  function readJSON(keys, fallback) {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const k of list) {
      try { const v = JSON.parse(localStorage.getItem(k)); if (v) return v; } catch {}
    }
    return fallback;
  }
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const digits = s => String(s||'').replace(/[^\d+]+/g, '');
  const uniq = arr => [...new Set(arr)];
  function normList(src) {
    if (!src) return [];
    if (Array.isArray(src)) return uniq(src.map(x => String(x).toLowerCase().trim()).filter(Boolean));
    return uniq(String(src).toLowerCase().split(/[,|/;]+|\s{2,}/).map(t=>t.trim()).filter(Boolean));
  }

  // Love language normalize
  const LL_MAP = {
    'acts of service':'acts_of_service','acts':'acts_of_service','service':'acts_of_service',
    'receiving gifts':'receiving_gifts','gifts':'receiving_gifts','gift':'receiving_gifts',
    'quality time':'quality_time','time':'quality_time',
    'physical touch':'physical_touch','touch':'physical_touch',
    'words of affirmation':'words_of_affirmation','words':'words_of_affirmation','affirmation':'words_of_affirmation',
    'unknown':'unknown','':'unknown'
  };
  const prettyLL = id => ({
    acts_of_service:'Acts of Service',
    receiving_gifts:'Receiving Gifts',
    quality_time:'Quality Time',
    physical_touch:'Physical Touch',
    words_of_affirmation:'Words of Affirmation',
    unknown:'Unknown'
  }[id] || 'Unknown');

  function normLL(v){
    if (Array.isArray(v) && v.length) v = v[0];
    v = String(v||'').toLowerCase().trim();
    return LL_MAP[v] || LL_MAP[(v.replace(/[-_]+/g,' '))] || 'unknown';
  }

  // avatar
  function avatarFor(name, photo){
    const url = String(photo||'');
    if (/^(data:|https?:)/i.test(url)) return url;
    const ch = (String(name||' ').trim()[0] || '?').toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="12" fill="#06494f"/>
      <text x="50%" y="56%" text-anchor="middle" font-size="28" fill="#00fdd8" font-family="system-ui,Segoe UI,Arial,sans-serif">${escapeHTML(ch)}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // raw data
  const QUIZ_RAW = readJSON(['soulink.soulQuiz','soulQuiz'], {}) || {};
  const FRIENDS_RAW = readJSON(['soulink.friends.list','soulink.friends','soulFriends'], []) || [];

  // build me
  function buildMe(q) {
    const ll = normLL(q.loveLanguage || q.loveLanguages || q.primaryLoveLanguage);
    const hobbies = normList(q.hobbies);
    const values  = normList(q.values);
    const me = {
      name: String(q.name || q.fullname || '').trim() || '—',
      ct:   String(q.connection || q.connectionType || q.connect || '').toLowerCase() || 'both',
      ll, hobbies, values,
      photo: q.photo || q.avatar || ''
    };
    $('#me-name')    && ($('#me-name').textContent = me.name || '—');
    $('#me-ct')      && ($('#me-ct').textContent   = me.ct || '—');
    $('#me-ll')      && ($('#me-ll').textContent   = prettyLL(me.ll) || '—');
    $('#me-hobbies') && ($('#me-hobbies').textContent = (me.hobbies.join(', ') || '—'));
    $('#me-values')  && ($('#me-values').textContent  = (me.values.join(', ') || '—'));
    return me;
  }
  const ME = buildMe(QUIZ_RAW);

  // normalize friends
  function normaliseFriend(f) {
    const ctRaw = (f.connection || f.ct || '').toString().toLowerCase();
    let ct = 'both';
    if (/rom/.test(ctRaw)) ct = 'romantic';
    else if (/friend/.test(ctRaw)) ct = 'friendship';
    else if (/both|any|either/.test(ctRaw)) ct = 'both';

    const ll = normLL(f.loveLanguage || f.love_language || f.ll || f.love_language_primary);
    const h = normList(f.hobbies);
    const v = normList(f.values);

    return {
      id: String(f.id || f.key || f.email || f.instagram || f.name || Math.random().toString(36).slice(2)).toLowerCase(),
      name: String(f.name || '—').trim(),
      ct, ll, hobbies: h, values: v,
      photo: f.photo || f.avatar || '',
      whatsapp: f.whatsapp || f.wa || '',
      instagram: f.instagram || f.ig || '',
      facebook: f.facebook || f.fb || '',
      email: f.email || '',
      contact: f.contact || f.url || f.website || '',
      notes: f.notes || ''
    };
  }
  const FRIENDS = Array.isArray(FRIENDS_RAW) ? FRIENDS_RAW.map(normaliseFriend) : [];

  // scoring
  function jaccard(a, b){
    const A = new Set(a||[]), B = new Set(b||[]);
    if (!A.size && !B.size) return 0;
    let inter = 0; for (const x of A) if (B.has(x)) inter++;
    const uni = new Set([...A, ...B]).size || 1;
    return inter/uni;
  }
  function score(me, fr, weight){
    const hs = Math.round(jaccard(me.hobbies, fr.hobbies) * 100);
    const vs = Math.round(jaccard(me.values,  fr.values)  * 100);
    const ls = (me.ll && fr.ll && me.ll === fr.ll) ? 100 : 0;
    const final = Math.round((hs + vs + weight*ls) / (2 + weight));
    return { final, hs, vs, ls };
  }

  // compute
  function compute(weight){
    const enriched = FRIENDS.map(fr => ({...fr, ...score(ME, fr, weight)}));
    const romantic   = enriched.filter(f => f.ct === 'romantic'  || f.ct === 'both')
                               .sort((a,b)=> b.final - a.final || a.name.localeCompare(b.name));
    const friendship = enriched.filter(f => f.ct === 'friendship'|| f.ct === 'both')
                               .sort((a,b)=> b.final - a.final || a.name.localeCompare(b.name));

    const all = enriched;
    const avg = all.length ? Math.round(all.reduce((s,x)=>s+x.final,0)/all.length) : 0;
    const top3 = all.slice(0).sort((a,b)=> b.final - a.final || a.name.localeCompare(b.name)).slice(0,3).map(x=>x.name);

    // shared tokens with ME
    const countCommon = (arr, mine) => arr.filter(x=>mine.includes(x)).length;
    const hobCounts = new Map(); const valCounts = new Map();
    for (const f of all){ for (const h of f.hobbies) hobCounts.set(h,(hobCounts.get(h)||0)+ (ME.hobbies.includes(h)?1:0));
                          for (const v of f.values)  valCounts.set(v,(valCounts.get(v)||0)+ (ME.values.includes(v)?1:0)); }
    const topH = [...hobCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,c])=>k);
    const topV = [...valCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,c])=>k);

    return { romantic, friendship, avg, top3, topH, topV };
  }

  // render
  function pill(t){ return `<span class="pill">${escapeHTML(t)}</span>`; }
  function personRow(f){
    return `
    <div class="match-card" data-connection="${f.ct}">
      <div class="head">
        <div class="meta">
          <img class="avatar" src="${avatarFor(f.name, f.photo)}" alt="">
          <div style="min-width:0;">
            <div class="name">${escapeHTML(f.name)}</div>
            <div class="hint">${escapeHTML(f.ct)} · ${escapeHTML(prettyLL(f.ll))}</div>
          </div>
        </div>
        <span class="score ${f.final>=75?'good':f.final>=55?'ok':'low'}">${f.final}%</span>
      </div>
      ${f.hobbies.length ? `<div class="row" style="margin-top:.25rem"><b>Hobbies:</b> ${f.hobbies.slice(0,12).map(h=>pill(h)).join(' ')}</div>` : ''}
      ${f.values.length  ? `<div class="row" style="margin-top:.25rem"><b>Values:</b>  ${f.values.slice(0,12).map(v=>pill(v)).join(' ')}</div>` : ''}
      ${f.contact ? `<div style="margin-top:.4rem"><b>Contact:</b> ${escapeHTML(f.contact)}</div>` : ''}
      ${f.notes   ? `<div style="margin-top:.2rem"><i>${escapeHTML(f.notes)}</i></div>` : ''}
      <div class="row" style="margin-top:.6rem">
        <a class="btn" href="friends.html">Edit in Friends</a>
        ${f.whatsapp && digits(f.whatsapp) ? `<a class="btn" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">Message</a>` :
        f.instagram ? `<a class="btn" href="${/^https?:\/\//i.test(f.instagram)?f.instagram:`https://instagram.com/${f.instagram.replace(/^@/,'')}`}" target="_blank" rel="noopener">Message</a>` :
        f.facebook  ? `<a class="btn" href="${/^https?:\/\//i.test(f.facebook)?f.facebook:`https://facebook.com/${f.facebook.replace(/^@/,'')}`}" target="_blank" rel="noopener">Message</a>` :
        f.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? `<a class="btn" href="mailto:${f.email}">Message</a>` :
        `<a class="btn" href="friends.html">Message</a>`}
        <a class="btn" href="friends.html">Compare →</a>
      </div>
    </div>`;
  }

  function render(weight=1.0){
    $('#llw-label') && ($('#llw-label').textContent = weight.toFixed(1)+'×');
    const { romantic, friendship, avg, top3, topH, topV } = compute(weight);

    // overview
    $('#topOverview') && ($('#topOverview').innerHTML =
      `<span><b>Average score:</b> ${avg}%</span>` +
      (top3.length ? ` · <span><b>Top matches:</b> ${top3.join(', ')}</span>` : '')
    );

    // shared
    $('#insights') && ($('#insights').innerHTML =
      (topH.length ? `<div><b>Shared Hobbies</b> ${topH.map(pill).join(' ')}</div>` : '') +
      (topV.length ? `<div><b>Shared Values</b> ${topV.map(pill).join(' ')}</div>` : '')
    );

    // lists
    const rom = $('#romantic'), fri = $('#friendship'), empty = $('#empty');
    if (rom) rom.innerHTML = romantic.map(personRow).join('');
    if (fri) fri.innerHTML = friendship.map(personRow).join('');
    const has = romantic.length + friendship.length > 0;
    if (empty) empty.style.display = has ? 'none' : 'block';
  }

  // Settings weight slider
  $('#llWeight')?.addEventListener('input', e => render(parseFloat(e.target.value||'1')||1));
  render( parseFloat($('#llWeight')?.value||'1') || 1 );

  // ===== Feedback =====
  const fbStars = $('#fbStars'); const fbEmail = $('#fbEmail'); const fbMsg = $('#fbMsg'); const fbSend = $('#fbSend');
  if (fbStars){
    // 5 žvaigždutės
    for (let i=1;i<=5;i++){
      const id=`fb-s-${i}`;
      const lbl=document.createElement('label'); lbl.setAttribute('for',id); lbl.textContent='★'; lbl.title=`Rate ${i}`;
      const input=document.createElement('input'); input.type='radio'; input.name='fb-stars'; input.id=id; input.value=String(i); input.hidden=true;
      input.addEventListener('change', ()=> {
        [...fbStars.querySelectorAll('label')].forEach((L,idx)=> L.classList.toggle('active', idx < i));
      });
      fbStars.append(input, lbl);
    }
  }
  fbSend?.addEventListener('click', () => {
    const n = (fbStars.querySelector('input[name="fb-stars"]:checked')?.value)||'0';
    const payload = {
      stars: +n||0, email: (fbEmail?.value||'').trim(), msg: (fbMsg?.value||'').trim(),
      at: new Date().toISOString()
    };
    try{
      const arr = readJSON('soulink.feedback', []) || [];
      arr.push(payload);
      localStorage.setItem('soulink.feedback', JSON.stringify(arr));
      alert('Ačiū! Your feedback was saved locally.');
      fbEmail && (fbEmail.value=''); fbMsg && (fbMsg.value='');
      fbStars?.querySelectorAll('input').forEach(i=>{ i.checked=false; });
      fbStars?.querySelectorAll('label').forEach(L=>L.classList.remove('active'));
    }catch{ alert('Could not store feedback.'); }
  });

  // Export / Print
  $('#btnExport')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ me:ME, friends:FRIENDS }, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download='soulink-results.json'; a.click(); URL.revokeObjectURL(url);
  });
  $('#btnPrint')?.addEventListener('click', () => { window.print(); });
})();
