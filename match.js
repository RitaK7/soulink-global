// match.js — tik Match puslapiui. Jokio ryšio su kitų puslapių header skriptais.
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1) Aktyvus linkas pagal data-page (naudojam tą pačią .is-active klasę) */
  (function setActive(){
    const page = (document.body.getAttribute('data-page')||'').trim();
    if(!page) return;
    const a = document.querySelector(`[data-nav="${page}"]`);
    if(a) a.classList.add('is-active');
  })();

  /* 2) Mobile filters drawer (unikalūs ID, be konfliktų su header) */
  function initFiltersDrawer(){
    const btn = $('#filtersToggle');
    const panel = $('#filtersPanel');
    if(!panel) return;
    const closeBtns = $$('[data-close="filters"]', panel);
    const toggle = () => panel.classList.toggle('open');
    btn?.addEventListener('click', toggle);
    closeBtns.forEach(b => b.addEventListener('click', () => panel.classList.remove('open')));
    document.addEventListener('keydown', (e) => { if(e.key==='Escape') panel.classList.remove('open'); });
  }

  /* 3) Score ring (canvas) */
  function drawRing(el){
    const pct = Math.max(0, Math.min(100, Number(el.dataset.score)||0));
    // jei jau nupiešta, perpiešiam pagal dabartinį dydį
    el.querySelector('canvas')?.remove();

    const size = Math.min(el.clientWidth||52, el.clientHeight||52);
    const dpr  = window.devicePixelRatio || 1;
    const c = document.createElement('canvas');
    c.width = size * dpr; c.height = size * dpr; c.style.width=size+'px'; c.style.height=size+'px';
    const ctx = c.getContext('2d');
    const cx = (size*dpr)/2, cy=cx, r=cx-5*dpr;

    // track
    ctx.lineWidth = 6*dpr; ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();

    // progress
    const end = (Math.PI*2) * (pct/100);
    ctx.lineCap='round'; ctx.strokeStyle='#00fdd8';
    ctx.shadowColor='rgba(0,253,216,.65)'; ctx.shadowBlur=10*dpr;

    if(reduce){
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2+end); ctx.stroke();
    } else {
      const dur=850; const start=performance.now();
      function tick(t){
        const k=Math.min(1,(t-start)/dur), e=1-Math.pow(1-k,3);
        ctx.clearRect(0,0,c.width,c.height);
        // redraw track
        ctx.lineWidth=6*dpr; ctx.strokeStyle='rgba(255,255,255,.15)';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
        // arc
        ctx.lineWidth=6*dpr; ctx.strokeStyle='#00fdd8';
        ctx.shadowColor='rgba(0,253,216,.65)'; ctx.shadowBlur=10*dpr;
        ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + end*e); ctx.stroke();
        if(k<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    el.prepend(c);
    // atnaujinam skaičių viduje, jei yra
    el.querySelector('.num')?.textContent = `${Math.round(pct)}%`;
  }
  function initRings(){
    $$('.score[data-score]').forEach(drawRing);
    let t; window.addEventListener('resize', () => {
      clearTimeout(t); t=setTimeout(() => $$('.score[data-score]').forEach(drawRing), 120);
    }, {passive:true});
  }

  /* 4) Snapshot iš localStorage.soulQuiz (kompaktiškai) */
  function fillSnapshot(){
    let q={}; try{ q=JSON.parse(localStorage.getItem('soulQuiz')||'{}'); }catch{}
    $('#youName').textContent = q.name || 'You';
    const avatar = $('#youAvatar');
    if(q.name) avatar.textContent = (q.name.trim()[0]||'Y').toUpperCase();
    const badges = $('#youBadges'); badges.innerHTML='';
    const items=[];
    if(q.connectionType) items.push('🎭 '+q.connectionType);
    const ll = Array.isArray(q.loveLanguages)? q.loveLanguages[0] : (q.loveLanguage||'');
    if(ll) items.push('💌 '+ll);
    (q.hobbies||[]).slice(0,3).forEach(h=>items.push('🎵 '+h));
    (q.values||[]).slice(0,3).forEach(v=>items.push('💎 '+v));
    items.forEach(t=>{ const b=document.createElement('span'); b.className='badge'; b.textContent=t; badges.appendChild(b); });
  }

  /* 5) Paprastas filtravimas demonstracijai (jei turi savo – šitas netrukdo) */
  function applyFilters(){
    const q = ($('#q')?.value || '').toLowerCase();
    const min = Number($('#minScore')?.value || 0);
    const activeConn = document.querySelector('[data-filter-conn].is-on')?.getAttribute('data-filter-conn') || '';

    $$('#cards .match-card').forEach(card=>{
      const name = (card.getAttribute('data-name')||'').toLowerCase();
      const scoreEl= card.querySelector('.score'); const score = Number(scoreEl?.dataset.score||0);
      const conn  = (card.getAttribute('data-conn')||'').toLowerCase();

      let show = true;
      if(q && !name.includes(q)) show=false;
      if(score < min) show=false;
      if(activeConn && conn !== activeConn && conn !== 'both') show=false;

      card.style.display = show ? '' : 'none';
    });
  }
  function bindFilters(){
    // toggle conn chips
    $$('.filters-panel [data-filter-conn]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('.filters-panel [data-filter-conn]').forEach(x=>x.classList.remove('is-on'));
        btn.classList.add('is-on');
        applyFilters();
      });
    });
    // auto-apply
    $('#q')?.addEventListener('input', applyFilters);
    $('#minScore')?.addEventListener('input', applyFilters);
    $('#applyFilters')?.addEventListener('click', applyFilters);
  }

  /* 6) Logout (jei yra) */
  $('#logoutLink')?.addEventListener('click',(e)=>{ e.preventDefault(); localStorage.clear(); location.href='index.html'; });

  /* Init */
  document.addEventListener('DOMContentLoaded', () => {
    initFiltersDrawer();
    initRings();
    fillSnapshot();
    bindFilters();
    applyFilters();
  });
})();
