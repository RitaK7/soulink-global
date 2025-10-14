/* Soulink · Match — kortelės su normaliu turiniu ir mažu avataru */
(() => {
  const $  = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // ===== Helpers =====
  const READ = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const digits = s => String(s||'').replace(/\D/g,'');
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const toList = v => Array.isArray(v) ? v
                    : typeof v === 'string' ? v.split(/[,;|/]\s*|\s{2,}|\n/).map(s=>s.trim()).filter(Boolean)
                    : [];

  // avatar (nuotrauka arba inicialas, MAX 56px – dydį valdo CSS .sl-avatar)
  function avatarHTML(name, photo){
    if (photo && /^https?:|^data:image/i.test(photo)) {
      return `<span class="sl-avatar"><img src="${escapeHTML(photo)}" alt=""></span>`;
    }
    const ch = String(name||'?').trim().charAt(0).toUpperCase() || '?';
    return `<span class="sl-avatar" aria-hidden="true">${escapeHTML(ch)}</span>`;
  }

  // žiedinis score badge (56x56)
  function ringHTML(p){
    const C = 2*Math.PI*32, off = C*(1 - Math.max(0, Math.min(1, p/100)));
    return `<div class="sl-score score-ring" title="Compatibility">
      <svg viewBox="0 0 76 76" aria-hidden="true">
        <circle class="ring-track" cx="38" cy="38" r="32"></circle>
        <circle class="ring-prog" cx="38" cy="38" r="32" stroke-dasharray="${C}" stroke-dashoffset="${off}"></circle>
      </svg>
      <div class="score-num">${p}<small>%</small></div>
    </div>`;
  }

  // ===== Data (suderinamumas) =====
  function getMe(){
    const q = READ('soulink.soulQuiz') || READ('soulQuiz') || {};
    return {
      name: q.name || '',
      ct:   q.connectionType || q.connection || 'Both',
      ll:   Array.isArray(q.loveLanguages) ? (q.loveLanguages[0]||'')
           : (q.loveLanguage || ''),
      hobbies: toList(q.hobbies),
      values:  toList(q.values),
    };
  }
  function loadFriends(){
    const stacks = [
      READ('soulink.friends.list'),
      READ('soulink.friends'),
      READ('soulFriends')
    ].filter(Array.isArray);
    const flat = stacks.flat();
    // dedupe pagal vardą (case-insensitive)
    const map = new Map();
    flat.forEach(f=>{
      const key = (f?.name||'').trim().toLowerCase();
      if (!map.has(key)) map.set(key, f);
    });
    return Array.from(map.values());
  }

  // ===== Scoring (tavo logikos nekeičiu, tik „sutvarkyta“) =====
  const sameLL = (a,b) => (a && b && a.trim().toLowerCase() === b.trim().toLowerCase()) ? 1 : 0;
  function jaccard(a,b){
    const A=new Set(toList(a).map(x=>x.toLowerCase()));
    const B=new Set(toList(b).map(x=>x.toLowerCase()));
    if(!A.size && !B.size) return 0;
    let inter=0; A.forEach(x=>{ if(B.has(x)) inter++; });
    return inter/(A.size+B.size-inter);
  }
  function score(me,f,w=1){
    const sLL = 25 * sameLL(me.ll,f.ll) * w;
    const sCT = 15 * (
      (me.ct==='Any'||!me.ct)?1:
      (f.ct==='Both'||me.ct==='Both')?1:
      (String(me.ct).toLowerCase()===String(f.ct).toLowerCase()?1:0)
    );
    const sH  = 30 * jaccard(me.hobbies,f.hobbies);
    const sV  = 30 * jaccard(me.values,f.values);
    return Math.max(0,Math.min(100,Math.round(sLL+sCT+sH+sV)));
  }

  // ===== Render =====
  const listEl = $('#matchList');

  function subline(f){
    const ct = f.ct || 'Unknown';
    const ll = f.ll || 'Unknown';
    return `${escapeHTML(ct)} • ${escapeHTML(ll)}`;
  }
  function chips(title, arr){
    const list = toList(arr);
    if(!list.length) return '';
    return `<div class="sl-badges"><b style="margin-right:4px">${title}:</b> ${
      list.slice(0,12).map(v=>`<span class="pill">${escapeHTML(v)}</span>`).join(' ')
    }</div>`;
  }
  function messageBtn(f){
    if (f.whatsapp && digits(f.whatsapp)) return `<a class="btn" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">Message</a>`;
    if (f.instagram){
      const u=/^https?:\/\//i.test(f.instagram)?f.instagram:`https://instagram.com/${f.instagram.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.facebook){
      const u=/^https?:\/\//i.test(f.facebook)?f.facebook:`https://facebook.com/${f.facebook.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return `<a class="btn" href="mailto:${f.email}">Message</a>`;
    return `<a class="btn" href="friends.html">Message</a>`;
  }

  function render(){
    if(!listEl) return;
    const me = getMe();
    const friends = loadFriends();

    // fill snapshot „header’iui“, jei turi atskirą bloką
    $('#me-ct')      && ($('#me-ct').textContent = me.ct || '—');
    $('#me-ll')      && ($('#me-ll').textContent = me.ll || '—');
    $('#me-hobbies') && ($('#me-hobbies').textContent = toList(me.hobbies).join(', ') || '—');
    $('#me-values')  && ($('#me-values').textContent  = toList(me.values).join(', ')  || '—');

    // filters
    const q = ($('#f-search')?.value||'').trim().toLowerCase();
    const wantCT = $('#f-ct')?.value || 'Any';
    const min = parseInt($('#f-min')?.value||'0',10);
    const w   = parseFloat($('#f-llw')?.value||'1') || 1;

    let rows = friends.map(f => ({ f, s: score(me,f,w) }));

    if (q){
      rows = rows.filter(({f})=>{
        const hay = [
          f.name,f.ct,f.ll,f.contact,f.notes,f.whatsapp,f.instagram,f.facebook,f.email,
          ...toList(f.hobbies), ...toList(f.values)
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    rows = rows.filter(({f,s})=>{
      const okCT = (wantCT==='Any'||!wantCT) ? true
                 : (f.ct==='Both'||wantCT==='Both') ? true
                 : String(f.ct||'').toLowerCase()===String(wantCT).toLowerCase();
      return okCT && s>=min;
    });

    rows.sort((a,b)=> b.s - a.s || String(a.f.name||'').localeCompare(String(b.f.name||'')));

    // render
    listEl.innerHTML='';
    rows.forEach(({f,s})=>{
      const card = document.createElement('article');
      card.className = 'sl-card card';
      const avatar = avatarHTML(f.name, f.photo);
      const H = chips('Hobbies', f.hobbies);
      const V = chips('Values',  f.values);

      card.innerHTML = `
        <div class="sl-head">
          ${avatar}
          <div style="min-width:0">
            <div class="sl-name">${escapeHTML(f.name || '—')}</div>
            <div class="sl-sub">${subline(f)}</div>
          </div>
          ${ringHTML(s)}
        </div>
        ${H}${V}
        ${f.notes ? `<div style="margin:.2rem 0 .4rem"><i>${escapeHTML(f.notes)}</i></div>` : ''}
        <div class="sl-actions">
          <a class="btn" href="friends.html">Edit in Friends</a>
          ${messageBtn(f)}
        </div>
      `;
      listEl.appendChild(card);
    });

    // UI labels
    $('#minLabel') && ($('#minLabel').textContent = (parseInt($('#f-min')?.value||'0',10)||0)+'%');
    $('#llw-label')&& ($('#llw-label').textContent= (parseFloat($('#f-llw')?.value||'1')||1).toFixed(1)+'×');
  }

  // events
  ['#f-search','#f-ct','#f-min','#f-llw'].forEach(sel=>{
    document.querySelector(sel)?.addEventListener('input',render);
    document.querySelector(sel)?.addEventListener('change',render);
  });
  $('#filtersReset')?.addEventListener('click', ()=>{
    const pairs = [['f-search',''],['f-ct','Any'],['f-min','0'],['f-llw','1.0']];
    pairs.forEach(([id,val])=>{ const el=document.getElementById(id); if(el) el.value=val; });
    render();
  });

  // segment toggle (Friendship/Romantic) – pritaikom display pagal data
  (function segments(){
    const F = document.querySelector('.seg-btn[data-seg="friend"]');
    const R = document.querySelector('.seg-btn[data-seg="romantic"]');
    let state = { friend:false, romantic:false };
    const paint = () => {
      F && F.classList.toggle('is-active', state.friend);
      R && R.classList.toggle('is-active', state.romantic);
      // kortelės neturi explicit data – filtruojam pagal f.ct tekste subline
      // (čia tik papildomas vizualinis filtras po skaičiavimo)
      $$('#matchList .sl-card').forEach(card=>{
        const txt = card.querySelector('.sl-sub')?.textContent?.toLowerCase() || '';
        const isFriend   = /friend/.test(txt) || /both/.test(txt);
        const isRomantic = /romantic/.test(txt) || /both/.test(txt);
        const show = state.friend===state.romantic ? true
                    : state.friend ? isFriend
                    : state.romantic ? isRomantic
                    : true;
        card.style.display = show ? '' : 'none';
      });
    };
    F && F.addEventListener('click', ()=>{ state.friend   = !state.friend;   paint(); });
    R && R.addEventListener('click', ()=>{ state.romantic = !state.romantic; paint(); });
    paint();
  })();

  document.addEventListener('DOMContentLoaded', render);
})();
