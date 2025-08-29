// soul-coach.js — clean finisher build
(() => {
  const KEY = 'soulQuiz';
  const KEY_TASKS = 'soulinkCoach';     // tasks storage
  const COACH_KEY = 'soulCoach';        // streak/export helper

  const $ = (s, r=document) => r.querySelector(s);
  const profile = (()=>{ try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}} })();

  // ===== helpers =====
  const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  const sumDigits = s => String(s).replace(/\D/g,'').split('').reduce((a,b)=>a+ +b,0);
  const reduce = n => { while(![11,22,33].includes(n) && n>9) n = sumDigits(String(n)); return n; };
  const lifePathFromDate = iso => (DATE_RE.test(iso||'') ? String(reduce(sumDigits(iso))) : '–');
  const westernZodiacFromDate = iso => {
    if(!DATE_RE.test(iso||'')) return '–';
    const [,m,d] = iso.split('-').map(Number);
    const R = (fm,fd,tm,td)=> (m>fm||m===fm&&d>=fd)&&(m<tm||m===tm&&d<=td);
    if (R(3,21,4,19)) return 'Aries';
    if (R(4,20,5,20)) return 'Taurus';
    if (R(5,21,6,20)) return 'Gemini';
    if (R(6,21,7,22)) return 'Cancer';
    if (R(7,23,8,22)) return 'Leo';
    if (R(8,23,9,22)) return 'Virgo';
    if (R(9,23,10,22))return 'Libra';
    if (R(10,23,11,21))return 'Scorpio';
    if (R(11,22,12,21))return 'Sagittarius';
    if (m===12&&d>=22||m===1&&d<=19) return 'Capricorn';
    if (R(1,20,2,18)) return 'Aquarius';
    return 'Pisces';
  };

  // ===== Navbar drawer small wiring (same as other pages)
  function wireNav(){
    const nav = $('.navbar');
    const onScroll = ()=> nav?.classList[window.scrollY>6?'add':'remove']('scrolled');
    onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
    $('#openDrawer')?.addEventListener('click', ()=>{$('#drawer').classList.add('open'); document.body.classList.add('no-scroll');});
    $('#closeDrawer')?.addEventListener('click', ()=>{$('#drawer').classList.remove('open'); document.body.classList.remove('no-scroll');});
    $('#drawerBackdrop')?.addEventListener('click', ()=>{$('#drawer').classList.remove('open'); document.body.classList.remove('no-scroll');});
    $('#logoutLink')?.addEventListener('click', e=>{e.preventDefault(); localStorage.clear(); location.href='index.html';});
    $('#logoutLinkMobile')?.addEventListener('click', e=>{e.preventDefault(); localStorage.clear(); location.href='index.html';});
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') $('#closeDrawer')?.click(); });
  }

  // ===== Essentials autofill
  function fillEssentials(p){
    const set = (id, val) => { const el=$(id.startsWith('#')?id:'#'+id); if(el) el.textContent = val || '–'; };
    set('c-name', p.name);
    set('c-ct', p.connectionType);
    set('c-ll', Array.isArray(p.loveLanguages)? p.loveLanguages[0] : (p.loveLanguage||''));
    set('c-bd', p.birthday);

    const wes = p.zodiac || p.westernZodiac || westernZodiacFromDate(p.birthday);
    const lp  = p.lifePath || lifePathFromDate(p.birthday);
    set('c-west', wes);
    set('c-life', lp);
  }

  // ===== Insights (typewriter)
  function buildReflection(p){
    const name = p.name || 'You';
    const lls = Array.isArray(p.loveLanguages) ? p.loveLanguages : (p.loveLanguage?[p.loveLanguage]:[]);
    const vals = Array.isArray(p.values)? p.values.slice(0,3) : [];
    const hobs = Array.isArray(p.hobbies)? p.hobbies.slice(0,3) : [];

    const first = lls[0] ? `${name} is nourished by ${lls[0]}${lls[1]?` and ${lls[1]}`:''}, a gentle way the heart speaks.` :
                           `${name} is learning the language of care, one mindful act at a time.`;
    const second = vals.length ? `She carries ${vals.join(', ')} as her quiet compass.` : '';
    const third = hobs.length ? `Daily rituals like ${hobs.join(', ')} refill her spirit.` : '';
    return [first, second, third].filter(Boolean).join(' ');
  }
  function typeInto(el, text){
    if (!el) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { el.textContent = text; return; }
    el.textContent=''; el.classList.remove('show');
    let i=0; const id=setInterval(()=>{ el.textContent = text.slice(0, ++i); if(i>=text.length){clearInterval(id); el.classList.add('show');}}, 18);
  }

  // ===== Today’s Action (LL-driven)
  function makeAction(p){
    const base = [
      "Message someone and ask one sincere question.",
      "Take a 10-minute walk without your phone.",
      "Write three lines about how you want to love & be loved.",
      "Declutter one tiny area (service to future-you).",
      "Invite someone to share a quiet 10-minute check-in."
    ];
    const map = {
      "Words of Affirmation": "Send a heartfelt text with one specific appreciation.",
      "Acts of Service": "Do one task they dislike without being asked.",
      "Receiving Gifts": "Prepare a tiny surprise (note, song link, photo).",
      "Quality Time": "Schedule a 20-minute, no-distraction catch-up.",
      "Physical Touch": "Offer a warm hug or mindful touch (with consent)."
    };
    const ll = Array.isArray(p.loveLanguages)? p.loveLanguages[0] : (p.loveLanguage||'');
    return map[ll] || base[Math.floor(Math.random()*base.length)];
  }
  function setAction(p){ const el = $('#coach-action'); if(el) el.textContent = makeAction(p); }

  // ===== Streak
  const loadCoach = ()=>{ try{return JSON.parse(localStorage.getItem(COACH_KEY)||'{}')}catch{return{}}};
  const saveCoach = s => localStorage.setItem(COACH_KEY, JSON.stringify(s));
  const iso = t => new Date(t).toISOString().slice(0,10);
  function renderStreak(){ const s=loadCoach(); $('#streak').textContent = `🔥 Streak: ${s.streak||0} day${(s.streak||0)==1?'':'s'}`; }
  function markDoneToday(){
    const s=loadCoach(); const t=iso(Date.now()), y=iso(Date.now()-86400000);
    if(s.lastDone===t) return toast('Already checked ✓');
    s.streak = (s.lastDone===y ? (s.streak||0)+1 : 1); s.lastDone=t; saveCoach(s);
    renderStreak(); toast('Nice! Streak +1 ✨');
  }

  // ===== Tasks (merge defaults + custom)
  function loadTasks(){ try{return JSON.parse(localStorage.getItem(KEY_TASKS)||'{}')}catch{return{}} }
  function saveTasks(o){ localStorage.setItem(KEY_TASKS, JSON.stringify(o)); }
  const tasksState = loadTasks();
  if(!Array.isArray(tasksState.tasks)){
    const seed = [];
    const ll = Array.isArray(profile.loveLanguages)? profile.loveLanguages[0] : (profile.loveLanguage||'');
    if(ll) seed.push(`Practice your love language: ${ll}`);
    if(profile.connectionType) seed.push(`Nurture a ${String(profile.connectionType).toLowerCase()} connection`);
    seed.push("Reflect for 5 minutes: what felt good today?");
    tasksState.tasks = seed.map((t,i)=>({id:String(i+1), text:t, done:false}));
    saveTasks(tasksState);
  }
  function renderTasks(){
    const wrap = $('#tasks'); wrap.innerHTML='';
    tasksState.tasks.forEach(t=>{
      const row = document.createElement('div');
      row.className='task'; row.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.04)';
      row.innerHTML = `
        <input type="checkbox" ${t.done?'checked':''} data-id="${t.id}" />
        <span style="flex:1">${t.text}</span>
        <button class="btn" data-del="${t.id}">Remove</button>`;
      wrap.appendChild(row);
    });
    wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        const id = cb.getAttribute('data-id'); const it = tasksState.tasks.find(x=>x.id===id);
        if(it){ it.done = cb.checked; saveTasks(tasksState); }
      });
    });
    wrap.querySelectorAll('[data-del]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id=b.getAttribute('data-del'); const i=tasksState.tasks.findIndex(x=>x.id===id);
        if(i>-1){ tasksState.tasks.splice(i,1); saveTasks(tasksState); renderTasks(); }
      });
    });
  }

  // Add task form
  function bindAddTask(){
    $('#add-task')?.addEventListener('submit', e=>{
      e.preventDefault();
      const inp = $('#task-input'); const v = (inp?.value||'').trim();
      if(!v) return;
      tasksState.tasks.push({id:String(Date.now()), text:v, done:false});
      saveTasks(tasksState); inp.value=''; renderTasks();
    });
    $('#resetTasks')?.addEventListener('click', ()=>{
      if(!confirm('Reset tasks?')) return;
      localStorage.removeItem(KEY_TASKS); location.reload();
    });
  }

  // ===== Toast
  function toast(msg){
    let n = $('#toast');
    if(!n){ n=document.createElement('div'); n.id='toast';
      n.style.cssText='position:fixed;bottom:18px;left:50%;transform:translateX(-50%);padding:10px 14px;border-radius:10px;background:#0a3;box-shadow:0 8px 30px rgba(0,0,0,.25);color:#fff;z-index:9999;opacity:0;transition:.2s';
      document.body.appendChild(n);
    }
    n.textContent=msg; n.style.opacity='1'; setTimeout(()=> n.style.opacity='0', 1200);
  }

  // ===== Export PNG (coach snapshot)
  function exportCoach(){
    const s = loadCoach();
    const action = ($('#coach-action')?.textContent||'').trim();
    const topTasks = (tasksState.tasks||[]).filter(t=>!t.done).map(t=>t.text).slice(0,6);
    const wes = profile.zodiac || profile.westernZodiac || westernZodiacFromDate(profile.birthday);
    const lp  = profile.lifePath || lifePathFromDate(profile.birthday);

    const W=1400, H=900, pad=44, scale=Math.max(2, Math.floor(devicePixelRatio||2));
    const cvs=document.createElement('canvas'); cvs.width=W*scale; cvs.height=H*scale;
    const ctx=cvs.getContext('2d'); ctx.scale(scale,scale);

    ctx.fillStyle='#083b3c'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#00fdd8'; ctx.font='700 40px system-ui'; ctx.fillText('Soulink · Coach Plan', pad, 70);

    ctx.font='700 22px system-ui'; ctx.fillText('Essentials', pad, 120);
    ctx.font='16px system-ui'; ctx.fillStyle='#dff';
    const L=[
      `Name: ${profile.name||'-'}`,
      `Connection: ${profile.connectionType||'-'}`,
      `Love Language: ${Array.isArray(profile.loveLanguages)?profile.loveLanguages[0]:(profile.loveLanguage||'-')}`,
      `Birth Date: ${profile.birthday||'-'}`,
      `Western Zodiac: ${wes||'-'}`,
      `Life Path: ${lp||'-'}`
    ];
    let y=150; L.forEach(t=>{ ctx.fillText(t,pad,y); y+=26; });

    // action
    ctx.fillStyle='#00fdd8'; ctx.font='700 22px system-ui'; ctx.fillText("Today's Action", 600, 120);
    ctx.fillStyle='#dff'; ctx.font='18px system-ui';
    y = wrap(ctx, action||'—', 600, 150, 760, 26);

    // tasks
    ctx.fillStyle='#00fdd8'; ctx.font='700 22px system-ui'; ctx.fillText('Top Tasks', 600, y+30);
    ctx.fillStyle='#dff'; ctx.font='18px system-ui';
    let yy=y+60; topTasks.forEach(t=> yy = wrap(ctx, '• '+t, 600, yy, 760, 26));

    // footer
    ctx.fillStyle='#bff'; ctx.font='16px system-ui';
    ctx.fillText(`Streak: ${s.streak||0} · ${new Date().toLocaleDateString()}`, pad, H-30);

    const a=document.createElement('a'); a.href=cvs.toDataURL('image/png',1.0);
    a.download='soulink-coach-plan.png'; a.click();

    function wrap(ctx,text,x,y,maxW,lh){
      const words=(text||'').split(' '); let line='', yy=y;
      for(let i=0;i<words.length;i++){
        const test=line+words[i]+' ';
        if(ctx.measureText(test).width>maxW && i>0){ ctx.fillText(line,x,yy); line=words[i]+' '; yy+=lh; }
        else line=test;
      }
      ctx.fillText(line, x, yy); return yy+lh;
    }
  }

  // ===== Wire up
  document.addEventListener('DOMContentLoaded', ()=>{
    wireNav();
    fillEssentials(profile);
    setAction(profile);
    renderStreak();
    renderTasks();
    bindAddTask();

    // insight text
    typeInto($('#insightText'), buildReflection(profile));

    $('#newAction')?.addEventListener('click', ()=>{ setAction(profile); toast('New suggestion ready 💡'); });
    $('#btnDoneToday')?.addEventListener('click', markDoneToday);
    $('#exportCoach')?.addEventListener('click', e=>{ e.preventDefault(); exportCoach(); });
  });
})();
