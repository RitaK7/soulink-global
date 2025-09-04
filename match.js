/* Soulink · Match (UI only). Keeps your data logic intact. */
(()=>{

// ---------- tiny utils ----------
const $ = s => document.querySelector(s);
const READ = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch{ return null; } };
const LS_ME = 'soulQuiz';
const LS_FRIENDS = 'friends';
const escapeHTML = s => String(s??'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

// ---------- normalize helpers ----------
const normList = v => Array.isArray(v) ? v.filter(Boolean) :
  (typeof v==='string' ? v.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean) : []);

const hobbyIcon = t => {
  const s=(t||'').toLowerCase();
  if(s.includes('music'))return'🎵'; if(s.includes('read'))return'📚';
  if(s.includes('medit'))return'🧘'; if(s.includes('travel'))return'✈️';
  if(s.includes('cook'))return'🍳'; if(s.includes('art'))return'🎨';
  if(s.includes('dance'))return'💃'; if(s.includes('garden'))return'🌿';
  return '✨';
};
const valueIcon = t => {
  const s=(t||'').toLowerCase();
  if(s.includes('honest'))return'💎'; if(s.includes('kind'))return'❤️';
  if(s.includes('loyal'))return'🛡️'; if(s.includes('freedom'))return'🌞';
  if(s.includes('growth')||s.includes('adventure'))return'🌱';
  return '⭐';
};

// ---------- Jaccard ----------
function jaccard(a,b){
  const A = new Set(normList(a).map(x=>x.toLowerCase()));
  const B = new Set(normList(b).map(x=>x.toLowerCase()));
  if(!A.size && !B.size) return 0;
  let inter=0; A.forEach(x=>{ if(B.has(x)) inter++; });
  return inter / (A.size + B.size - inter);
}

// ---------- data ----------
function me(){
  const m = READ(LS_ME) || {};
  return {
    name: m.name || '',
    ct: m.connectionType || m.ct || '',
    ll: (Array.isArray(m.loveLanguages)? m.loveLanguages[0] : (m.loveLanguage||'')),
    hobbies: m.hobbies || [],
    values: m.values || [],
  };
}
function friends(){
  const list = READ(LS_FRIENDS);
  return Array.isArray(list) ? list : [];
}

// ---------- scoring ----------
function llMatch(a,b){ if(!a||!b) return 0; return a.trim().toLowerCase()===b.trim().toLowerCase()?1:0; }
function ctMatch(desired,candidate){
  if(!desired||desired==='Any') return 1;
  if(!candidate) return 0;
  if(candidate==='Both' || desired==='Both') return 1;
  return desired.toLowerCase()===candidate.toLowerCase()?1:0;
}
/* 25*LL*W + 15*CT + 30*Jaccard(hobbies) + 30*Jaccard(values) */
function score(me,f,w=1){
  const sLL = 25*llMatch(me.ll,f.ll)*w;
  const sCT = 15*ctMatch(me.ct,f.ct);
  const sH  = 30*jaccard(me.hobbies,f.hobbies);
  const sV  = 30*jaccard(me.values ,f.values);
  let total = sLL+sCT+sH+sV;
  const infoPieces = (f.ll?1:0)+(normList(f.hobbies).length?1:0)+(normList(f.values).length?1:0);
  if(infoPieces<=1) total*=0.8;
  return Math.max(0,Math.min(100,Math.round(total)));
}

// ---------- UI helpers ----------
function avatarFor(name, photo){
  if(photo) return photo;
  const ch = (name||'?').trim().charAt(0).toUpperCase()||'?';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'>
    <defs><radialGradient id='g' cx='50%' cy='50%' r='50%'>
      <stop offset='0%' stop-color='#00fdd8' stop-opacity='.35'/>
      <stop offset='100%' stop-color='#00fdd8' stop-opacity='.05'/>
    </radialGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <circle cx='48' cy='48' r='34' fill='#0a6a6f'/>
    <text x='50%' y='56%' text-anchor='middle' font-size='44' font-family='system-ui' fill='#eaf8f6'>${ch}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
function ring(pct=0){
  const CIRC = 2*Math.PI*32;
  const off  = CIRC * (1 - Math.max(0,Math.min(1,pct/100)));
  return `
    <div class="score-ring" title="Compatibility">
      <svg viewBox="0 0 76 76" aria-hidden="true">
        <circle class="ring-track" cx="38" cy="38" r="32"></circle>
        <circle class="ring-prog" cx="38" cy="38" r="32" stroke-dasharray="${CIRC}" stroke-dashoffset="${off}"></circle>
      </svg>
      <div class="score-num">${pct}<small>%</small></div>
    </div>`;
}
const chipRow = (label, arr, icon)=>
  arr.length? `<div class="row" style="margin-top:.25rem"><b>${label}:</b> ${
    arr.slice(0,8).map(v=>`<span class="chip"><span class="ico">${icon(v)}</span><span>${escapeHTML(v)}</span></span>`).join('')
  }</div>` : '';

// ---------- rendering ----------
const resultsEl = $('#results'), emptyEl = $('#empty');

function render(){
  const m = me();
  $('#me-ct')?.replaceChildren(document.createTextNode(m.ct || '–'));
  $('#me-ll')?.replaceChildren(document.createTextNode(m.ll || '–'));
  $('#me-hobbies')?.replaceChildren(document.createTextNode(normList(m.hobbies).join(', ') || '–'));
  $('#me-values')?.replaceChildren(document.createTextNode(normList(m.values).join(', ') || '–'));

  const list = friends();
  if(!list.length){ resultsEl.innerHTML=''; emptyEl.style.display='block'; return; }

  const q = ($('#f-search')?.value||'').trim().toLowerCase();
  const desiredCT = $('#f-ct')?.value || '';
  const minScore  = parseInt($('#f-min')?.value||'0',10) || 0;
  const weightLL  = parseFloat($('#f-llw')?.value||'1') || 1;

  let rows = list.map(f=>({ f, s: score(m,f,weightLL) }));
  if(q){
    rows = rows.filter(({f})=>{
      const hay = [
        f.name,f.ct,f.ll,f.contact,f.notes,f.whatsapp,f.instagram,f.facebook,f.email,
        ...(Array.isArray(f.hobbies)?f.hobbies:[String(f.hobbies||'')]),
        ...(Array.isArray(f.values)?f.values:[String(f.values||'')]),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  rows = rows.filter(({f,s}) => ctMatch(desiredCT||'Any', f.ct) && s>=minScore);
  rows.sort((a,b)=> b.s - a.s || String(a.f.name||'').localeCompare(String(b.f.name||'')));

  resultsEl.innerHTML='';
  if(!rows.length){ emptyEl.style.display='block'; return; }
  emptyEl.style.display='none';

  rows.forEach(({f,s})=>{
    const hobbies = normList(f.hobbies);
    const values  = normList(f.values);
    const card = document.createElement('div');
    card.className = 'match-card glow-card';
    card.innerHTML = `
      <div class="head">
        <div class="meta">
          <img class="avatar" src="${avatarFor(f.name, f.photo)}" alt="">
          <div style="min-width:0">
            <div class="name">${escapeHTML(f.name||'—')}</div>
            <div class="hint">${escapeHTML(f.ct||'—')} · ${escapeHTML(f.ll||'—')}</div>
          </div>
        </div>
        ${ring(s)}
      </div>
      ${chipRow('Hobbies', hobbies, hobbyIcon)}
      ${chipRow('Values',  values,  valueIcon)}
      <div class="row" style="margin-top:8px">
        <a class="btn ghost" href="friends.html">Edit in Friends</a>
        <a class="btn ghost" href="#">Message</a>
        <a class="btn" href="#">Compare →</a>
      </div>`;
    resultsEl.appendChild(card);
  });
}

// -------- events / filters --------
function bind(){
  ['f-search','f-ct','f-min','f-llw'].forEach(id=>{
    document.getElementById(id)?.addEventListener('input', render);
    document.getElementById(id)?.addEventListener('change', render);
  });
  $('#btn-reset')?.addEventListener('click', ()=>{
    $('#f-search').value=''; $('#f-ct').value='Any';
    $('#f-min').value='0'; $('#f-llw').value='1';
    render();
  });

  // Drawer + navbar like other pages
  const open = $('#openDrawer'), close = $('#closeDrawer'), drawer = $('#drawer'), back = $('#drawerBackdrop');
  const openD=()=>{drawer?.classList.add('open');document.body.classList.add('no-scroll');};
  const closeD=()=>{drawer?.classList.remove('open');document.body.classList.remove('no-scroll');};
  open?.addEventListener('click',openD); close?.addEventListener('click',closeD); back?.addEventListener('click',closeD);
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeD();});
  $('#logoutLink')?.addEventListener('click',e=>{e.preventDefault();localStorage.clear();location.href='index.html';});
  $('#logoutLinkMobile')?.addEventListener('click',e=>{e.preventDefault();localStorage.clear();location.href='index.html';});
}

// ---------- Olia „burbuliukų“ slėpimas (robust) ----------
(function hideDotRows(){
  function isDot(el){
    const txtEmpty=!el.textContent.trim();
    const cs=getComputedStyle(el); const r=el.getBoundingClientRect();
    const small=r.width>8&&r.width<=32&&r.height>8&&r.height<=32;
    const round=(parseFloat(cs.borderRadius||'0')>=Math.min(r.width,r.height)*0.45)||(cs.borderRadius&&cs.borderRadius.endsWith('%'));
    return txtEmpty&&small&&round;
  }
  function run(root){
    if(!root) return;
    root.querySelectorAll('.match-card').forEach(card=>{
      card.querySelectorAll(':scope *').forEach(node=>{
        const kids=[...node.children];
        if(kids.length>=3 && kids.length<=8 && kids.every(isDot)) node.style.display='none';
      });
    });
  }
  const root = $('#results');
  const mo=new MutationObserver(()=>run(root)); mo.observe(root||document.body,{childList:true,subtree:true}); run(root);
})();

// ---------- init ----------
document.addEventListener('DOMContentLoaded', ()=>{ bind(); render(); });

})();
