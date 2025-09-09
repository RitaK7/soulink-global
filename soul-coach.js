// soul-coach.js — magical polish v9
(() => {
  const KEY = 'soulQuiz';
  const COACH = 'soulCoach';

  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // ---------- storage ----------
  const getProfile = () => { try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch{ return {}; } };
  const getCoach = () => { try{ return JSON.parse(localStorage.getItem(COACH)||'{}'); }catch{ return {}; } };
  const setCoach = v => localStorage.setItem(COACH, JSON.stringify(v));
  const todayISO = ()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

  // ---------- helpers ----------
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const sumDigits = s => String(s).replace(/\D/g,'').split('').reduce((a,b)=>a+ +b,0);
  const reduceNum = n => { while(![11,22,33].includes(n) && n>9) n = sumDigits(String(n)); return n; };
  const lifePathFrom = iso => (DATE_RE.test(iso||'') ? String(reduceNum(sumDigits(iso))) : '–');
  const westZodiacFrom = iso => {
    if(!DATE_RE.test(iso||''))return '–';
    const [,m,d]=iso.split('-').map(Number);
    const R=(fm,fd,tm,td)=>(m>fm||m===fm&&d>=fd)&&(m<tm||m===tm&&d<=td);
    if(R(3,21,4,19))return'Aries'; if(R(4,20,5,20))return'Taurus'; if(R(5,21,6,20))return'Gemini'; if(R(6,21,7,22))return'Cancer';
    if(R(7,23,8,22))return'Leo'; if(R(8,23,9,22))return'Virgo'; if(R(9,23,10,22))return'Libra'; if(R(10,23,11,21))return'Scorpio';
    if(R(11,22,12,21))return'Sagittarius'; if(m===12&&d>=22||m===1&&d<=19)return'Capricorn'; if(R(1,20,2,18))return'Aquarius'; return'Pisces';
  };

  // ---------- nav ----------
  function wireNav(){
    const nav=$('.navbar');
    const onScroll=()=> nav?.classList[scrollY>6?'add':'remove']('scrolled');
    onScroll(); addEventListener('scroll', onScroll, {passive:true});
    $('#openDrawer')?.addEventListener('click', ()=>{$('#drawer').classList.add('open'); document.body.classList.add('no-scroll');});
    $('#closeDrawer')?.addEventListener('click', ()=>{$('#drawer').classList.remove('open'); document.body.classList.remove('no-scroll');});
    $('#drawerBackdrop')?.addEventListener('click', ()=>{$('#drawer').classList.remove('open'); document.body.classList.remove('no-scroll');});
    $('#logoutLink')?.addEventListener('click', e=>{e.preventDefault(); localStorage.clear(); location.href='index.html';});
    $('#logoutLinkMobile')?.addEventListener('click', e=>{e.preventDefault(); localStorage.clear(); location.href='index.html';});
    addEventListener('keydown', e=>{ if(e.key==='Escape') $('#closeDrawer')?.click(); });
  }

  // ---------- tooltips ----------
  function wireTooltips(){
    const root = document.body; let balloon=null, anchor=null;
    function show(a){
      const tip=a.getAttribute('data-tip'); if(!tip)return;
      if(!balloon){ balloon=document.createElement('div'); balloon.className='tooltip'; root.appendChild(balloon); }
      balloon.textContent=tip; anchor=a;
      const r=a.getBoundingClientRect();
      balloon.style.left=(r.left+scrollX+10)+'px';
      balloon.style.top=(r.top+scrollY+24)+'px';
      balloon.classList.add('show'); a.setAttribute('aria-describedby','tooltip');
    }
    function hide(){ balloon?.classList.remove('show'); anchor?.removeAttribute('aria-describedby'); anchor=null; }
    $$('[data-tip]').forEach(a=>{
      a.addEventListener('mouseenter', ()=>show(a));
      a.addEventListener('focus', ()=>show(a));
      a.addEventListener('mouseleave', hide);
      a.addEventListener('blur', hide);
      a.addEventListener('click', e=>{ e.preventDefault(); show(a); setTimeout(hide, 1200); });
    });
  }

  // ---------- particles ----------
  function makeStars(canvas){
    if(!canvas || reduceMotion) return;
    const DPR = devicePixelRatio||1, ctx=canvas.getContext('2d');
    function resize(){ canvas.width=canvas.clientWidth*DPR; canvas.height=canvas.clientHeight*DPR; }
    resize(); addEventListener('resize', resize);
    const N = canvas.classList.contains('bg-stars') ? (innerWidth<560? 20: 40) : (canvas.clientWidth<560? 16: 30);
    const stars = Array.from({length:N},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:(Math.random()*1.2+0.6)*DPR,a:Math.random()*1}));
    (function tick(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const s of stars){
        s.a += 0.02 + Math.random()*0.015;
        const f=(Math.sin(s.a)+1)/2;
        ctx.beginPath(); ctx.fillStyle=`rgba(0,253,216,${0.08+0.28*f})`;
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
      }
      if(!reduceMotion) requestAnimationFrame(tick);
    })();
  }

  // ---------- typewriter ----------
  function typeInto(el, text, dur=[800,1200], underlineEl=null){
    if(!el) return;
    if(reduceMotion){ el.textContent=text; if(underlineEl){ underlineEl.classList.add('show'); underlineEl.textContent=text; } return; }
    const ms = Math.floor(dur[0] + Math.random()*(dur[1]-dur[0]));
    const steps = Math.max(16, Math.ceil(text.length/2));
    const chunk = Math.ceil(text.length/steps);
    let i=0;
    if(underlineEl){ underlineEl.classList.remove('show'); underlineEl.textContent=''; }
    el.textContent='';
    const id=setInterval(()=>{
      i+=chunk; const out=text.slice(0, Math.min(i,text.length));
      el.textContent = out;
      if(underlineEl) underlineEl.textContent = out;
      if(i>=text.length){ clearInterval(id); underlineEl && underlineEl.classList.add('show'); }
    }, Math.max(12, Math.floor(ms/steps)));
  }

  // ---------- copy lib ----------
  const LL_ACTION = {
    "Acts of Service": "Offer a tiny act of help to someone today.",
    "Quality Time": "Give someone your undivided 10 minutes—no phone, just presence.",
    "Receiving Gifts": "Leave a small note or token of appreciation.",
    "Physical Touch": "Give a warm hug (with consent) or a gentle hand on the shoulder.",
    "Words of Affirmation": "Send one sincere message of appreciation."
  };
  const HOBBY_HOOKS = [
    {k:/meditat/i, add:" Then gift yourself 10 calm breaths."},
    {k:/travel/i,  add:" Plan a micro-adventure for this week."},
    {k:/read/i,    add:" End the day with 5 pages of reading."}
  ];
  const INSIGHT_POOL = [
    "Your compassion is your quiet power. Today, let it soften how you speak to yourself.",
    "You refuel through simple rituals. Keep them small, keep them daily—consistency becomes glow.",
    "When you act from honesty, the right people feel safe near you. That’s your magnet.",
    "Your courage whispers, not shouts. Follow the whisper; it knows the way.",
    "Balance Heart and Spirit, and the mind relaxes into clarity.",
    "Your presence is medicine—offer it gently to yourself first.",
    "Tiny, loving actions compound into a radiant life."
  ];
  const ICONS = ["🌱","💫","🌍","🕊️","✨","🌞","🌙"];

  function buildAction(p){
    const ll = Array.isArray(p.loveLanguages)? p.loveLanguages[0] : (p.loveLanguage||'');
    let base = LL_ACTION[ll] || "Take a mindful pause and breathe slowly.";
    const h = (Array.isArray(p.hobbies)? p.hobbies : []).join(' ').toLowerCase();
    for(const hook of HOBBY_HOOKS){ if(hook.k.test(h)){ base = base.replace(/\.*$/,'') + hook.add; break; } }
    const v = (Array.isArray(p.values)? p.values : []).map(s=>s.toLowerCase());
    if(v.includes('compassion')) base += " Let compassion guide your tone.";
    if(v.includes('honesty'))    base += " Speak gently—and honestly.";
    return base;
  }
  function buildInsights(p){
    const name = p.name || 'You';
    const vals = Array.isArray(p.values)? p.values.slice(0,3) : [];
    const lls = Array.isArray(p.loveLanguages)? p.loveLanguages : (p.loveLanguage?[p.loveLanguage]:[]);
    const hobs = Array.isArray(p.hobbies)? p.hobbies.slice(0,3) : [];
    const one = lls[0] ? `${name} feels most loved through ${lls[0].toLowerCase()}.` : `${name} is learning the language of care.`;
    const two = vals.length ? `Your compass leans on ${vals.join(', ').toLowerCase()}.` : '';
    const three = hobs.length ? `Daily joys like ${hobs.join(', ').toLowerCase()} keep your light steady.` : '';
    const pick = INSIGHT_POOL[Math.floor(Math.random()*INSIGHT_POOL.length)];
    return [one, two, three].filter(Boolean).join(' ') + ' ' + pick;
  }

  // ---------- Essentials ----------
  function fillEssentials(p){
    const set=(id,val)=>{ const el=$(id.startsWith('#')?id:'#'+id); if(el) el.textContent = val ?? '–'; };
    set('c-name', p.name||'–');
    set('c-ct', p.connectionType||'–');
    set('c-ll', Array.isArray(p.loveLanguages)? p.loveLanguages[0] : (p.loveLanguage||'–'));
    set('c-bd', p.birthday||'–');
    set('c-west', p.zodiac||p.westernZodiac||westZodiacFrom(p.birthday));
    set('c-life', p.lifePath||lifePathFrom(p.birthday));
  }

  // ---------- Streak + ring + intensity ----------
  const CIRC = 2*Math.PI*20;
  function ensureCoach(){
    const c=getCoach();
    if(!c.streak) c.streak={count:0,lastDoneDate:null};
    setCoach(c); return c;
  }
  function streakTier(count){
    if(count>=21) return 3;
    if(count>=7)  return 2;
    if(count>=1)  return 1;
    return 0;
  }
  function updateStreakUI(){
    const {streak}=ensureCoach();
    $('#streakCount').textContent = streak.count||0;
    // progress over 7
    const frac = Math.max(0, Math.min(1, (streak.count % 7)/7));
    const prog = $('.ring .prog');
    prog.style.strokeDasharray = CIRC;
    prog.style.strokeDashoffset = CIRC * (1 - frac);
    // intensity tiers
    const badge = $('#streakBadge');
    badge.dataset.tier = String(streakTier(streak.count||0));
    // button state
    $('#btnDoneToday').disabled = (streak.lastDoneDate === todayISO());
    $('#btnDoneToday').textContent = $('#btnDoneToday').disabled ? 'Already logged today' : 'Mark done today';
  }
  function markDone(){
    const today=todayISO(); const state=ensureCoach(); const s=state.streak;
    if(s.lastDoneDate===today) return;
    const y=new Date(); y.setDate(y.getDate()-1);
    const yISO=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
    if(s.lastDoneDate && s.lastDoneDate!==today && s.lastDoneDate!==yISO) s.count=0;
    s.count=(s.count||0)+1; s.lastDoneDate=today;
    setCoach({...state, streak:s});
    const badge=$('#streakBadge'); // flame burst
    badge.classList.remove('burst'); void badge.offsetWidth; badge.classList.add('burst');
    updateStreakUI(); toast('Logged today 🔥');
  }

  // ---------- Tasks with icons ----------
  function taskIcon(text=''){
    const t=text.toLowerCase();
    if(/meditat|breath|still/i.test(t)) return '🧘';
    if(/gratitude|thank/i.test(t))     return '💌';
    if(/walk|run|gym|workout/i.test(t))return '🏃';
    if(/read|book/i.test(t))           return '📚';
    if(/journal|reflect|write/i.test(t))return '🖊️';
    if(/service|help/i.test(t))        return '🤝';
    if(/connect|friend|message/i.test(t))return '💬';
    if(/nature|garden|hike|sun/i.test(t))return '🌿';
    return '✨';
  }
  function ensureTasks(profile){
    const state = getCoach();
    if(!Array.isArray(state.tasks) || !state.tasks.length){
      const seed = [];
      const ll = Array.isArray(profile.loveLanguages)? profile.loveLanguages[0] : (profile.loveLanguage||'');
      if(ll) seed.push(`Practice your love language: ${ll}`);
      if(profile.connectionType) seed.push(`Nurture a ${String(profile.connectionType).toLowerCase()} connection`);
      seed.push("Reflect for 5 minutes: what felt good today?");
      const vals=(profile.values||[]).slice(0,3); vals.forEach(v=> seed.push(`Small act aligned with ${v}`));
      const out = seed.slice(0,6).map((t,i)=>({id:String(Date.now()+i), text:t, done:false, createdAt:Date.now()}));
      setCoach({...state, tasks: out});
    }
  }
  function saveTasks(arr){ const s=getCoach(); setCoach({...s, tasks:[...arr]}); }
function renderTasks(){
  const box = $('#tasks'); box.innerHTML = '';
  const state = getCoach();
  const list = state.tasks || [];
  const hideDone = !!state.hideDone;

  list.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'task-row';
    row.innerHTML = `
      <label style="display:flex;align-items:center;gap:10px;flex:1 1 auto;">
        <input type="checkbox" ${t.done?'checked':''}
               data-id="${t.id}"
               aria-label="Mark ‘${String(t.text).replace(/"/g,'&quot;')}’ done">
        <span class="task-ico">${taskIcon(t.text)}</span>
        <span class="task-text" style="flex:1">${t.text}</span>
      </label>
      <button class="btn" data-del="${t.id}">Remove</button>`;
    box.appendChild(row);

    // pradinė būsena
    row.classList.toggle('is-done', !!t.done);
    if (hideDone && t.done) row.style.display = 'none';

    // checkbox – tik pažymim, NIEKO nenaikinam
    const cb = row.querySelector('input[type="checkbox"]');
    cb.addEventListener('change', ()=>{
      const arr = getCoach().tasks || [];
      const it = arr.find(x => x.id === t.id);
      if (it){ it.done = cb.checked; saveTasks(arr); }
      row.classList.toggle('is-done', cb.checked);
      if (getCoach().hideDone) row.style.display = cb.checked ? 'none' : '';
    });

    // Remove su Undo
    row.querySelector('[data-del]').addEventListener('click', ()=>{
      const arr = getCoach().tasks || [];
      const i = arr.findIndex(x => x.id === t.id);
      if (i > -1){
        const removed = arr.splice(i,1)[0];
        saveTasks(arr);
        row.remove();
        showToast(`Removed: “${removed.text}”`, {
          actionLabel: 'Undo',
          onAction: () => {
            const arr2 = getCoach().tasks || [];
            arr2.splice(i,0,removed);
            saveTasks(arr2);
            renderTasks();
          }
        });
      }
    });
  });

  applyHideToggleUI();
}

   function applyHideToggleUI(){
   const st = getCoach(); const on = !!st.hideDone;
   const tgl = $('#toggleDone');
   if (tgl) tgl.checked = on;

   if (on) { $('#tasks')?.querySelectorAll('.task-row.is-done').forEach(r=> r.style.display='none'); }
   else    { $('#tasks')?.querySelectorAll('.task-row').forEach(r=> r.style.display=''); }
 }
   $('#toggleDone')?.addEventListener('change', (e)=>{
  const s = getCoach();
  setCoach({ ...s, hideDone: !!e.target.checked });
  renderTasks();
});
  
 function bindAddTask(){
  $('#add-task')?.addEventListener('submit', e=>{
    e.preventDefault();
    const v = ($('#task-input')?.value||'').trim();
    if(!v) return;
    const arr = getCoach().tasks || [];
    arr.push({ id:String(Date.now()), text:v, done:false, createdAt:Date.now() });
    saveTasks(arr);
    $('#task-input').value='';
    renderTasks();
  });

  // Enter -> Add
  $('#task-input')?.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ e.preventDefault(); $('#add-task')?.dispatchEvent(new Event('submit',{cancelable:true})); }
  });

  // Reset -> tik nuima varneles
  $('#resetTasks')?.addEventListener('click', (e)=>{
    e.preventDefault();
    const s = getCoach();
    const arr = (s.tasks || []).map(t => ({ ...t, done:false }));
    saveTasks(arr);
    renderTasks();
  });
}


  // ---------- Action + Insights ----------
  function renderActionAndInsight(p, forceNew=false){
    const act = buildAction(p);
    typeInto($('#coach-action'), act, [800,1200], $('#actionGlow'));

    // „Daily Insight“: 3 kulkos su ikonėlėmis
    const ul = $('#coach-insights'); ul.innerHTML='';
    const picks = [...INSIGHT_POOL].sort(()=>Math.random()-0.5).slice(0,3);
    picks.forEach((txt,i)=>{
      const li=document.createElement('li'); li.innerHTML=`<span>${ICONS[i%ICONS.length]}</span> ${txt}`;
      ul.appendChild(li); setTimeout(()=> li.classList.add('show'), 60+ i*90);
    });

    // pagrindinis (tiperiuojamas) įkvėpimo tekstas
    const st=getCoach(); const last=st.lastInsightAt? new Date(st.lastInsightAt):null; const now=new Date();
    const shouldNew=forceNew || !last || (now-last)>=24*3600*1000;
    const insight = shouldNew ? buildInsights(p) : ($('#insightText')?.textContent || buildInsights(p));
    typeInto($('#insightText'), insight, [1400,1800]);
    if(shouldNew) setCoach({...st, lastInsightAt:new Date().toISOString()});
  }

  // ---------- Export PNG (glowing „My Growth Path“) ----------
  function exportPNG(){
    const p=getProfile(); const s=getCoach();
    const action=($('#coach-action')?.textContent||'').trim() || '—';
    const tasks=(s.tasks||[]).filter(t=>!t.done).slice(0,3).map(t=> t.text);
    const name=p.name||'My';
    const W=1400,H=900, pad=52, DPR=Math.max(2,Math.floor(devicePixelRatio||2));
    const cvs=document.createElement('canvas'); cvs.width=W*DPR; cvs.height=H*DPR;
    const ctx=cvs.getContext('2d'); ctx.scale(DPR,DPR);

    // bg gradient + žvaigždutės
    const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#022e33'); g.addColorStop(1,'#053c42'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    for(let i=0;i<90;i++){ const x=Math.random()*W, y=Math.random()*H, r=Math.random()*1.3+0.4, a=0.12+Math.random()*0.25;
      ctx.beginPath(); ctx.fillStyle=`rgba(0,253,216,${a})`; ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); }

    // header
    ctx.fillStyle='#00fdd8'; ctx.font='800 40px system-ui'; ctx.fillText('Soulink · My Growth Path 🌟', pad, 70);
    ctx.strokeStyle='rgba(0,253,216,.6)'; ctx.lineWidth=2; ctx.shadowColor='rgba(0,253,216,.7)'; ctx.shadowBlur=12;
    line(pad,88,W-pad,88); ctx.shadowBlur=0;

    // Essentials
    ctx.fillStyle='#00fdd8'; ctx.font='700 20px system-ui'; ctx.fillText('Essentials', pad, 130);
    ctx.fillStyle='#eaf8f6'; ctx.font='16px system-ui';
    const wes=p.zodiac||p.westernZodiac||westZodiacFrom(p.birthday);
    const lp=p.lifePath||lifePathFrom(p.birthday);
    const ll=Array.isArray(p.loveLanguages)?p.loveLanguages[0]:(p.loveLanguage||'-');
    const rows=[`Name: ${p.name||'-'}`, `Connection: ${p.connectionType||'-'}`, `Love Language: ${ll}`, `Birth Date: ${p.birthday||'-'}`, `Western Zodiac: ${wes||'-'}`, `Life Path: ${lp||'-'}`];
    let y=156; rows.forEach(t=>{ ctx.fillText(t,pad,y); y+=24; });

    // divider
    ctx.strokeStyle='rgba(0,253,216,.35)'; ctx.shadowColor='rgba(0,253,216,.55)'; ctx.shadowBlur=10; line(pad,y+6,W-pad,y+6); ctx.shadowBlur=0;

    // Action box
    const boxX=pad, boxY=y+24, boxW=W-pad*2, boxH=150;
    ctx.strokeStyle='rgba(0,253,216,.55)'; ctx.fillStyle='rgba(0,253,216,.09)'; roundRect(ctx, boxX, boxY, boxW, boxH, 16, true, true);
    ctx.fillStyle='#00fdd8'; ctx.font='700 20px system-ui'; ctx.fillText("Today's Action", boxX+16, boxY+32);
    ctx.fillStyle='#eaf8f6'; ctx.font='18px system-ui'; wrap(ctx, action, boxX+16, boxY+60, boxW-32, 26);

    // Tasks
    let tx=pad, ty= boxY+boxH+36;
    ctx.fillStyle='#00fdd8'; ctx.font='700 20px system-ui'; ctx.fillText('Top Tasks', tx, ty); ty+=10;
    ctx.fillStyle='#eaf8f6'; ctx.font='18px system-ui';
    tasks.forEach((t,i)=>{ ty+=28; checkbox(ctx, tx, ty-16); wrap(ctx, `${taskIcon(t)} ${t}`, tx+32, ty, 620, 26); });

    // divider
    ctx.strokeStyle='rgba(0,253,216,.35)'; ctx.shadowColor='rgba(0,253,216,.55)'; ctx.shadowBlur=10; line(pad,ty+12,W-pad,ty+12); ctx.shadowBlur=0;

    // Insight footer
    const insight = ($('#insightText')?.textContent||'').trim() || "Your week's energy: Balance between Heart and Spirit.";
    ctx.fillStyle='#bde5df'; ctx.font='18px system-ui'; wrap(ctx, insight, pad, H-80, W-pad*2, 26);

    // save
    const a=document.createElement('a'); a.href=cvs.toDataURL('image/png',1.0);
    a.download=`coach-plan-${String(name).replace(/\s+/g,'-').toLowerCase()}.png`; a.click();

    function line(x1,y1,x2,y2){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
    function roundRect(ctx,x,y,w,h,r,fill,stroke){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); if(fill) ctx.fill(); if(stroke) ctx.stroke(); }
    function wrap(ctx,text,x,y,maxW,lh){ const words=(text||'').split(' '); let line='', yy=y; for(let i=0;i<words.length;i++){ const test=line+words[i]+' '; if(ctx.measureText(test).width>maxW && i>0){ ctx.fillText(line,x,yy); line=words[i]+' '; yy+=lh; } else line=test; } ctx.fillText(line,x,yy); return yy+lh; }
    function checkbox(ctx,x,y){ ctx.strokeStyle='#00fdd8'; ctx.lineWidth=2; ctx.strokeRect(x,y,18,18); }
  }

  // ---------- toast ----------
  function toast(msg){
    let n=$('#toast'); if(!n){ n=document.createElement('div'); n.id='toast';
      n.style.cssText='position:fixed;bottom:18px;left:50%;transform:translateX(-50%);padding:10px 14px;border-radius:10px;background:#0a3;box-shadow:0 8px 30px rgba(0,0,0,.25);color:#fff;z-index:9999;opacity:0;transition:.2s'; document.body.appendChild(n); }
    n.textContent=msg; n.style.opacity='1'; setTimeout(()=> n.style.opacity='0', 1200);
    const ann=$('#ann'); if(ann) ann.textContent=msg;
  }
  function showToast(message, {actionLabel, onAction} = {}){
  let el = document.getElementById('toast-action');
  if(!el){
    el = document.createElement('div');
    el.id = 'toast-action';
    el.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);padding:10px 14px;border-radius:10px;background:#0a3;box-shadow:0 8px 30px rgba(0,0,0,.25);color:#fff;z-index:9999;display:flex;gap:10px;align-items:center;opacity:0;transition:.2s';
    const btn = document.createElement('button'); btn.className='btn'; btn.style.cssText='background:transparent;border:1px solid rgba(255,255,255,.6);color:#fff';
    btn.id='toast-action-btn'; el.appendChild(document.createElement('span'));
    el.appendChild(btn);
    document.body.appendChild(el);
  }
  el.firstElementChild.textContent = message;
  const btn = document.getElementById('toast-action-btn');
  if(actionLabel && typeof onAction === 'function'){
    btn.textContent = actionLabel; btn.style.display='inline-block';
    btn.onclick = () => { onAction(); el.style.opacity='0'; };
  } else {
    btn.style.display='none'; btn.onclick=null;
  }
  el.style.opacity='1'; setTimeout(()=> el.style.opacity='0', actionLabel ? 4000 : 1600);
  const ann = document.getElementById('ann'); if(ann) ann.textContent = message;
}


  // ---------- init ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    document.body.classList.add('coach-page'); // ← pridėta
    wireNav(); wireTooltips();
    wireNav(); wireTooltips();
    // stars
    makeStars($('#bgStars')); makeStars($('#actionCard .stars')); makeStars($('#insightsCard .stars'));

    const p=getProfile(); fillEssentials(p);

    // streak
    updateStreakUI();
    $('#btnDoneToday')?.addEventListener('click', markDone);

    // tasks
    ensureTasks(p); renderTasks(); bindAddTask();

    // action + insight
    renderActionAndInsight(p, true);
    $('#newAction')?.addEventListener('click', ()=>{ renderActionAndInsight(p, true); toast('New suggestion ✨'); });

    // export
    $('#exportCoach')?.addEventListener('click', e=>{ e.preventDefault(); exportPNG(); });
  });
})();

