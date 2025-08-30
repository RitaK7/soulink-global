(() => {
  /* ========== helpers ========== */
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const reduceMotion = matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const data = () => {
    try { return JSON.parse(localStorage.getItem('soulQuiz')||'{}'); }
    catch{ return {}; }
  };

  /* canvases */
  const el = {
    love   : $('#loveChart')    || $('#loveLangChart')    || $('canvas[data-chart="love"]'),
    hobbies: $('#hobbyChart')   || $('#hobbiesChart')     || $('#donutChart') || $('canvas[data-chart="hobbies"]'),
    values : $('#valuesChart')  || $('#compassChart')     || $('canvas[data-chart="values"]')
  };

  /* --------- Chart titles + subtitles (magical) --------- */
  function setTitle(canvas, title, subtitle){
    if(!canvas) return;
    const card = canvas.closest('.card') || canvas.parentElement;
    if(!card) return;
    card.classList.add('glow-card');                    // <- glow kortai
    let h = card.querySelector('h2, h3');
    if(h) h.textContent = title;
    let sub = card.querySelector('.subtitle');
    if(!sub){ sub = document.createElement('p'); sub.className='subtitle muted'; card.appendChild(sub); }
    sub.textContent = subtitle;
  }

  /* --------- Glow plugin (švyti aktyvus elementas) --------- */
  const GlowPlugin = {
    id:'soulinkGlow',
    afterDatasetDraw(chart, args){
      const {ctx} = chart;
      ctx.save();
      ctx.shadowColor = 'rgba(0,253,216,.45)';
      ctx.shadowBlur  = 18;
      // „piešimosi“ efektas su glow
      args.meta.dataset?.draw?.(ctx);
      ctx.restore();
    }
  };
  if (window.Chart && !Chart.registry.plugins.get('soulinkGlow')) {
    Chart.register(GlowPlugin);
  }

  /* --------- Love data (radar) --------- */
  const LOVE = ['Words of Affirmation','Acts of Service','Receiving Gifts','Quality Time','Physical Touch'];
  function loveData(){
    const d = data();
    const chosen = Array.isArray(d.loveLanguages) ? d.loveLanguages : (d.loveLanguage ? [d.loveLanguage] : []);
    const primary = chosen[0];
    const scores = LOVE.map(lbl=>{
      const i = chosen.findIndex(v=>v && v.toLowerCase()===lbl.toLowerCase());
      return i===-1 ? 0 : Math.max(1, 5 - i); // primary=5
    });
    return {scores, primary, chosen};
  }

  /* --------- Hobbies data (doughnut) --------- */
  function hobbyData(){
    const d = data();
    const arr = Array.isArray(d.hobbies) ? d.hobbies.filter(Boolean) : [];
    const labels = arr.slice(0,12);
    const values = labels.map(()=>1);
    return {labels, values};
  }

  /* --------- Values data (Heart/Mind/Spirit radar) --------- */
  const HEART=['compassion','kindness','empathy','love','generosity','patience','community','care','forgiveness'];
  const MIND =['honesty','integrity','wisdom','logic','curiosity','discipline','learning','responsibility','respect','balance'];
  const SPIRIT=['spirituality','freedom','growth','purpose','gratitude','mindfulness','adventure','faith','presence'];
  function valuesData(){
    const vals = (Array.isArray(data().values) ? data().values : []).map(v=> String(v).toLowerCase());
    const score = bag => vals.reduce((a,v)=> a + (bag.some(k=> v.includes(k)) ? 1 : 0), 0);
    let h=score(HEART), m=score(MIND), s=score(SPIRIT);
    const total=h+m+s;
    if(!total) return {labels:['Heart','Mind','Spirit'], values:[0,0,0]};
    const pct = x=> Math.round((x/total)*100);
    return {labels:['Heart','Mind','Spirit'], values:[pct(h),pct(m),pct(s)]};
  }

  /* --------- Charts builders --------- */
  let cLove=null, cHobby=null, cValues=null;

  const commonAnim = reduceMotion ? false : {
    duration: 1400,
    easing  : 'easeOutQuad'
  };

  function makeLove(){
    if(!el.love) return;
    const {scores, primary} = loveData();
    cLove?.destroy();
    cLove = new Chart(el.love, {
      type:'radar',
      data:{ labels:LOVE, datasets:[{ label:'Love Languages', data:scores, fill:true }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        animation: commonAnim,
        animations: { tension:{ from:0.4, to:0.0001, duration:1400 } },
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
          soulinkGlow:{}
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
        animation: commonAnim,
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
          soulinkGlow:{}
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
        animation: commonAnim,
        animations:{ tension:{ from:0.4, to:0.0001, duration:1400 } },
        scales:{ r:{ suggestedMin:0, suggestedMax:100, ticks:{display:false} } },
        plugins:{
          legend:{display:false},
          tooltip:{ displayColors:false, callbacks:{ label:(c)=> `${c.label} — ${c.parsed.r||0}%` } },
          soulinkGlow:{}
        }
      }
    });
  }

  /* --------- Poetic insights under charts --------- */
  function ensureInsight(canvas, id){
    if(!canvas) return null;
    let p = canvas.parentElement.querySelector(`#${id}`);
    if(!p){ p=document.createElement('p'); p.id=id; p.className='insight'; canvas.parentElement.appendChild(p); }
    return p;
  }
  function writeInsights(){
    // Love
    const L = loveData();
    const pairs = LOVE.map((lbl,i)=>({lbl,score:L.scores[i]}))
      .filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    const loveP = ensureInsight(el.love,'loveInsight');
    loveP.textContent = pairs.length
      ? `Your love leads with ${pairs[0].lbl}${pairs[1]?`, harmonized with ${pairs[1].lbl}`:''}${pairs[2]?` and ${pairs[2].lbl}`:''}.`
      : 'No data yet.';
    // Hobbies
    const H = hobbyData();
    const hobP = ensureInsight(el.hobbies,'hobbyInsight');
    if(H.labels.length>=2) hobP.textContent='Your soul balances between mindful rituals and joyful adventures.';
    else if(H.labels.length===1) hobP.textContent=`A gentle focus on ${H.labels[0]} nourishes your days.`;
    else hobP.textContent='No data yet.';
    // Values
    const V = valuesData();
    const maxIdx = V.values.indexOf(Math.max(...V.values));
    const axis = V.labels[maxIdx] || 'Heart';
    const valP = ensureInsight(el.values,'valuesInsight');
    valP.textContent = V.values.some(x=>x>0)
      ? `Your strongest compass leans to ${axis}.`
      : 'No data yet.';
  }

  /* --------- Stars background (lightweight) --------- */
  function makeStars(canvas){
    const ctx = canvas.getContext('2d');
    const DPR = devicePixelRatio || 1;
    function resize(){
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w*DPR));
      canvas.height= Math.max(1, Math.floor(h*DPR));
    }
    resize();
    addEventListener('resize', resize);

    const N = canvas.clientWidth < 560 ? 18 : 36;
    const stars = Array.from({length:N}, ()=>({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: (Math.random()*1.2+0.6)*DPR,
      a: Math.random()*Math.PI*2
    }));

    let running = true;
    function stop(){ running=false; }
    function start(){ if(running) return; running=true; tick(); }

    function tick(){
      if(!running) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const s of stars){
        s.a += 0.02 + Math.random()*0.015;
        const flick = (Math.sin(s.a)+1)/2;
        ctx.beginPath();
        ctx.fillStyle = `rgba(0,253,216,${0.15+0.35*flick})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
      }
      if(!reduceMotion) requestAnimationFrame(tick);
    }
    tick();
    return { stop, start, resize };
  }

  function ensureStars(card){
    let cvs = card.querySelector('canvas.stars');
    if(!cvs){
      cvs = document.createElement('canvas');
      cvs.className = 'stars';
      cvs.setAttribute('aria-hidden','true');
      card.prepend(cvs);
    }
    return cvs;
  }

  /* --------- Build on view (IntersectionObserver) --------- */
  function onEnterOnce(card, buildFn){
    if(!card) return;
    card.classList.add('chart-enter'); // CSS fade-in

    const observer = new IntersectionObserver(entries=>{
      const e = entries[0];
      if(e.isIntersecting && e.intersectionRatio>=0.3){
        buildFn();           // su animacijomis
        writeInsights();     // įžvalga po grafiku
        observer.disconnect();
      }
    }, {threshold:[0,0.3,1]});
    observer.observe(card);
  }

  /* --------- Titles + cards init + stars + actions --------- */
  function applyTitles(){
    setTitle(el.love,   '✨ The Voice of Your Heart',  'Primary love language is highlighted—how you most naturally give and receive love.');
    setTitle(el.hobbies,'🌿 Where Your Spirit Flows',  'Distribution of your favorite rituals and joys.');
    setTitle(el.values, '🌌 The Compass of Your Soul', 'A Heart–Mind–Spirit balance derived from chosen values.');
  }

  function decorateCards(){
    [el.love, el.hobbies, el.values].forEach(cv=>{
      if(!cv) return;
      const card = cv.closest('.card');
      card?.classList.add('glow-card');
      // žvaigždžių fonas
      const starCanvas = ensureStars(card);
      const stars = makeStars(starCanvas);
      if(reduceMotion){
        stars.stop();
      }else{
        // stop/start pagal matomumą
        const io = new IntersectionObserver(es=>{
          if(es[0].isIntersecting) stars.start(); else stars.stop();
        }, {threshold:[0,0.01]});
        io.observe(card);
      }
      // švelni box shadow grafiko canvas'ui
      cv.classList.add('chart-glow');
    });
  }

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

  function bindButtons(){
    const refresh = $$('button, a').find(el=>/refresh/i.test(el.textContent));
    if(refresh) refresh.addEventListener('click',e=>{
      e.preventDefault();
      // rebuild viską dabar (be IO), tada vėl paleidžiam IO kad pieštų įeinant
      makeLove(); makeHobbies(); makeValues(); writeInsights();
      toast('Chart updated ✨');
    });

    const edit = $$('button, a').find(el=>/edit\s*profile/i.test(el.textContent));
    if(edit) edit.addEventListener('click',e=>{e.preventDefault(); location.href='edit-profile.html';});

    const exportBtn = $$('button, a').find(el=>/export\s*png/i.test(el.textContent));
    if(exportBtn) exportBtn.addEventListener('click', e=>{
      e.preventDefault();
      const canvas = el.love || el.hobbies || el.values;
      if(!canvas) return;
      const a = document.createElement('a');
      const nm = (data().name||'you').toLowerCase().replace(/\s+/g,'-');
      a.href = canvas.toDataURL('image/png');
      a.download = `soul-chart-${nm}.png`;
      a.click();
    });
  }

  /* --------- Intro copy & avatar orb (jei jau turėjai – palik) --------- */
  function setIntro(){
    const h1 = $('h1');
    if(!h1) return;
    let intro = h1.nextElementSibling instanceof HTMLParagraphElement ? h1.nextElementSibling : null;
    if(!intro){ intro = document.createElement('p'); h1.parentNode.insertBefore(intro, h1.nextSibling); }
    intro.className = 'muted';
    const has = !!localStorage.getItem('soulQuiz') && Object.keys(data()).length>0;
    intro.textContent = has
      ? 'Your Soul Chart reveals the harmony between your heart’s language, your values, and the ways you refuel your spirit. Explore the shapes—hover or tap to see what each facet means.'
      : 'Add your profile details to unlock your Soul Chart ✨';
  }

  /* --------- Boot --------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    setIntro();
    applyTitles();
    decorateCards();
    bindButtons();

    // „piešimosi“ triggerei – korta pasirodo ekrane
    if(!reduceMotion){
      el.love   && onEnterOnce(el.love.closest('.card'),   makeLove);
      el.hobbies&& onEnterOnce(el.hobbies.closest('.card'),makeHobbies);
      el.values && onEnterOnce(el.values.closest('.card'), makeValues);
    } else {
      // be animacijų
      makeLove(); makeHobbies(); makeValues(); writeInsights();
    }
  });
})();
