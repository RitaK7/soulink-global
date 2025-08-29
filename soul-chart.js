// soul-coach.js — spec-complete finisher
(() => {
  const KEY = 'soulQuiz';
  const COACH = 'soulCoach';

  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // ---------- data helpers ----------
  const getProfile = () => { try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch{ return {}; } };
  const setCoach = v => localStorage.setItem(COACH, JSON.stringify(v));
  const getCoach = () => { try{ return JSON.parse(localStorage.getItem(COACH)||'{}'); }catch{ return {}; } };
  const toISODateLocal = (d=new Date())=>{
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // local midnight
    return new Date(t.getTime()-t.getTimezoneOffset()*60000).toISOString().slice(0,10);
  };

  // ---------- numerology & zodiac (for Essentials if missing) ----------
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const sumDigits = s => String(s).replace(/\D/g,'').split('').reduce((a,b)=>a+ +b,0);
  const reduceNum = n => { while(![11,22,33].includes(n) && n>9) n = sumDigits(String(n)); return n; };
  const lifePathFrom = iso => (DATE_RE.test(iso||'') ? String(reduceNum(sumDigits(iso))) : '–');
  const westZodiacFrom = iso => {
    if(!DATE_RE.test(iso||'')) return '–';
    const [,m,d] = iso.split('-').map(Number);
    const R=(fm,fd,tm,td)=> (m>fm||m===fm&&d>=fd)&&(m<tm||m===tm&&d<=td);
    if(R(3,21,4,19))return 'Aries'; if(R(4,20,5,20))return 'Taurus'; if(R(5,21,6,20))return 'Gemini'; if(R(6,21,7,22))return 'Cancer';
    if(R(7,23,8,22))return 'Leo'; if(R(8,23,9,22))return 'Virgo'; if(R(9,23,10,22))return 'Libra'; if(R(10,23,11,21))return 'Scorpio';
    if(R(11,22,12,21))return 'Sagittarius'; if(m===12&&d>=22||m===1&&d<=19)return 'Capricorn'; if(R(1,20,2,18))return 'Aquarius'; return 'Pisces';
  };

  // ---------- UI wiring ----------
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
    const root = document.body;
    let balloon=null, anchor=null;
    function show(a){
      const tip = a.getAttribute('data-tip'); if(!tip) return;
      if(!balloon){ balloon=document.createElement('div'); balloon.className='tooltip'; root.appendChild(balloon); }
      balloon.textContent = tip; anchor=a;
      const r = a.getBoundingClientRect();
      balloon.style.left = (r.left + window.scrollX + 10) + 'px';
      balloon.style.top  = (r.top + window.scrollY + 24) + 'px';
      balloon.classList.add('show');
      a.setAttribute('aria-describedby','tooltip');
    }
    function hide(){ balloon?.classList.remove('show'); anchor?.removeAttribute('aria-describedby'); anchor=null; }
    $$('[data-tip]').forEach(a=>{
      a.addEventListener('mouseenter', ()=>show(a));
      a.addEventListener('focus', ()=>show(a));
      a.addEventListener('mouseleave', hide);
      a.addEventListener('blur', hide);
      a.addEventListener('click', e=>{ e.preventDefault(); show(a); setTimeout(hide, 1300); });
    });
  }

  // ---------- typewriter ----------
  function typeInto(el, text, dur=[800,1200]){
    if(!el) return;
    if(reduceMotion){ el.textContent=text; return; }
    const ms = Math.floor(dur[0] + Math.random()*(dur[1]-dur[0]));
    const steps = Math.max(16, Math.ceil(text.length/2));
    const chunk = Math.ceil(text.length/steps);
    let i=0; el.textContent='';
    const id=setInterval(()=>{ i+=chunk; el.textContent = text.slice(0, Math.min(i,text.length)); if(i>=text.length) clearInterval(id); }, Math.max(12, Math.floor(ms/steps)));
  }

  // ---------- particles (Today’s Action + Insights) ----------
  function makeStars(canvas){
    if(!canvas || reduceMotion) return;
    const DPR = devicePixelRatio||1, ctx = canvas.getContext('2d');
    function resize(){ canvas.width = canvas.clientWidth*DPR; canvas.height = canvas.clientHeight*DPR; }
    resize(); addEventListener('resize', resize);
    const N = canvas.clientWidth<560 ? 18 : 36;
    const stars = Array.from({length:N}, ()=>({ x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      r:(Math.random()*1.2+0.6)*DPR, a:Math.random()*1 }));
    (function tick(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const s of stars){
        s.a += 0.02 + Math.random()*0.015;
        const f = (Math.sin(s.a)+1)/2;
        ctx.beginPath(); ctx.fillStyle=`rgba(0,253,216,${0.12+0.32*f})`;
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
      }
      if(!reduceMotion) requestAnimationFrame(tick);
    })();
  }

  // ---------- micro-copy library ----------
  const LL_ACTION = {
    "Acts of Service": "Offer a tiny act of help to someone today.",
    "Quality Time": "Give someone your undivided 10 minutes—no phone, just presence.",
    "Receiving Gifts": "Leave a small note or token for someone you care about.",
    "Physical Touch": "Give a warm hug (or a gentle hand on the shoulder) with consent.",
    "Words of Affirmation": "Send one sincere message of appreciation."
  };
  const HOBBY_HOOKS = [
    {k:/meditat/i, add:"…then 10 mindful breaths."},
    {k:/travel/i, add:"…and plan a micro-adventure for this week."},
    {k:/read/i, add:"…and read 5 pages before bed."}
  ];
  const INSIGHT_POOL = [
    "Your compassion is your quiet power. Today, let it soften how you speak to yourself.",
    "You refuel through simple rituals. Keep them small, keep them daily—consistency becomes glow.",
    "When you act from honesty, the right people feel safe near you. That’s your magnet."
  ];

  // ---------- generators ----------
  function buildAction(p){
    const ll = Array.isArray(p.loveLanguages)? p.loveLanguages[0] : (p.loveLanguage||'');
    let base = LL_ACTION[ll] || "Complete your profile to unlock daily actions ✨";
    if(!ll && !p.values && !p.hobbies) return base;
    const h = (Array.isArray(p.hobbies)? p.hobbies : []).join(' ').toLowerCase();
    for(const hook of HOBBY_HOOKS){ if(hook.k.test(h)){ base = base.replace(/\.*$/, '') + " " + hook.add; break; } }
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

  // ---------- streak ----------
  function renderStreak(){
    const s=getCoach().streak||{count:0,lastDoneDate:null};
    $('#streak').textContent = `🔥 Streak: ${s.count||0} day${(s.count||0)==1?'':'s'}`;
  }
  function markDone(){
    const today = toISODateLocal();
    const st = getCoach().streak || {count:0,lastDoneDate:null};
    if(st.lastDoneDate === today){ toast('Already checked ✓'); return; }
    if(st.lastDoneDate){
      const prev = new Date(st.lastDoneDate); const now = new Date(today);
      const diff = Math.round((now - prev)/86400000); // local midnights
      if(diff === 1) st.count = (st.count||0)+1;
      else st.count = 1, toast('Start fresh 🌱');
    } else st.count = 1;
    st.lastDoneDate = today;
    const cur = getCoach(); setCoach({...cur, streak:st});
    const el = $('#streak'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); // bounce
    renderStreak();
  }

  // ---------- tasks ----------
  function ensureTasks(profile){
    const state = getCoach();
    if(!Array.isArray(state.tasks) || !state.tasks.length){
      const seed = [];
      const ll = Array.isArray(profile.loveLanguages)? profile.loveLanguages[0] : (profile.loveLanguage||'');
      if(ll) seed.push(`Practice your love language: ${ll}`);
      if(profile.connectionType) seed.push(`Nurture a ${String(profile.connectionType).toLowerCase()} connection`);
      seed.push("Reflect for 5 minutes: what felt good today?");
      // extra suggestions (aim 3–6)
      const vals = (profile.values||[]).slice(0,3);
      vals.forEach(v=> seed.push(`Small act aligned with ${v}`));
      const out = seed.slice(0,6).map((t,i)=>({id:String(Date.now()+i), text:t, done:false, createdAt:Date.now()}));
      setCoach({...state, tasks: out});
    }
  }
  function saveTasks(arr){ const s=getCoach(); setCoach({...s, tasks:[...arr]}); }
  function renderTasks(){
    const box = $('#tasks'); box.innerHTML='';
    const list = getCoach().tasks||[];
    list.forEach(t=>{
      const row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.05)';
      row.innerHTML=`<input type="checkbox" ${t.done?'checked':''} data-id="${t.id}" />
        <span style="flex:1">${t.text}</span>
        <button class="btn" data-del="${t.id}">Remove</button>`;
      box.appendChild(row);
    });
    // toggle
    box.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        const id=cb.getAttribute('data-id'); const arr=getCoach().tasks||[]; const it=arr.find(x=>x.id===id);
        if(it){ it.done=cb.checked; saveTasks(arr); if(cb.checked) starBurst(cb); }
      });
    });
    // delete
    box.querySelectorAll('[data-del]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id=b.getAttribute('data-del'); const arr=getCoach().tasks||[]; const i=arr.findIndex(x=>x.id===id);
        if(i>-1){ arr.splice(i,1); saveTasks(arr); renderTasks(); }
      });
    });
  }
  function starBurst(anchor){
    if(reduceMotion) return;
    const s=document.createElement('span');
    s.textContent='⭐'; s.style.cssText='position:absolute;transform:translate(-50%,-50%);pointer-events:none';
    const r=anchor.getBoundingClientRect(); s.style.left=(r.left+window.scrollX+6)+'px'; s.style.top=(r.top+window.scrollY-6)+'px';
    document.body.appendChild(s);
    s.animate([{opacity:1, transform:'translate(-50%,-50%) scale(1)'},{opacity:0, transform:'translate(-50%,-90%) scale(.7)'}],{duration:450,easing:'ease-out'}).onfinish=()=>s.remove();
  }
  function bindAddTask(){
    $('#add-task')?.addEventListener('submit', e=>{
      e.preventDefault(); const v=($('#task-input')?.value||'').trim(); if(!v) return;
      const arr=getCoach().tasks||[]; arr.push({id:String(Date.now()), text:v, done:false, createdAt:Date.now()});
      saveTasks(arr); $('#task-input').value=''; renderTasks();
    });
    $('#resetTasks')?.addEventListener('click', ()=>{
      if(!confirm('Reset coach tasks?')) return;
      const s=getCoach(); setCoach({ ...s, tasks: [] }); renderTasks();
    });
  }

  // ---------- export canvas ----------
  function exportPNG(){
    const p=getProfile(); const s=getCoach();
    const action=($('#coach-action')?.textContent||'').trim();
    const tasks=(s.tasks||[]).slice(0,7).map(t=> (t.done?'[✓] ':'[ ] ')+t.text);
    const W=1200,H=900, pad=44, DPR=Math.max(2,Math.floor(devicePixelRatio||2));
    const cvs=document.createElement('canvas'); cvs.width=W*DPR; cvs.height=H*DPR;
    const ctx=cvs.getContext('2d'); ctx.scale(DPR,DPR);
    ctx.fillStyle='#083b3c'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#00fdd8'; ctx.font='700 38px system-ui'; ctx.fillText('Soulink · Coach Plan', pad, 70);
    ctx.font='700 20px system-ui'; ctx.fillText('Essentials', pad, 120);
    ctx.font='16px system-ui'; ctx.fillStyle='#eaf8f6';
    const wes=p.zodiac||p.westernZodiac||westZodiacFrom(p.birthday);
    const lp=p.lifePath||lifePathFrom(p.birthday);
    const ll=Array.isArray(p.loveLanguages)?p.loveLanguages[0]:(p.loveLanguage||'-');
    const lines=[
      `Name: ${p.name||'-'}`, `Connection: ${p.connectionType||'-'}`, `Love Language: ${ll}`,
      `Birth Date: ${p.birthday||'-'}`, `Western Zodiac: ${wes||'-'}`, `Life Path: ${lp||'-'}`
    ];
    let y=146; lines.forEach(t=>{ ctx.fillText(t,pad,y); y+=24; });
    // Action
    ctx.fillStyle='#00fdd8'; ctx.font='700 20px system-ui'; ctx.fillText("Today's Action", 620, 120);
    ctx.fillStyle='#eaf8f6'; ctx.font='18px system-ui'; y = wrap(ctx, action||'—', 620, 146, 540, 26);
    // Tasks
    ctx.fillStyle='#00fdd8'; ctx.font='700 20px system-ui'; ctx.fillText('Tasks', 620, y+28);
    ctx.fillStyle='#eaf8f6'; ctx.font='18px system-ui';
    let yy = y+56; tasks.forEach(t=> yy = wrap(ctx, '• '+t, 620, yy, 540, 26));
    // Footer
    ctx.fillStyle='#bde5df'; ctx.font='16px system-ui';
    const sc=s.streak?.count||0; ctx.fillText(`Streak: ${sc}  ·  ${new Date().toLocaleDateString()}`, pad, H-30);
    const a=document.createElement('a'); a.href=cvs.toDataURL('image/png',1.0);
    const n=(p.name||'my'); a.download=`coach-plan-${n.replace(/\s+/g,'-').toLowerCase()}.png`; a.click();

    function wrap(ctx,text,x,y,maxW,lh){
      const words=(text||'').split(' '); let line='', yy=y;
      for(let i=0;i<words.length;i++){
        const test=line+words[i]+' ';
        if(ctx.measureText(test).width>maxW && i>0){ ctx.fillText(line,x,yy); line=words[i]+' '; yy+=lh; }
        else line=test;
      }
      ctx.fillText(line,x,yy); return yy+lh;
    }
  }

  // ---------- page render ----------
  function fillEssentials(p){
    const set=(id,val)=>{ const el=$(id.startsWith('#')?id:'#'+id); if(el) el.textContent = val ?? '–'; };
    set('c-name', p.name||'–');
    set('c-ct', p.connectionType||'–');
    set('c-ll', Array.isArray(p.loveLanguages)? p.loveLanguages[0] : (p.loveLanguage||'–'));
    set('c-bd', p.birthday||'–');
    set('c-west', p.zodiac||p.westernZodiac||westZodiacFrom(p.birthday));
    set('c-life', p.lifePath||lifePathFrom(p.birthday));
  }

  function renderActionAndInsight(p, forceNew=false){
    // action
    const act = buildAction(p);
    typeInto($('#coach-action'), act, [800,1200]);

    // insight — daily, unless force
    const st=getCoach();
    const last = st.lastInsightAt ? new Date(st.lastInsightAt) : null;
    const now = new Date();
    const shouldNew = forceNew || !last || (now - last) >= 24*3600*1000;
    const insight = shouldNew ? buildInsights(p) : ($('#insightText')?.textContent || buildInsights(p));
    typeInto($('#insightText'), insight, [1400,1800]);
    if(shouldNew) setCoach({...st, lastInsightAt: new Date().toISOString()});
  }

  function toast(msg){
    let n=$('#toast'); if(!n){ n=document.createElement('div'); n.id='toast';
      n.style.cssText='position:fixed;bottom:18px;left:50%;transform:translateX(-50%);padding:10px 14px;border-radius:10px;background:#0a3;box-shadow:0 8px 30px rgba(0,0,0,.25);color:#fff;z-index:9999;opacity:0;transition:.2s'; document.body.appendChild(n); }
    n.textContent=msg; n.style.opacity='1'; setTimeout(()=> n.style.opacity='0', 1200);
    const ann=$('#ann'); if(ann) ann.textContent=msg;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    wireNav();
    wireTooltips();

    // particles
    makeStars($('#actionCard .stars'));
    makeStars($('#insightsCard .stars'));

    const p=getProfile();
    fillEssentials(p);

    // streak init
    renderStreak();
    $('#btnDoneToday')?.addEventListener('click', ()=>{ markDone(); });

    // tasks
    ensureTasks(p);
    renderTasks();
    bindAddTask();

    // action + insight
    renderActionAndInsight(p, true);
    $('#newAction')?.addEventListener('click', ()=>{ renderActionAndInsight(p, true); toast('New suggestion ✨'); });

    // export
    $('#exportCoach')?.addEventListener('click', e=>{ e.preventDefault(); exportPNG(); });
  });
})();
