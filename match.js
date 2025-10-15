/* Soulink · Match — Polish v3: score pill, message visibility, filter contacts from Values, live slider label, bullets off, mobile filters collapse */
(() => {
  const $  = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // ===== Helpers =====
  const READ = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const digits = s => String(s||'').replace(/\D/g,'');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const toList = v => Array.isArray(v) ? v
                    : typeof v === 'string' ? v.split(/[,;|/]\s*|\s{2,}|\n/).map(s=>s.trim()).filter(Boolean)
                    : [];

  // kontaktų detekcija (kad neišmestume į Values ir kad Message logika būtų tiksli)
  const isHandle   = v => /^@[\w.]{2,}$/i.test(v || '');
  const isEmail    = v => /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v || '');
  const isURL      = v => /^https?:\/\//i.test(v || '');
  const isPhone    = v => /^\+?\d[\d\s-]{6,}$/.test(v || '');
  const looksContact = v => isHandle(v) || isEmail(v) || isURL(v) || isPhone(v);

  // avatar (mažas – dydį riboja CSS .sl-avatar)
  function avatarHTML(name, photo){
    if (photo && /^https?:|^data:image/i.test(photo)) {
      return `<span class="sl-avatar"><img src="${esc(photo)}" alt=""></span>`;
    }
    const ch = String(name||'?').trim().charAt(0).toUpperCase() || '?';
    return `<span class="sl-avatar" aria-hidden="true">${esc(ch)}</span>`;
  }

  // ===== Data (suderinamai) =====
  function getMe(){
    const q = READ('soulink.soulQuiz') || READ('soulQuiz') || {};
    return {
      name: q.name || '',
      ct:   q.connectionType || q.connection || 'Both',
      ll:   Array.isArray(q.loveLanguages) ? (q.loveLanguages[0]||'') : (q.loveLanguage||''),
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
    const map = new Map();
    flat.forEach(f=>{
      const key = (f?.name||'').trim().toLowerCase();
      if (!map.has(key)) map.set(key, f);
    });
    return Array.from(map.values());
  }

  // ===== Scoring (logikos nekeičiam) =====
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

  // subline – be "•" simbolio
  function subline(f){
    const ct = f.ct || 'Unknown';
    const ll = f.ll || 'Unknown';
    return `${esc(ct)} — ${esc(ll)}`;
  }

  // Hobbies/Values – pašalinam kontaktus
  function chips(title, arr){
    let list = toList(arr).filter(Boolean).filter(v => !looksContact(v));
    if(!list.length) return '';
    return `<div class="sl-badges"><b style="margin-right:4px">${esc(title)}:</b> ${
      list.slice(0,12).map(v=>`<span class="pill">${esc(v)}</span>`).join(' ')
    }</div>`;
  }

  // Message – tik jei YRA bent vienas kontaktas
  function hasContact(f){
    return !!(f.whatsapp || f.instagram || f.facebook || f.email || f.contact);
  }
  function messageBtn(f){
    if (!hasContact(f)) return '';
    // pirmenybė specifiniams laukams
    if (f.whatsapp && digits(f.whatsapp)) return `<a class="btn" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">Message</a>`;
    if (f.instagram){
      const u=/^https?:\/\//i.test(f.instagram)?f.instagram:`https://instagram.com/${f.instagram.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.facebook){
      const u=/^https?:\/\//i.test(f.facebook)?f.facebook:`https://facebook.com/${f.facebook.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if (f.email && isEmail(f.email)) return `<a class="btn" href="mailto:${esc(f.email)}">Message</a>`;

    // contact – heuristika
    if (f.contact){
      const v=f.contact.trim();
      if (isURL(v))  return `<a class="btn" href="${esc(v)}" target="_blank" rel="noopener">Message</a>`;
      if (isEmail(v))return `<a class="btn" href="mailto:${esc(v)}">Message</a>`;
      if (isPhone(v))return `<a class="btn" href="tel:${digits(v)}">Message</a>`;
      if (isHandle(v))return `<a class="btn" href="https://instagram.com/${esc(v.replace(/^@/,''))}" target="_blank" rel="noopener">Message</a>`;
    }
    return '';
  }

  const listEl = $('#matchList');

  function render(){
    if(!listEl) return;
    const me = getMe();
    const friends = loadFriends();

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

    listEl.innerHTML='';
    rows.forEach(({f,s})=>{
      const card = document.createElement('article');
      card.className = 'sl-card card';

      const H = chips('Hobbies', f.hobbies);
      const V = chips('Values',  f.values);

      // score kapsulė
      const scoreCls = s>=75 ? 'good' : s>=55 ? 'ok' : 'low';
      const scorePill = `<span class="score ${scoreCls} score-badge">${s}%</span>`;

      card.innerHTML = `
        ${scorePill}
        <div class="sl-head">
          ${avatarHTML(f.name, f.photo)}
          <div style="min-width:0">
            <div class="sl-name">${esc(f.name || '—')}</div>
            <div class="sl-sub">${subline(f)}</div>
          </div>
        </div>
        ${H}${V}
        ${f.notes ? `<div style="margin:.2rem 0 .4rem"><i>${esc(f.notes)}</i></div>` : ''}
        <div class="sl-actions">
          <a class="btn" href="friends.html">Edit in Friends</a>
          ${messageBtn(f)}
        </div>
      `;
      listEl.appendChild(card);
    });

    // live labels
    const minEl = $('#minLabel'); if(minEl){ const v = parseInt($('#f-min')?.value||'0',10)||0; minEl.textContent = `${v}%`; }
    const llwEl = $('#llw-label'); if(llwEl){ const v = parseFloat($('#f-llw')?.value||'1')||1; llwEl.textContent = `${v.toFixed(1)}×`; }
  }

  // events
  ['#f-search','#f-ct','#f-min','#f-llw'].forEach(sel=>{
    document.querySelector(sel)?.addEventListener('input',render);
    document.querySelector(sel)?.addEventListener('change',render);
  });
  $('#filtersReset')?.addEventListener('click', ()=>{
    [['f-search',''],['f-ct','Any'],['f-min','0'],['f-llw','1.0']].forEach(([id,val])=>{
      const el=document.getElementById(id); if(el) el.value=val;
    });
    render();
  });

  // mobile filters collapse
  (function mobileFilters(){
    const t = $('#filtersToggle'), p = $('#filtersPanel');
    if(!t || !p) return;
    t.addEventListener('click', ()=>{
      const open = p.classList.toggle('open');
      t.setAttribute('aria-expanded', String(open));
    });
  })();

  // segment toggle (Friendship/Romantic) – papildomas filtravimas vaizde
  (function segments(){
    const F = document.querySelector('.seg-btn[data-seg="friend"]');
    const R = document.querySelector('.seg-btn[data-seg="romantic"]');
    let state = { friend:false, romantic:false };
    const paint = () => {
      F && F.classList.toggle('is-active', state.friend);
      R && R.classList.toggle('is-active', state.romantic);
      $$('#matchList .sl-card').forEach(card=>{
        const t = card.querySelector('.sl-sub')?.textContent?.toLowerCase() || '';
        const isFriend   = /friend/.test(t) || /both/.test(t);
        const isRomantic = /romantic/.test(t) || /both/.test(t);
        const show = state.friend===state.romantic ? true
                    : state.friend ? isFriend
                    : state.romantic ? isRomantic
                    : true;
        card.style.display = show ? '' : 'none';
      });
    };
    F && F.addEventListener('click', ()=>{ state.friend=!state.friend; paint(); });
    R && R.addEventListener('click', ()=>{ state.romantic=!state.romantic; paint(); });
    paint();
  })();

  document.addEventListener('DOMContentLoaded', render);
})();
