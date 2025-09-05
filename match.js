/* Soulink · Match page polish — keeps your data & rendering logic intact */
(() => {
  // tiny helpers
  const $ = s => document.querySelector(s);
  const READ = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const LS_ME = 'soulQuiz';
  const LS_FRIENDS = 'friends';
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const normList = v => Array.isArray(v) ? v.filter(Boolean)
                      : (typeof v === 'string' ? v.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean) : []);

  // icons
  const hobbyIco = t => {
    const s=(t||'').toLowerCase();
    if(s.includes('music'))return'🎵'; if(s.includes('read'))return'📚';
    if(s.includes('medit'))return'🧘'; if(s.includes('travel'))return'✈️';
    if(s.includes('cook'))return'🍳'; if(s.includes('art'))return'🎨';
    if(s.includes('dance'))return'💃'; if(s.includes('garden'))return'🌿';
    return '✨';
  };
  const valueIco = t => {
    const s=(t||'').toLowerCase();
    if(s.includes('honest'))return'💎'; if(s.includes('kind'))return'❤️';
    if(s.includes('loyal'))return'🛡️'; if(s.includes('freedom'))return'🌞';
    if(s.includes('growth')||s.includes('adventure'))return'🌱';
    return '⭐';
  };

  // jaccard
  function jaccard(a,b){
    const A=new Set(normList(a).map(x=>x.toLowerCase()));
    const B=new Set(normList(b).map(x=>x.toLowerCase()));
    if(!A.size && !B.size) return 0;
    let inter=0; A.forEach(x=>{ if(B.has(x)) inter++; });
    return inter/(A.size+B.size-inter);
  }

  // data
  function me(){
    const m = READ(LS_ME) || {};
    return {
      name: m.name || '',
      ct:   m.connectionType || m.ct || '',
      ll:   (Array.isArray(m.loveLanguages)? m.loveLanguages[0] : (m.loveLanguage||'')),
      hobbies: m.hobbies || [],
      values:  m.values || [],
    };
  }
  function friends(){
    const list = READ(LS_FRIENDS);
    return Array.isArray(list) ? list : [];
  }

  // scoring
  function llMatch(a,b){ if(!a||!b) return 0; return a.trim().toLowerCase()===b.trim().toLowerCase()?1:0; }
  function ctMatch(desired,candidate){
    if(!desired||desired==='Any') return 1;
    if(!candidate) return 0;
    if(candidate==='Both' || desired==='Both') return 1;
    return desired.toLowerCase()===candidate.toLowerCase()?1:0;
  }
  /* 25*LL*W + 15*CT + 30*Jaccard(hobbies) + 30*Jaccard(values) */
  function score(me,f,w=1){
    const sLL=25*llMatch(me.ll,f.ll)*w;
    const sCT=15*ctMatch(me.ct,f.ct);
    const sH =30*jaccard(me.hobbies,f.hobbies);
    const sV =30*jaccard(me.values,f.values);
    let total=sLL+sCT+sH+sV;

    // soften if candidate lacks info
    const info=(f.ll?1:0)+(normList(f.hobbies).length?1:0)+(normList(f.values).length?1:0);
    if(info<=1) total*=0.8;

    return Math.max(0,Math.min(100,Math.round(total)));
  }

  // ring badge (SVG)
  function ringSVG(pct=0){
    const CIRC=2*Math.PI*32;
    const off =CIRC*(1-Math.max(0,Math.min(1,pct/100)));
    return `
      <div class="score-ring" title="Compatibility">
        <svg viewBox="0 0 76 76" aria-hidden="true">
          <circle class="ring-track" cx="38" cy="38" r="32"></circle>
          <circle class="ring-prog"  cx="38" cy="38" r="32" stroke-dasharray="${CIRC}" stroke-dashoffset="${off}"></circle>
        </svg>
        <div class="score-num">${pct}<small>%</small></div>
      </div>`;
  }

  // small helpers for the body of cards
  const digits = s => String(s||'').replace(/\D/g,'');
  function avatarFor(name, photo){
    if(photo) return photo;
    const t = (name||'?').trim().charAt(0).toUpperCase() || '?';
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
         <rect width='100%' height='100%' rx='40' fill='#0a6a6f'/>
         <text x='50%' y='54%' text-anchor='middle' font-size='36' fill='#bff' font-family='sans-serif'>${t}</text>
       </svg>`);
    return 'data:image/svg+xml;utf8,'+svg;
  }

  function listChips(title, list, iconFn){
    const arr = normList(list);
    if(!arr.length) return '';
    const chips = arr.slice(0,12).map(v=>`<span class="chip"><span class="ico">${iconFn(v)}</span><span>${escapeHTML(v)}</span></span>`).join('');
    return `<div class="row" style="margin-top:.25rem"><b>${title}:</b> ${chips}</div>`;
  }

  function messageLinkHTML(f){
    if(f.whatsapp && digits(f.whatsapp)) return `<a class="btn" href="https://wa.me/${digits(f.whatsapp)}" target="_blank" rel="noopener">Message</a>`;
    if(f.instagram){
      const u=/^https?:\/\//i.test(f.instagram)?f.instagram:`https://instagram.com/${f.instagram.replace(/^@/,'')}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if(f.facebook){
      const u=/^https?:\/\//i.test(f.facebook)?f.facebook:`https://facebook.com/${f.facebook}`;
      return `<a class="btn" href="${u}" target="_blank" rel="noopener">Message</a>`;
    }
    if(f.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return `<a class="btn" href="mailto:${f.email}">Message</a>`;
    return `<a class="btn" href="friends.html">Message</a>`;
  }
  const compareLinkHTML = f => `<a class="btn" href="friends.html">Compare →</a>`;
  const socialIconsHTML = f => ''; // (kept empty per your last design)

  // main render (keeps your semantics/IDs)
  const resultsEl = $('#results') || $('.cards');
  const emptyEl   = $('#empty');

  function render(){
    const m = me();
    $('#me-ct')     && ($('#me-ct').textContent = m.ct || '–');
    $('#me-ll')     && ($('#me-ll').textContent = m.ll || '–');
    $('#me-hobbies')&& ($('#me-hobbies').textContent = normList(m.hobbies).join(', ') || '–');
    $('#me-values') && ($('#me-values').textContent  = normList(m.values).join(', ')  || '–');

    const list=friends();
    if(!list.length){ if(resultsEl) resultsEl.innerHTML=''; if(emptyEl) emptyEl.style.display='block'; return; }

    const q         = ($('#f-search')?.value||'').trim().toLowerCase();
    const desiredCT = $('#f-ct')?.value || '';
    const minScore  = parseInt($('#f-min')?.value||'0',10) || 0;
    const weightLL  = parseFloat($('#f-llw')?.value||'1') || 1;

    let rows = list.map(f=>({f,s:score(m,f,weightLL)}));

    if(q){
      rows = rows.filter(({f})=>{
        const hay=[
          f.name,f.ct,f.ll,f.contact,f.notes,f.whatsapp,f.instagram,f.facebook,f.email,
          ...(Array.isArray(f.hobbies)?f.hobbies:[String(f.hobbies||'')]),
          ...(Array.isArray(f.values)?f.values:[String(f.values||'')]),
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    rows = rows.filter(({f,s}) => ctMatch(desiredCT||'Any',f.ct) && s>=minScore);
    rows.sort((a,b)=> b.s - a.s || String(a.f.name||'').localeCompare(String(b.f.name||'')));

    if(!resultsEl) return;
    resultsEl.innerHTML='';
    if(!rows.length){ emptyEl && (emptyEl.style.display='block'); return; }
    emptyEl && (emptyEl.style.display='none');

    rows.forEach(({f,s})=>{
      const hobbies = normList(f.hobbies);
      const values  = normList(f.values);
      const cls = s>=75?'good':s>=55?'ok':'low';

      const card=document.createElement('div');
      card.className='match-card';
      card.innerHTML=`
        <div class="head">
          <div class="meta">
            <img class="avatar" src="${avatarFor(f.name,f.photo)}" alt="">
            <div style="min-width:0;">
              <div class="name">${escapeHTML(f.name||'—')}</div>
              <div class="hint">${escapeHTML(f.ct||'—')} · ${escapeHTML(f.ll||'—')}</div>
            </div>
          </div>
          ${ringSVG(s)}
        </div>

        ${socialIconsHTML(f)}

        ${listChips('Hobbies', hobbies, hobbyIco)}
        ${listChips('Values',  values,  valueIco)}

        ${f.contact ? `<div style="margin-top:.4rem"><b>Contact:</b> ${escapeHTML(f.contact)}</div>` : ''}
        ${f.notes    ? `<div style="margin-top:.2rem"><i>${escapeHTML(f.notes)}</i></div>` : ''}

        <div class="row" style="margin-top:.6rem">
          <a class="btn" href="friends.html">Edit in Friends</a>
          ${messageLinkHTML(f)}
          ${compareLinkHTML(f)}
        </div>
      `;
      card.querySelector('.score-num')?.classList.add(cls);
      resultsEl.appendChild(card);
    });

    // after rendering, nuke any stray dot rows (see below)
    hideStrayDots();
  }

  // ===== remove black corner dots (robust, scoped to match cards) =====
  function looksLikeDot(el){
    const txtEmpty=!el.textContent.trim();
    const cs=getComputedStyle(el);
    const r=el.getBoundingClientRect(), w=r.width, h=r.height;
    const small=w>6&&w<=20&&h>6&&h<=20;
    const roundish=(parseFloat(cs.borderRadius||'0')>=Math.min(w,h)*0.45)||(cs.borderRadius&&cs.borderRadius.endsWith('%'));
    return txtEmpty&&small&&roundish;
  }
  function hideStrayDots(){
    const root = resultsEl || document.body;
    if(!root) return;
    root.querySelectorAll('.match-card').forEach(card=>{
      card.querySelectorAll(':scope *').forEach(node=>{
        const kids=[...node.children];
        if(kids.length>=3 && kids.length<=8 && kids.every(looksLikeDot)){
          node.style.display='none';
        }
      });
    });
  }

  // wire filters (live labels if you use them)
  (function liveLabels(){
    const r=document.getElementById('f-min'), lab=document.getElementById('minLabel');
    if(r&&lab){ const upd=()=>lab.textContent=r.value+'%'; upd(); r.addEventListener('input',upd); }
    const w=document.getElementById('f-llw'), wlab=document.getElementById('llw-label');
    if(w&&wlab){ const upd=()=>wlab.textContent=(+w.value).toFixed(1)+'×'; upd(); w.addEventListener('input',upd); }
  })();

  // initial + react to DOM changes
  document.addEventListener('DOMContentLoaded', render);
  const moTarget = resultsEl || document.body;
  new MutationObserver(hideStrayDots).observe(moTarget,{childList:true,subtree:true});
})();
/* =========================================================
   Soulink · Match — non-breaking UI helpers
   (keeps your existing data/filter logic intact)
   ========================================================= */
(function(){
  const qs = (s, r=document)=>r.querySelector(s);
  const qsa = (s, r=document)=>Array.from(r.querySelectorAll(s));

  // 1) Remove stray dots (if any were injected by old markup)
  function nukeDots(scope=document){
    qsa('.corner-dot,.dot,.mini-dots,.dots,.chem-dots', scope).forEach(n=>n.style.display='none');
    qsa('ul,li', scope).forEach(n=> n.style.listStyle='none');
  }

  // 2) Teal active nav (in case header markup differs)
  (function setActiveNav(){
    qsa('.navbar .nav-links a, .topnav a').forEach(a=>{
      const href=(a.getAttribute('href')||'').toLowerCase();
      if(href.endsWith('match.html')) a.setAttribute('aria-current','page');
    });
  })();

  // 3) Score rings — convert any [data-score] badge into a glowing ring (idempotent)
  function injectRing(el){
    if(!el || el.__ringified) return;
    const raw = el.getAttribute('data-score') || el.textContent || '0';
    const val = Math.max(0, Math.min(100, parseInt(raw,10)||0));
    el.innerHTML = ''; el.classList.add('score-ring');
    const size = 64, r = 26, c = 2*Math.PI*r, off = c*(1 - val/100);
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 64 64');
    const track = document.createElementNS(svg.namespaceURI,'circle');
    track.setAttribute('class','ring-track'); track.setAttribute('cx','32'); track.setAttribute('cy','32'); track.setAttribute('r',String(r));
    const prog = document.createElementNS(svg.namespaceURI,'circle');
    prog.setAttribute('class','ring-prog'); prog.setAttribute('cx','32'); prog.setAttribute('cy','32'); prog.setAttribute('r',String(r));
    prog.style.transform='rotate(-90deg)'; prog.style.transformOrigin='32px 32px';
    prog.style.strokeDasharray = String(c); prog.style.strokeDashoffset = String(off);
    svg.appendChild(track); svg.appendChild(prog);
    const num = document.createElement('div');
    num.className = 'score-num ' + (val>=20 ? (val>=40 ? 'good':'ok') : 'low');
    num.textContent = val + '%';
    el.appendChild(svg); el.appendChild(num);
    el.__ringified = true;
  }
  function ringifyAll(scope=document){
    qsa('.match-card [data-score], .match-card .score', scope).forEach(injectRing);
  }

  // 4) Observe the results container so we enhance after your renderer updates
  const results = qs('#results');
  if(results){
    const obs = new MutationObserver(()=>{ nukeDots(results); ringifyAll(results); });
    obs.observe(results, {childList:true, subtree:true});
  }
  // Run once in case content is already there
  nukeDots(document); ringifyAll(document);

  // 5) Optional: filters drawer toggle if you use the unique IDs
  (function drawer(){
    const t=qs('#filtersToggle'), p=qs('#filtersPanel'), c=qs('#filtersCloseBtn')||qs('#closeFilters');
    if(!t || !p) return;
    const toggle=()=>{ const open=!p.classList.contains('open'); p.classList.toggle('open'); t.setAttribute('aria-expanded', String(open)); };
    t.addEventListener('click', toggle); c && c.addEventListener('click', toggle);
  })();

  // 6) Live labels (keep in sync even if your code sets values programmatically)
  (function liveLabels(){
    const min=qs('#f-min'), minL=qs('#minlabel');
    const w=qs('#f-llw'), wL=qs('#llw-label');
    const updMin = ()=>{ if(min&&minL) minL.textContent=(min.value||'0')+'%'; };
    const updW   = ()=>{ if(w&&wL)   wL.textContent=(Number(w.value||1)).toFixed(1)+'×'; };
    updMin(); updW();
    min && min.addEventListener('input', updMin);
    w   && w.addEventListener('input',   updW);
  })();
})();
