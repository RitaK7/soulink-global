
(() => {
  // ===== tiny helpers =====
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safe = () => { try { return JSON.parse(localStorage.getItem('soulQuiz')||'{}'); } catch { return {}; } };
  const d = () => safe();
  const reduceMotion = matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // canvases (fallback į data-attr)
  const el = {
    love: $('#loveChart') || $('#loveLangChart') || $('canvas[data-chart="love"]'),
    hobbies: $('#hobbyChart') || $('#hobbiesChart') || $('#donutChart') || $('canvas[data-chart="hobbies"]'),
    values: $('#valuesChart') || $('#compassChart') || $('canvas[data-chart="values"]')
  };

  // ===== Avatar orb (WOW) =====
  function injectOrb(){
    const wrap = $('.container') || document.body;
    if (!wrap || $('#chartOrb')) return;
    const src = d().profilePhoto1 || localStorage.getItem('profilePhoto1');
    const orb = document.createElement('div');
    orb.id = 'chartOrb';
    orb.setAttribute('aria-hidden','true');
    if (src) {
      orb.style.backgroundImage = `url("${src}")`;
    } else {
      // soft gradient orb fallback
      const svg = 'data:image/svg+xml;utf8,'+encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
          <defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#00fdd8" stop-opacity=".35"/><stop offset="100%" stop-color="#00fdd8" stop-opacity=".05"/>
          </radialGradient></defs>
          <circle cx="48" cy="48" r="46" fill="url(#g)"/>
        </svg>`);
      orb.style.backgroundImage = `url("${svg}")`;
    }
    const title = $('h1');
    if (title?.parentNode) title.parentNode.insertBefore(orb, title.nextSibling);
  }

  // ===== Intro text =====
  function setIntro(){
    const h1 = $('h1');
    if(!h1) return;
    let intro = h1.nextElementSibling instanceof HTMLParagraphElement ? h1.nextElementSibling : null;
    if(!intro){ intro = document.createElement('p'); h1.parentNode.insertBefore(intro, h1.nextSibling); }
    intro.className = 'muted';
    const has = !!localStorage.getItem('soulQuiz') && Object.keys(d()).length>0;
    intro.textContent = has
      ? 'Your Soul Chart reveals the harmony between your heart’s language, your values, and the ways you refuel your spirit. Explore the shapes—hover or tap to see what each facet means.'
      : 'Add your profile details to unlock your Soul Chart ✨';
  }

  // ===== Titles (magical wording) + subtitles =====
  function setTitle(canvas, title, subtitle){
    if(!canvas) return;
    const card = canvas.closest('.card') || canvas.parentElement;
    if(!card) return;
    const titleEl = card.querySelector('h2, h3');
    if(titleEl) titleEl.textContent = title;
    let sub = card.querySelector('.subtitle');
    if(!sub){ sub = document.createElement('p'); sub.className='subtitle muted'; card.appendChild(sub); }
    sub.textContent = subtitle;
  }

  // ===== Chart.js plugin: glow on hover (segments/points) =====
  const GlowPlugin = {
    id:'soulinkGlow',
    beforeDatasetsDraw(chart, args, opt){
      const ctx = chart.ctx;
      const active = chart.getActiveElements?.() || [];
      if(!active.length) return;
      ctx.save();
      ctx.shadowColor = opt?.color || 'rgba(0,253,216,.75)';
      ctx.shadowBlur = opt?.blur ?? 20;
      ctx.lineWidth = (opt?.lineWidth ?? 2);
      active.forEach(({datasetIndex, index})=>{
        const meta = chart.getDatasetMeta(datasetIndex);
        const el = meta?.data?.[index];
        if(!el) return;
        // redraw the active element with glow
        if (typeof el.draw === 'function') el.draw(ctx);
      });
      ctx.restore();
    }
  };
  if (window.Chart && !Chart.registry.plugins.get('soulinkGlow')) {
    Chart.register(GlowPlugin);
  }

  // ===== LOVE (radar) data
  const LOVE = [
    'Words of Affirmation','Acts of Service','Receiving Gifts','Quality Time','Physical Touch'
  ];
  function loveData(){
    const chosen = Array.isArray(d().loveLanguages) ? d().loveLanguages : (d().loveLanguage ? [d().loveLanguage] : []);
    const primary = chosen[0];
    const scores = LOVE.map(lbl=>{
      const i = chosen.findIndex(v=>v && v.toLowerCase()===lbl.toLowerCase());
      return i===-1 ? 0 : Math.max(1, 5 - i); // primary=5
    });
    return {scores, primary, chosen};
  }

  // ===== HOBBIES (doughnut)
  function hobbyData(){
    const arr = Array.isArray(d().hobbies) ? d().hobbies.filter(Boolean) : [];
    const labels = arr.slice(0,12);
    const values = labels.map(()=>1);
    return {labels, values};
  }

  // ===== VALUES (Heart/Mind/Spirit radar)
  const HEART=['compassion','kindness','empathy','love','generosity','patience','community','care','forgiveness'];
  const MIND =['honesty','integrity','wisdom','logic','curiosity','discipline','learning','responsibility','respect','balance'];
  const SPIRIT=['spirituality','freedom','growth','purpose','gratitude','mindfulness','adventure','faith','presence'];
  function valuesData(){
    const vals = (Array.isArray(d().values) ? d().values : []).map(v=> String(v).toLowerCase());
    const score = bag => vals.reduce((a,v)=> a + (bag.some(k=> v.includes(k)) ? 1 : 0), 0);
    let h=score(HEART), m=score(MIND), s=score(SPIRIT);
    const total=h+m+s;
    if(!total) return {labels:['Heart','Mind','Spirit'], values:[0,0,0]};
    const pct = x=> Math.round((x/total)*100);
    return {labels:['Heart','Mind','Spirit'], values:[pct(h),pct(m),pct(s)]};
  }

  // ===== Charts + animations
  let cLove=null,cHobby=null,cValues=null;

  function makeLove(){
    if(!el.love) return;
    const {scores, primary} = loveData();
    cLove?.destroy();
    cLove = new Chart(el.love, {
      type:'radar',
      data:{ labels:LOVE, datasets:[{ label:'Love Languages', data:scores, fill:true }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        animations: reduceMotion? false : { r: { duration:1200, easing:'easeOutCubic' } },
        scales:{ r:{ suggestedMin:0, suggestedMax:5, ticks:{display:false} } },
        plugins:{
          legend:{display:false},
          tooltip:{
            displayColors:false,
            callbacks:{ label:(ctx)=>{
              const star = (primary && ctx.label.toLowerCase()===primary.toLowerCase()) ? ' ★' : '';
              return `${ctx.label} — ${ctx.parsed.r||0}/5${star}`;
            }}
          },
          soulinkGlow:{ color:'rgba(0,253,216,.85)', blur:22, lineWidth:2 }
        },
        elements:{ point:{ radius:3, hoverRadius:5 } }
      }
    });
  }

  function makeHobbies(){
    if(!el.hobbies) return;
    const {labels, values} = hobbyData();
    cHobby?.destroy();
    cHobby = new Chart(el.hobbies, {
      type:'doughnut',
      data:{ labels, datasets:[{ data:values, hoverOffset:6 }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        animation: reduceMotion? false : { animateRotate:true, animateScale:true, duration:1100 },
        cutout:'55%',
        plugins:{
          legend:{display:false},
          tooltip:{
            displayColors:false,
            callbacks:{ label:(ctx)=>{
              const total = ctx.dataset.data.reduce((a,b)=>a+b,0)||1;
              const pct = Math.round((ctx.parsed/total)*100);
              return `${ctx.label||'—'} — ${pct}%`;
            }}
          },
          soulinkGlow:{ color:'rgba(0,253,216,.85)', blur:22, lineWidth:2 }
        }
      }
    });
  }

  function makeValues(){
    if(!el.values) return;
    const {labels, values} = valuesData();
    cValues?.destroy();
    cValues = new Chart(el.values, {
      type:'radar',
      data:{ labels, datasets:[{ label:'Inner Balance', data:values, fill:true }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        animations: reduceMotion? false : { r:{ duration:1200, easing:'easeOutCubic' } },
        scales:{ r:{ suggestedMin:0, suggestedMax:100, ticks:{display:false} } },
        plugins:{
          legend:{display:false},
          tooltip:{ displayColors:false, callbacks:{ label:(c)=> `${c.label} — ${c.parsed.r||0}%` } },
          soulinkGlow:{ color:'rgba(0,253,216,.85)', blur:22, lineWidth:2 }
        }
      }
    });
  }

  // ===== Insights (one sentence under each chart)
  function ensureInsight(canvas, id){
    if(!canvas) return null;
    let p = canvas.parentElement.querySelector(`#${id}`);
    if(!p){
      p = document.createElement('p');
      p.id = id;
      p.className = 'insight';
      canvas.parentElement.appendChild(p);
    }
    return p;
  }
  function writeInsights(){
    // Love
    const l = loveData();
    const pairs = LOVE.map((lbl,i)=>({lbl,score:l.scores[i]}))
      .filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    const loveP = ensureInsight(el.love,'loveInsight');
    loveP.textContent = pairs.length
      ? `Your love speaks through ${pairs[0].lbl}${pairs[1]?`, harmonized with ${pairs[1].lbl}`:''}${pairs[2]?` and ${pairs[2].lbl}`:''}.`
      : 'No love language data yet.';
    // Hobbies
    const h = hobbyData();
    const hobP = ensureInsight(el.hobbies,'hobbyInsight');
    if(h.labels.length>=2){
      hobP.textContent = 'Your soul balances between mindful rituals and joyful adventures.';
    } else if (h.labels.length===1){
      hobP.textContent = `A gentle focus on ${h.labels[0]} nourishes your days.`;
    } else {
      hobP.textContent = 'No hobbies yet — add a few joys that refuel your spirit.';
    }
    // Values
    const v = valuesData();
    const maxIdx = v.values.indexOf(Math.max(...v.values));
    const axis = v.labels[maxIdx] || 'Heart';
    const valP = ensureInsight(el.values,'valuesInsight');
    valP.textContent = v.values.some(x=>x>0)
      ? `Your strongest compass leans to the ${axis}, guiding your choices with intention.`
      : 'No values yet — choose a few to light your inner compass.';
  }

  // ===== Titles + subtitles (magical)
  function applyTitles(){
    setTitle(el.love,   '✨ The Voice of Your Heart',       'Primary love language is highlighted—how you most naturally give and receive love.');
    setTitle(el.hobbies,'🌿 Where Your Spirit Flows',       'Distribution of your favorite rituals and joys.');
    setTitle(el.values, '🌌 The Compass of Your Soul',      'A Heart–Mind–Spirit balance derived from chosen values.');
  }

  // ===== Toast + buttons =====
  function toast(msg){
    let t = $('#chartToast');
    if(!t){
      t=document.createElement('div');
      t.id='chartToast';
      t.style.cssText='position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:#014a52;border:1px solid rgba(0,253,216,.35);color:#eaf8f6;padding:10px 12px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:9999;opacity:0;transition:opacity .2s';
      document.body.appendChild(t);
    }
    t.textContent=msg; requestAnimationFrame(()=>t.style.opacity='1'); setTimeout(()=>t.style.opacity='0',1400);
  }
  function bindActions(){
    const refresh = $$('button, a').find(el=>/refresh/i.test(el.textContent));
    if(refresh) refresh.addEventListener('click',e=>{e.preventDefault(); buildAll(); toast('Chart updated ✨');});
    const edit = $$('button, a').find(el=>/edit\s*profile/i.test(el.textContent));
    if(edit) edit.addEventListener('click',e=>{e.preventDefault(); location.href='edit-profile.html';});
    // Export PNG
    const exportBtn = $$('button, a').find(el=>/export\s*png/i.test(el.textContent));
    if(exportBtn) exportBtn.addEventListener('click', e=>{
      e.preventDefault();
      const canvas = el.love || el.hobbies || el.values;
      if(!canvas) return;
      const a = document.createElement('a');
      const nm = (d().name||'you').toLowerCase().replace(/\s+/g,'-');
      a.href = canvas.toDataURL('image/png');
      a.download = `soul-chart-${nm}.png`;
      a.click();
    });
  }

  // Close tooltips on outside tap (mobile)
  function bindTooltipDismissOnOutside(){
    if(reduceMotion) return;
    document.addEventListener('pointerdown',(e)=>{
      const inside = (c)=> c && (c===e.target || c.contains(e.target));
      if(inside(el.love)||inside(el.hobbies)||inside(el.values)) return;
      [cLove,cHobby,cValues].forEach(ch=>{ try{ ch?.setActiveElements?.([]); ch?.update?.(); }catch{} });
      const live=document.createElement('span'); live.setAttribute('aria-live','polite');
      Object.assign(live.style,{position:'absolute',width:'1px',height:'1px',overflow:'hidden',clip:'rect(1px,1px,1px,1px)'}); live.textContent='Tooltip closed'; document.body.appendChild(live);
      setTimeout(()=>live.remove(),250);
    });
  }

  function buildAll(){
    injectOrb();
    setIntro();
    applyTitles();
    makeLove(); makeHobbies(); makeValues();
    writeInsights();
    bindTooltipDismissOnOutside();
    // add soft canvas glow box-shadow (JS fallback if CSS missed)
    [el.love,el.hobbies,el.values].forEach(c=>{ if(c) c.classList.add('chart-glow') });
  }

  document.addEventListener('DOMContentLoaded', ()=>{ buildAll(); bindActions(); });
})();

